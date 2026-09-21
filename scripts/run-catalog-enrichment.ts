import { PrismaClient } from '@prisma/client';
import { enrichmentService } from '../src/modules/enrichment/enrichment-service';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('============================================================');
  console.log(`CATALOG ENRICHMENT & TARGET RECOVERY PIPELINE [${isDryRun ? 'DRY-RUN' : 'LIVE'}]`);
  console.log('============================================================\n');

  const startTime = Date.now();

  const report = await enrichmentService.enrichCatalog({
    dryRun: isDryRun,
    limit,
    onlyNeedsReview: true,
    onProgress: (p) => {
      console.log(
        `[Progress ${p.processed}/${p.total}] Recovered Targets: ${p.recoveredTargets} | Wikidata: ${p.wikidataEnriched} | Both: ${p.bothEnriched} | Current: "${p.currentMovieTitle}"`
      );
    },
  });

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log('\n============================================================');
  console.log('ENRICHMENT SUMMARY REPORT');
  console.log('============================================================');
  console.log(`Total Canonical Movies:             ${report.totalCanonical}`);
  console.log(`Movies Evaluated / Processed:       ${report.totalProcessed}`);
  console.log(`Already Target Playable:            ${report.alreadyTargetPlayable}`);
  console.log(`Previous Needs Review:              ${report.previousNeedsReview}`);
  console.log(`------------------------------------------------------------`);
  console.log(`TMDB Enriched Only:                 ${report.tmdbEnriched}`);
  console.log(`Wikidata Enriched Only:             ${report.wikidataEnriched}`);
  console.log(`Both Sources Enriched:              ${report.bothEnriched}`);
  console.log(`Wikipedia Article Infobox Enriched: ${report.wikipediaArticleEnriched}`);
  console.log(`Unmatched:                          ${report.unmatched}`);
  console.log(`Ambiguous:                          ${report.ambiguous}`);
  console.log(`------------------------------------------------------------`);
  console.log(`NEW TARGET RECOVERIES:              ${report.recoveredTargets}`);
  console.log(`FINAL TARGET PLAYABLE:              ${report.finalTargetPlayable}`);
  console.log(`FINAL GUESS PLAYABLE:               ${report.finalGuessPlayable}`);
  console.log(`REMAINING NEEDS REVIEW:             ${report.remainingNeedsReview}`);
  console.log(`ZERO PLACEHOLDERS VERIFIED:         ${report.zeroPlaceholdersVerified ? 'PASS' : 'FAIL'}`);
  console.log(`DURATION:                           ${durationSec}s`);
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
