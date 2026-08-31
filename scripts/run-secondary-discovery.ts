import { ingestionService } from '../src/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '../src/modules/catalog/catalog-coverage-service';
import { prisma } from '../src/infrastructure/db/client';

async function main() {
  console.log('====================================================');
  console.log('🚀 RUNNING SECONDARY DISCOVERY (WIKIDATA 2002–2026)');
  console.log('====================================================\n');

  const beforeReport = await catalogCoverageService.getCoverageReport();
  console.log(`Initial Canonical Movies in DB: ${beforeReport.totals.totalMovies}`);
  console.log(`Initial TMDB Candidates:        ${beforeReport.sourceComparison.tmdbCandidates}`);

  // Run secondary historical ingestion
  const res = await ingestionService.runSecondaryHistoricalIngestion('WIKIDATA', 2002, 2026);

  console.log('\n====================================================');
  console.log('📊 SECONDARY INGESTION RESULTS');
  console.log('====================================================');
  console.log(`Source:                         ${res.source}`);
  console.log(`Candidates Discovered:          ${res.totalDiscovered}`);
  console.log(`Candidates Processed:           ${res.totalProcessed}`);
  console.log(`New Canonical Movies Created:   ${res.newMoviesCreated}`);
  console.log(`Duplicates Identified & Merged: ${res.duplicatesMerged}`);

  console.log('\n--- Candidate Resolution Breakdown ---');
  for (const r of res.results) {
    const icon = r.isNewCanonicalMovie ? '✨ NEW' : r.isDuplicate ? '🔗 DUPLICATE' : '⚠️ OTHER';
    console.log(`[${icon}] ${r.title} (Status: ${r.status}, Reason: ${r.reason || 'None'})`);
  }

  const afterReport = await catalogCoverageService.getCoverageReport();
  console.log('\n====================================================');
  console.log('🔍 RECONCILED POST-EXPANSION METRICS');
  console.log('====================================================');
  console.log(`Total Canonical Movies:         ${afterReport.totals.totalMovies}`);
  console.log(`Active Playable Movies:         ${afterReport.totals.activeMovies}`);
  console.log(`Playable Both (Guess & Target): ${afterReport.totals.playableBoth}`);
  console.log(`Telugu Only:                    ${afterReport.languageBreakdown.teluguOnly}`);
  console.log(`Hindi Only:                     ${afterReport.languageBreakdown.hindiOnly}`);
  console.log(`Multilingual:                   ${afterReport.languageBreakdown.multilingual}`);
  console.log(`Other:                          ${afterReport.languageBreakdown.other}`);
  console.log(`Language Reconciled:            ${afterReport.invariants.languageReconciliationPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Year Totals Reconciled:         ${afterReport.invariants.yearReconciliationPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Zero Duplicate Canonical Movies:${afterReport.invariants.zeroDuplicateCanonicalMovies ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`TMDB Only Canonical Movies:     ${afterReport.sourceComparison.tmdbOnlyCanonical}`);
  console.log(`Secondary Only Canonical Movies:${afterReport.sourceComparison.secondaryOnlyCanonical}`);
  console.log(`Both Sources Cross-Referenced:  ${afterReport.sourceComparison.bothSourcesCanonical}`);
  console.log(`Coverage Status:                ${afterReport.coverageStatus}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal secondary discovery error:', err);
  process.exit(1);
});
