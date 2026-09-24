import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';
import { personEnrichmentService } from '../src/modules/enrichment/person-enrichment-service';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetOnly = args.includes('--target-only');
  const noRecoverIdentity = args.includes('--no-recover-identity');
  const recoverIdentity = !noRecoverIdentity;
  const rolesArg = args.find((a) => a.startsWith('--roles='));
  const roles = rolesArg
    ? (rolesArg.split('=')[1].split(',') as ('DIRECTOR' | 'LEAD' | 'SUPPORTING')[])
    : undefined;
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const skipArg = args.find((a) => a.startsWith('--skip='));
  const skip = skipArg ? parseInt(skipArg.split('=')[1], 10) : undefined;
  const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 5;

  const isConfigured = tmdbAdapter.isConfigured();

  console.log('============================================================');
  console.log('AAta CHUSTHAVA — PERSON PROFILE IMAGE ENRICHMENT PIPELINE');
  console.log('============================================================');
  console.log(`Mode:             ${dryRun ? 'DRY-RUN (No Database Writes)' : 'LIVE EXECUTION'}`);
  console.log(`Target Only:      ${targetOnly ? 'YES (Target Playable Persons Only)' : 'NO (All Active Persons)'}`);
  console.log(`Roles:            ${roles ? roles.join(', ') : 'ALL Roles'}`);
  console.log(`Recover Identity: ${recoverIdentity ? 'YES (Search TMDB by Name + Filmography)' : 'NO (TMDB ID Only)'}`);
  console.log(`Limit:            ${limit ? limit : 'ALL Candidate Persons'}`);
  console.log(`Skip:             ${skip ? skip : '0'}`);
  console.log(`Concurrency:      ${concurrency}`);
  console.log(`TMDB Configured:  ${isConfigured ? 'YES (Live API Credentials Present)' : 'NO (Mock / Local Fallback)'}`);
  console.log('============================================================\n');

  const startTime = Date.now();

  const report = await personEnrichmentService.enrichAllMissingPersonImages({
    dryRun,
    targetOnly,
    roles,
    recoverIdentity,
    limit,
    skip,
    concurrency,
    onProgress: (p) => {
      if (p.processed % 25 === 0 || p.processed === p.total) {
        const pct = Math.round((p.processed / p.total) * 100);
        console.log(
          `[Progress ${pct}%] (${p.processed}/${p.total}) | Enriched: ${p.successfullyEnriched} | No Image: ${p.noImageAvailable} | Failures: ${p.failures} | Current: "${p.currentPersonName}"`
        );
      }
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n============================================================');
  console.log('PERSON IMAGE ENRICHMENT SUMMARY REPORT');
  console.log('============================================================');
  console.log(`Total Persons:                       ${report.totalPersons}`);
  console.log(`Candidates Identified:               ${report.totalCandidates}`);
  console.log(`Candidates Processed:                ${report.totalProcessed}`);
  console.log(`Successfully Enriched:               ${report.successfullyEnriched}`);
  console.log(`Already Had Valid Image:             ${report.alreadyHadImage}`);
  console.log(`No Image Available on TMDB:          ${report.noImageAvailable}`);
  console.log(`Lookup Failures:                     ${report.lookupFailures}`);
  console.log(`Remaining Candidates:                ${report.remainingCandidates}`);
  console.log(`Execution Duration:                  ${durationSec}s`);
  console.log('============================================================\n');

  const enrichedSamples = report.results.filter((r) => r.status === 'ENRICHED').slice(0, 10);
  if (enrichedSamples.length > 0) {
    console.log('--- SAMPLE ENRICHED PERSONS ---');
    for (const r of enrichedSamples) {
      console.log(`[ENRICHED] ${r.name} (tmdbId: ${r.tmdbId}) -> ${r.newImage}`);
    }
    console.log('');
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Person enrichment failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
