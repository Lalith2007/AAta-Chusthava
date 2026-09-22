#!/usr/bin/env node
/**
 * AAta Chusthava — Sprint 28 Catalog Review & Curation Tool
 *
 * Usage:
 *   npx tsx scripts/run-catalog-review.ts --stats
 *   npx tsx scripts/run-catalog-review.ts --list [--reason=MISSING_CAST_DATA] [--language=te] [--limit=10]
 *   npx tsx scripts/run-catalog-review.ts --inspect=<movieId>
 *   npx tsx scripts/run-catalog-review.ts --approve=<movieId>
 *   npx tsx scripts/run-catalog-review.ts --reject=<movieId> --reason="Invalid entry"
 *   npx tsx scripts/run-catalog-review.ts --return=<movieId>
 *   npx tsx scripts/run-catalog-review.ts --enrich=<movieId>
 *   npx tsx scripts/run-catalog-review.ts --merge --primary=<id> --duplicate=<id>
 *   npx tsx scripts/run-catalog-review.ts --batch [--dry-run | --live] [--limit=10]
 */

import { prisma } from '../src/infrastructure/db/client';
import { catalogReviewService } from '../src/modules/admin/catalog-review-service';

function parseArgs(): Record<string, any> {
  const args = process.argv.slice(2);
  const flags: Record<string, any> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const parts = arg.substring(2).split('=');
      const key = parts[0];
      const val = parts.length > 1 ? parts[1] : true;
      flags[key] = val;
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs();

  console.log('============================================================');
  console.log('🎬 AATA CHUSTHAVA — CATALOG REVIEW & CURATION CLI');
  console.log('============================================================\n');

  try {
    // 1. STATS
    if (flags.stats || Object.keys(flags).length === 0) {
      console.log('📊 Aggregating review queue statistics...');
      const stats = await catalogReviewService.getReviewStats();

      console.log(`\nReview Queue Overview:`);
      console.log(`- Total Pending Review:       ${stats.totalPending}`);
      console.log(`- Playable as Guess:          ${stats.playableAsGuess}`);
      console.log(`- Playable as Target:         ${stats.playableAsTarget}`);
      console.log(`- Playable Both:              ${stats.playableBoth}`);
      console.log(`- Missing Posters:            ${stats.missingPoster}`);
      console.log(`- Missing TMDB IDs:           ${stats.missingTmdb}`);
      console.log(`- Candidate Duplicates:       ${stats.potentialDuplicates}`);

      console.log(`\nPending by Language:`);
      console.log(`- Telugu:                     ${stats.byLanguage.telugu}`);
      console.log(`- Hindi:                      ${stats.byLanguage.hindi}`);

      console.log(`\nPending by Era:`);
      console.log(`- 2002–2009:                  ${stats.byYearGroup['2002-2009']}`);
      console.log(`- 2010–2019:                  ${stats.byYearGroup['2010-2019']}`);
      console.log(`- 2020–2026:                  ${stats.byYearGroup['2020-2026']}`);

      console.log(`\nPending by Clue Deficit / Reason:`);
      for (const [reason, count] of Object.entries(stats.byReason)) {
        console.log(`- ${reason.padEnd(28)}: ${count}`);
      }
      console.log('\n============================================================');
      return;
    }

    // 2. LIST
    if (flags.list) {
      const limit = flags.limit ? parseInt(flags.limit, 10) : 10;
      const page = flags.page ? parseInt(flags.page, 10) : 1;
      const lang = flags.language ? (flags.language.toLowerCase() === 'te' ? 'TELUGU' : 'HINDI') : undefined;

      console.log(`📋 Listing pending review movies (page ${page}, limit ${limit})...\n`);
      const queue = await catalogReviewService.getReviewQueue({
        limit,
        page,
        language: lang,
        reason: flags.reason,
        year: flags.year ? parseInt(flags.year, 10) : undefined,
        search: flags.search,
      });

      console.log(`Found ${queue.total} total items (Showing page ${queue.page}/${queue.totalPages}):\n`);
      for (const item of queue.items) {
        console.log(`[${item.id}] ${item.primaryTitle} (${item.releaseYear})`);
        console.log(`  Languages:  ${item.supportedLanguages.join(', ')}`);
        console.log(`  TMDB ID:    ${item.tmdbId || 'NONE'}`);
        console.log(`  Poster:     ${item.posterAsset ? 'YES' : 'NONE'}`);
        console.log(`  Playable:   Guess=${item.playableAsGuess}, Target=${item.playableAsTarget}`);
        console.log(`  Directors:  ${item.directors.join(', ') || 'NONE'}`);
        console.log(`  Cast:       ${item.leadActors.slice(0, 3).join(', ') || 'NONE'} (${item.leadActors.length} total)`);
        console.log(`  Genres:     ${item.genres.join(', ') || 'NONE'}`);
        console.log(`  Reasons:    ${item.reasons.join(', ')}`);
        console.log(`  Missing:    ${item.missingClues.join(', ') || 'NONE'}`);
        console.log('------------------------------------------------------------');
      }
      return;
    }

    // 3. INSPECT DETAIL
    if (flags.inspect) {
      const movieId = flags.inspect === true ? flags._?.[0] : flags.inspect;
      if (!movieId) {
        console.error('Error: Please provide a movieId to inspect: --inspect=<movieId>');
        process.exit(1);
      }

      console.log(`🔍 Inspecting Movie ID: ${movieId}...\n`);
      const detail = await catalogReviewService.getReviewDetail(movieId);

      console.log(`Canonical Identity:`);
      console.log(`- Title:            ${detail.movie.primaryTitle} (${detail.movie.originalTitle})`);
      console.log(`- Slug:             ${detail.movie.slug}`);
      console.log(`- Release Year:     ${detail.movie.releaseYear}`);
      console.log(`- Release Date:     ${detail.movie.releaseDate || 'UNKNOWN'}`);
      console.log(`- Languages:        ${detail.movie.supportedLanguages.join(', ')}`);
      console.log(`- TMDB ID:          ${detail.movie.tmdbId || 'NONE'}`);
      console.log(`- Poster:           ${detail.movie.posterAsset || 'NONE'}`);
      console.log(`- Lifecycle:        ${detail.movie.lifecycleStatus}`);

      console.log(`\n11-Clue Dimension Breakdown (Score: ${detail.clueAnalysis.score.present}/11):`);
      for (const [key, dim] of Object.entries(detail.clueAnalysis.dimensions)) {
        const statusEmoji = dim.status === 'PRESENT' ? '✅' : dim.status === 'INCOMPLETE' ? '⚠️' : '❌';
        console.log(`  ${statusEmoji} ${dim.label.padEnd(26)} [${dim.status}]: ${dim.value ?? 'None'}`);
      }

      console.log(`\nPlayability Assessment:`);
      console.log(`- Playable as Guess:  ${detail.clueAnalysis.isGuessPlayable ? 'YES' : 'NO'}`);
      console.log(`- Playable as Target: ${detail.clueAnalysis.isTargetPlayable ? 'YES' : 'NO'}`);
      console.log(`- Missing for Target: ${detail.clueAnalysis.missingClues.join(', ') || 'NONE (100% COMPLETE)'}`);

      console.log(`\nTarget Immutability Status:`);
      console.log(`- Daily Puzzles:      ${detail.targetReferences.dailyPuzzles}`);
      console.log(`- Active Challenges:  ${detail.targetReferences.challenges}`);
      console.log(`- Active Games:       ${detail.targetReferences.games}`);
      console.log(`- Is Active Target:   ${detail.targetReferences.isTarget ? '⚠️ YES (IMMUTABLE)' : 'NO'}`);

      if (detail.suspectedDuplicates.length > 0) {
        console.log(`\n⚠️ Suspected Duplicates Found (${detail.suspectedDuplicates.length}):`);
        for (const dup of detail.suspectedDuplicates) {
          console.log(`  - [${dup.matchType} - ${dup.confidence}] ${dup.canonicalMovie.primaryTitle} (${dup.canonicalMovie.releaseYear}) [ID: ${dup.canonicalMovie.id}]`);
        }
      }

      console.log('\n============================================================');
      return;
    }

    // 4. APPROVE
    if (flags.approve) {
      const movieId = flags.approve;
      console.log(`⚡ Approving movie ID: ${movieId}...`);
      const res = await catalogReviewService.approveMovie(movieId, 'cli-admin');
      console.log('✔ Result:', res);
      return;
    }

    // 5. REJECT
    if (flags.reject) {
      const movieId = flags.reject;
      const reason = flags.reason || 'Rejected by CLI operator';
      console.log(`⚡ Rejecting movie ID: ${movieId}... (Reason: ${reason})`);
      const res = await catalogReviewService.rejectMovie(movieId, reason, 'cli-admin');
      console.log('✔ Result:', res);
      return;
    }

    // 6. RETURN TO REVIEW
    if (flags.return) {
      const movieId = flags.return;
      const reason = flags.reason || 'Returned to review queue by CLI operator';
      console.log(`⚡ Returning movie ID: ${movieId} to review queue...`);
      const res = await catalogReviewService.returnMovieToReview(movieId, reason, 'cli-admin');
      console.log('✔ Result:', res);
      return;
    }

    // 7. ENRICH SINGLE MOVIE
    if (flags.enrich) {
      const movieId = flags.enrich;
      console.log(`⚡ Enriching single movie ID: ${movieId}...`);
      const res = await catalogReviewService.enrichSingleMovie(movieId, 'cli-admin');
      console.log('✔ Enrichment Outcome:');
      console.log(`- Title:               ${res.title} (${res.releaseYear})`);
      console.log(`- TMDB Enriched:       ${res.enrichedFromTmdb}`);
      console.log(`- Wikidata Enriched:   ${res.enrichedFromWikidata}`);
      console.log(`- Target Playable:     ${res.previousTargetPlayable} -> ${res.newTargetPlayable}`);
      console.log(`- Recovered as Target: ${res.recoveredTarget}`);
      console.log(`- Cast Added:          ${res.castAdded.length}`);
      console.log(`- Directors Added:     ${res.directorsAdded.length}`);
      console.log(`- Genres Added:        ${res.genresAdded.length}`);
      return;
    }

    // 8. MERGE DUPLICATES
    if (flags.merge) {
      const primary = flags.primary;
      const duplicate = flags.duplicate;
      const reason = flags.reason || 'Duplicate merge from CLI';
      if (!primary || !duplicate) {
        console.error('Error: Please specify --primary=<id> and --duplicate=<id>');
        process.exit(1);
      }
      console.log(`⚡ Merging duplicate [${duplicate}] into primary [${primary}]...`);
      const res = await catalogReviewService.mergeDuplicateMovie(primary, duplicate, 'cli-admin', reason);
      console.log('✔ Merge Complete:', res);
      return;
    }

    // 9. BATCH OPERATIONS
    if (flags.batch) {
      const dryRun = !flags.live;
      const limit = flags.limit ? parseInt(flags.limit, 10) : 20;
      console.log(`⚡ Running batch verification (${dryRun ? 'DRY-RUN (Simulation)' : 'LIVE EXECUTION'}, limit: ${limit})...\n`);
      const report = await catalogReviewService.batchProcessEligibleMovies({
        dryRun,
        limit,
        actorId: 'cli-admin',
      });
      console.log(`Mode:                  ${report.mode}`);
      console.log(`Total Evaluated:       ${report.totalEvaluated}`);
      console.log(`Eligible for Target:   ${report.approvedCount}`);
      console.log(`Remains Incomplete:    ${report.remainsPendingCount}`);
      if (report.approvedMovies.length > 0) {
        console.log(`\nApproved / Target-Eligible Movies:`);
        for (const m of report.approvedMovies) {
          console.log(`- [${m.id}] ${m.title} (${m.releaseYear})`);
        }
      }
      return;
    }

    console.log('Run with --help or --stats to view options.');
  } catch (err: any) {
    console.error('\n❌ Execution Error:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
