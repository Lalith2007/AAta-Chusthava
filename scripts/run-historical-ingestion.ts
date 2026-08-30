import { PrismaClient } from '@prisma/client';
import { ingestionService } from '../src/modules/ingestion/ingestion-service';
import { movieRepository } from '../src/modules/movies/movie-repository';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🚀 RUNNING HISTORICAL TELUGU & HINDI INGESTION (2002-2026)');
  console.log('====================================================\n');

  const startTime = Date.now();

  const res = await ingestionService.runFullHistoricalIngestion(2002, 2026, (progress) => {
    if (progress.year > 0) {
      console.log(`[DISCOVERY] Year ${progress.year} (${progress.lang.toUpperCase()}) -> Discovered: ${progress.discovered}`);
    } else {
      console.log(`[PROCESSING] Candidate ${progress.processed}/${progress.total}`);
    }
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Ingestion execution completed in ${durationSec}s.`);

  // Comprehensive Post-Ingestion Audit
  const totalMovies = await prisma.movie.count();
  const activeMovies = await prisma.movie.count({ where: { lifecycleStatus: 'ACTIVE' } });
  const validationRequired = await prisma.movie.count({ where: { lifecycleStatus: 'VALIDATION_REQUIRED' } });
  const disabled = await prisma.movie.count({ where: { lifecycleStatus: 'DISABLED' } });
  const merged = await prisma.movie.count({ where: { lifecycleStatus: 'MERGED' } });

  const totalCandidates = await prisma.ingestionCandidate.count();
  const discovered = await prisma.ingestionCandidate.count({ where: { status: 'DISCOVERED' } });
  const ingesting = await prisma.ingestionCandidate.count({ where: { status: 'PROCESSING' } });
  const normalized = await prisma.ingestionCandidate.count({ where: { status: 'NORMALIZED' } });
  const rejected = await prisma.ingestionCandidate.count({ where: { status: 'REJECTED' } });
  const failed = await prisma.ingestionCandidate.count({ where: { status: 'FAILED' } });

  const allMovies = await prisma.movie.findMany({
    include: {
      eligibility: true,
      people: { include: { person: true } },
      productionHouses: true,
      genres: true,
    },
    orderBy: { releaseYear: 'asc' },
  });

  const playableAsGuess = allMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const playableAsTarget = allMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const playableBoth = allMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;
  const needsReview = allMovies.filter((m) => m.eligibility?.reviewStatus === 'PENDING').length;

  // Language counts
  let teluguCount = 0;
  let hindiCount = 0;
  for (const m of allMovies) {
    if (m.supportedLanguages.includes('TELUGU')) teluguCount++;
    if (m.supportedLanguages.includes('HINDI')) hindiCount++;
  }

  // Year breakdown
  const yearDistribution: Record<number, { telugu: number; hindi: number; total: number }> = {};
  for (let y = 2002; y <= 2026; y++) {
    yearDistribution[y] = { telugu: 0, hindi: 0, total: 0 };
  }

  for (const m of allMovies) {
    if (!yearDistribution[m.releaseYear]) {
      yearDistribution[m.releaseYear] = { telugu: 0, hindi: 0, total: 0 };
    }
    yearDistribution[m.releaseYear].total++;
    if (m.supportedLanguages.includes('TELUGU')) yearDistribution[m.releaseYear].telugu++;
    if (m.supportedLanguages.includes('HINDI')) yearDistribution[m.releaseYear].hindi++;
  }

  console.log('\n====================================================');
  console.log('📊 POST-INGESTION AUDIT METRICS');
  console.log('====================================================');
  console.log(`TOTAL MOVIES: ${totalMovies}`);
  console.log(`ACTIVE: ${activeMovies}`);
  console.log(`PLAYABLE GUESSES: ${playableAsGuess}`);
  console.log(`PLAYABLE TARGETS: ${playableAsTarget}`);
  console.log(`PLAYABLE BOTH: ${playableBoth}`);
  console.log(`NEEDS REVIEW: ${needsReview}`);
  console.log(`REJECTED: ${rejected}`);
  console.log(`DISABLED: ${disabled}`);
  console.log(`MERGED: ${merged}`);
  console.log(`\nTELUGU MOVIES: ${teluguCount}`);
  console.log(`HINDI MOVIES: ${hindiCount}`);

  console.log('\n--- YEAR-BY-YEAR DISTRIBUTION (2002-2026) ---');
  for (let y = 2002; y <= 2026; y++) {
    const data = yearDistribution[y];
    console.log(`${y}: Total=${data.total} (Telugu=${data.telugu}, Hindi=${data.hindi})`);
  }

  // Verify Search functionality
  console.log('\n--- SEARCH INDEX VERIFICATION ---');
  const searchSample = await movieRepository.search('Baahubali', { limit: 5 });
  console.log(`Search for "Baahubali": found ${searchSample.length} results.`);
  for (const s of searchSample) {
    console.log(`  - [${s.primaryTitle} (${s.releaseYear})]: Guess=${s.playableAsGuess}, Target=${s.playableAsTarget}`);
  }

  const searchDevdas = await movieRepository.search('Devdas', { limit: 5 });
  console.log(`Search for "Devdas": found ${searchDevdas.length} results.`);
  for (const s of searchDevdas) {
    console.log(`  - [${s.primaryTitle} (${s.releaseYear})]: Guess=${s.playableAsGuess}, Target=${s.playableAsTarget}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
