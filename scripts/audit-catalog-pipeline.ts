import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';

async function main() {
  console.log('============================================================');
  console.log('🔍 PRODUCTION CATALOG PIPELINE AUDIT REPORT');
  console.log('============================================================\n');

  // 1. Movies & Lifecycle
  const totalMovies = await prisma.movie.count();
  const activeMovies = await prisma.movie.count({ where: { lifecycleStatus: 'ACTIVE' } });
  const disabledMovies = await prisma.movie.count({ where: { lifecycleStatus: 'DISABLED' } });
  const rejectedMovies = await prisma.movie.count({ where: { lifecycleStatus: 'REJECTED' } });

  console.log('Catalog Totals:');
  console.log(`- Total Canonical Movies:      ${totalMovies}`);
  console.log(`- Active Movies:               ${activeMovies}`);
  console.log(`- Disabled Movies:             ${disabledMovies}`);
  console.log(`- Rejected Movies:             ${rejectedMovies}`);
  console.log('------------------------------------------------------------');

  // 2. Playability Breakdown
  const playableGuess = await prisma.gameEligibility.count({ where: { playableAsGuess: true } });
  const playableTarget = await prisma.gameEligibility.count({ where: { playableAsTarget: true } });
  const playableBoth = await prisma.gameEligibility.count({
    where: { playableAsGuess: true, playableAsTarget: true },
  });
  const pendingReview = await prisma.gameEligibility.count({ where: { reviewStatus: 'PENDING' } });
  const approvedReview = await prisma.gameEligibility.count({ where: { reviewStatus: 'APPROVED' } });

  console.log('Game Playability:');
  console.log(`- Playable as Guess:           ${playableGuess}`);
  console.log(`- Playable as Target:          ${playableTarget}`);
  console.log(`- Playable Both:               ${playableBoth}`);
  console.log(`- In Review Queue (Pending):   ${pendingReview}`);
  console.log(`- Review Approved:             ${approvedReview}`);
  console.log('------------------------------------------------------------');

  // 3. Language Breakdown
  const teluguMovies = await prisma.movie.count({
    where: { supportedLanguages: { has: 'TELUGU' }, lifecycleStatus: 'ACTIVE' },
  });
  const hindiMovies = await prisma.movie.count({
    where: { supportedLanguages: { has: 'HINDI' }, lifecycleStatus: 'ACTIVE' },
  });

  console.log('Language Breakdown:');
  console.log(`- Telugu Movies:               ${teluguMovies}`);
  console.log(`- Hindi Movies:                ${hindiMovies}`);
  console.log('------------------------------------------------------------');

  // 4. Ingestion Candidates Breakdown
  const totalCandidates = await prisma.ingestionCandidate.count();
  const discoveredCandidates = await prisma.ingestionCandidate.count({ where: { status: 'DISCOVERED' } });
  const validatedCandidates = await prisma.ingestionCandidate.count({ where: { status: 'VALIDATED' } });
  const duplicateCandidates = await prisma.ingestionCandidate.count({ where: { status: 'DUPLICATE' } });
  const failedCandidates = await prisma.ingestionCandidate.count({ where: { status: 'FAILED' } });
  const rejectedCandidates = await prisma.ingestionCandidate.count({ where: { status: 'REJECTED' } });

  console.log('Ingestion Candidates:');
  console.log(`- Total Candidates:            ${totalCandidates}`);
  console.log(`- Discovered (Pending):        ${discoveredCandidates}`);
  console.log(`- Validated:                   ${validatedCandidates}`);
  console.log(`- Duplicate Matches:           ${duplicateCandidates}`);
  console.log(`- Failed:                      ${failedCandidates}`);
  console.log(`- Rejected:                    ${rejectedCandidates}`);
  console.log('------------------------------------------------------------');

  // 5. Posters Integrity
  const moviesWithPoster = await prisma.movie.count({
    where: { posterAsset: { not: null }, lifecycleStatus: 'ACTIVE' },
  });
  const allMovies = await prisma.movie.findMany({
    where: { posterAsset: { not: null } },
    select: { id: true, posterAsset: true },
  });
  const malformedPosters = allMovies.filter(
    (m) => m.posterAsset && !m.posterAsset.startsWith('http://') && !m.posterAsset.startsWith('https://')
  );

  console.log('Poster Integrity:');
  console.log(`- Movies With Valid Poster:    ${moviesWithPoster}`);
  console.log(`- Movies Without Poster:       ${activeMovies - moviesWithPoster}`);
  console.log(`- Malformed Poster URLs:       ${malformedPosters.length}`);
  console.log('------------------------------------------------------------');

  // 6. Target Integrity Check
  const scheduledPuzzles = await prisma.dailyPuzzle.count();
  const activeChallenges = await prisma.challenge.count();
  const activeGames = await prisma.game.count();

  // Ensure all scheduled puzzle target movies exist and are active
  const puzzlesWithMissingTargets = await prisma.dailyPuzzle.count({
    where: { targetMovie: { lifecycleStatus: { not: 'ACTIVE' } } },
  });
  const challengesWithMissingTargets = await prisma.challenge.count({
    where: { targetMovie: { lifecycleStatus: { not: 'ACTIVE' } } },
  });
  const gamesWithMissingTargets = await prisma.game.count({
    where: { targetMovie: { lifecycleStatus: { not: 'ACTIVE' } } },
  });

  const targetsIntact =
    puzzlesWithMissingTargets === 0 &&
    challengesWithMissingTargets === 0 &&
    gamesWithMissingTargets === 0;

  console.log('Target Integrity (Game / Daily / Challenge):');
  console.log(`- Total Scheduled DailyPuzzles: ${scheduledPuzzles}`);
  console.log(`- Total Active Challenges:      ${activeChallenges}`);
  console.log(`- Total Active Games:           ${activeGames}`);
  console.log(`- Target Consistency Check:     ${targetsIntact ? '✅ 100% INTACT' : '❌ CORRUPTED TARGETS FOUND'}`);
  console.log('------------------------------------------------------------');

  // 7. Duplicate Checks
  const movies = await prisma.movie.findMany({
    select: { id: true, primaryTitle: true, releaseYear: true, tmdbId: true },
  });
  const seenTmdb = new Set<number>();
  let duplicateTmdbCount = 0;
  const seenTitleYear = new Set<string>();
  let duplicateTitleYearCount = 0;

  for (const m of movies) {
    if (m.tmdbId) {
      if (seenTmdb.has(m.tmdbId)) duplicateTmdbCount++;
      else seenTmdb.add(m.tmdbId);
    }
    const key = `${m.primaryTitle.toLowerCase().trim()}_${m.releaseYear}`;
    if (seenTitleYear.has(key)) duplicateTitleYearCount++;
    else seenTitleYear.add(key);
  }

  console.log('Catalog Deduplication Verification:');
  console.log(`- Duplicate TMDB IDs:          ${duplicateTmdbCount} ${duplicateTmdbCount === 0 ? '✅' : '❌'}`);
  console.log(`- Duplicate Title+Year Pairs:  ${duplicateTitleYearCount} ${duplicateTitleYearCount === 0 ? '✅' : '❌'}`);
  console.log('============================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
