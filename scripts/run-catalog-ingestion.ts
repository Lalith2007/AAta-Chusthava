import 'dotenv/config';
import { ingestionService } from '../src/modules/ingestion/ingestion-service';
import { prisma } from '../src/infrastructure/db/client';

interface IngestionArgs {
  dryRun: boolean;
  languages: Array<'te' | 'hi'>;
  year?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  maxPages: number;
}

function parseArgs(): IngestionArgs {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--live');
  let languages: Array<'te' | 'hi'> = ['te'];
  let year: number | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;
  let limit: number | undefined;
  let maxPages = 3;

  for (const arg of args) {
    if (arg.startsWith('--language=')) {
      const langs = arg.split('=')[1].toLowerCase().split(',');
      languages = langs.filter((l): l is 'te' | 'hi' => l === 'te' || l === 'hi');
    } else if (arg.startsWith('--year=')) {
      year = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--start-date=')) {
      startDate = arg.split('=')[1];
    } else if (arg.startsWith('--end-date=')) {
      endDate = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--max-pages=')) {
      maxPages = parseInt(arg.split('=')[1], 10);
    }
  }

  return { dryRun, languages, year, startDate, endDate, limit, maxPages };
}

async function main() {
  const { dryRun, languages, year, startDate, endDate, limit, maxPages } = parseArgs();

  console.log('============================================================');
  console.log(`🎬 PRODUCTION CATALOG INGESTION PIPELINE [${dryRun ? 'DRY-RUN' : 'LIVE EXECUTION'}]`);
  console.log('============================================================');
  console.log(`Execution Mode:  ${dryRun ? 'DRY-RUN (Simulated, Zero Database Writes)' : 'LIVE (Database Mutations Enabled)'}`);
  console.log(`Languages:       ${languages.map((l) => l.toUpperCase()).join(', ')}`);
  if (year) console.log(`Year:            ${year}`);
  if (startDate) console.log(`Start Date:      ${startDate}`);
  if (endDate) console.log(`End Date:        ${endDate}`);
  if (limit) console.log(`Limit:           ${limit} candidate records`);
  console.log(`Max Pages:       ${maxPages}`);
  console.log('============================================================\n');

  const baselineCount = await prisma.movie.count();
  console.log(`Initial Canonical Movies in DB: ${baselineCount}`);

  const report = await ingestionService.runContinuousDiscovery({
    languages,
    year,
    startDate,
    endDate,
    limit,
    maxPages,
    dryRun,
  });

  const finalCount = await prisma.movie.count();

  console.log('\n============================================================');
  console.log(`📊 INGESTION RUN SUMMARY REPORT [${report.mode}]`);
  console.log('============================================================');
  console.log(`Duration:                      ${(report.durationMs / 1000).toFixed(2)}s`);
  console.log(`Pages Processed:               ${report.discovery.pagesProcessed}`);
  console.log(`Raw Discoveries:               ${report.discovery.rawDiscoveries}`);
  console.log('------------------------------------------------------------');
  console.log('Deduplication:');
  console.log(`- New Discovered Candidates:   ${report.deduplication.newCandidates}`);
  console.log(`- Duplicates Merged:           ${report.deduplication.duplicatesMerged}`);
  console.log(`- Already Processed/Known:     ${report.deduplication.alreadyKnown}`);
  console.log('------------------------------------------------------------');
  console.log('Validation Outcomes:');
  console.log(`- Accepted (Canonical):        ${report.validation.accepted}`);
  console.log(`- Review Required:             ${report.validation.needsReview}`);
  console.log(`- Rejected:                    ${report.validation.rejected}`);
  console.log('------------------------------------------------------------');
  console.log('Enrichment & Posters:');
  console.log(`- Enriched Metadata:           ${report.enrichment.enriched}`);
  console.log(`- TMDB Posters Assigned:       ${report.enrichment.postersAssigned}`);
  console.log(`- Failures:                    ${report.enrichment.failures}`);
  console.log('------------------------------------------------------------');
  console.log('Game Playability Classification:');
  console.log(`- Playable as Guess:           ${report.playability.playableGuess}`);
  console.log(`- Playable as Target:          ${report.playability.playableTarget}`);
  console.log(`- Playable Both:               ${report.playability.playableBoth}`);
  console.log(`- Not Playable:                ${report.playability.notPlayable}`);
  console.log('------------------------------------------------------------');
  console.log('Target Identity Immutability:');
  console.log(`- DailyPuzzle Targets Affected: ${report.targetIntegrity.dailyPuzzlesAffected}`);
  console.log(`- Challenge Targets Affected:   ${report.targetIntegrity.challengesAffected}`);
  console.log(`- Game Targets Affected:        ${report.targetIntegrity.gamesAffected}`);
  console.log(`- Target Integrity Check:       ${report.targetIntegrity.targetIntegrityPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('------------------------------------------------------------');
  console.log(`Canonical Movies: ${baselineCount} -> ${finalCount} (Delta: ${finalCount - baselineCount})`);
  console.log('============================================================\n');

  if (report.errors.length > 0) {
    console.log('⚠️ Sample Errors:');
    for (const err of report.errors.slice(0, 5)) {
      console.log(`- Record [${err.sourceId}]: ${err.error}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during ingestion run:', err);
  process.exit(1);
});
