import { prisma } from '../src/infrastructure/db/client';
import { posterEnrichmentService } from '../src/modules/enrichment/poster-enrichment-service';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 5;

  console.log('============================================================');
  console.log('AAta CHUSTHAVA — REAL MOVIE POSTER ENRICHMENT PIPELINE');
  console.log('============================================================');
  console.log(`Mode:        ${dryRun ? 'DRY-RUN (No Database Writes)' : 'LIVE EXECUTION'}`);
  console.log(`Limit:       ${limit ? limit : 'ALL Candidate Records'}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log('============================================================\n');

  const startTime = Date.now();

  const report = await posterEnrichmentService.enrichAllMissingPosters({
    dryRun,
    limit,
    concurrency,
    onProgress: (p) => {
      if (p.processed % 25 === 0 || p.processed === p.total) {
        const pct = Math.round((p.processed / p.total) * 100);
        console.log(
          `[Progress ${pct}%] (${p.processed}/${p.total}) | Enriched: ${p.successfullyEnriched} | No Poster: ${p.noPosterAvailable} | Failures: ${p.lookupFailures} | Current: "${p.currentMovieTitle}"`
        );
      }
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n============================================================');
  console.log('POSTER ENRICHMENT SUMMARY REPORT');
  console.log('============================================================');
  console.log(`Total Active Movies:             ${report.totalActiveMovies}`);
  console.log(`Total Candidates Identified:     ${report.totalCandidates}`);
  console.log(`Total Candidates Processed:      ${report.totalProcessed}`);
  console.log(`Successfully Enriched:           ${report.successfullyEnriched}`);
  console.log(`Already Had Valid Poster:        ${report.alreadyHadPoster}`);
  console.log(`No Poster Available on TMDB:     ${report.noPosterAvailable}`);
  console.log(`Lookup / Network Failures:       ${report.lookupFailures}`);
  console.log(`Rate-Limited Failures:           ${report.rateLimitedFailures}`);
  console.log(`Remaining Candidates:            ${report.remainingCandidates}`);
  console.log(`Execution Duration:              ${durationSec}s`);
  console.log('============================================================\n');

  if (report.results.length > 0) {
    console.log('--- SAMPLE ENRICHED RECORDS ---');
    const enrichedSamples = report.results.filter((r) => r.status === 'ENRICHED').slice(0, 10);
    for (const r of enrichedSamples) {
      console.log(`[ENRICHED] ${r.title} (${r.releaseYear}) -> ${r.newPosterAsset}`);
    }
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Poster enrichment failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
