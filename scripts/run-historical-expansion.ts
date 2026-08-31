import { ingestionService } from '../src/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '../src/modules/catalog/catalog-coverage-service';
import { prisma } from '../src/infrastructure/db/client';

async function main() {
  console.log('========================================================================');
  console.log('🚀 EXECUTING SYSTEMATIC HISTORICAL CATALOG EXPANSION (2002–2026)');
  console.log('========================================================================\n');

  const beforeReport = await catalogCoverageService.getCoverageReport();
  console.log(`Initial Canonical Movies in PostgreSQL: ${beforeReport.totals.totalMovies}`);
  console.log(`Initial TMDB Candidates:               ${beforeReport.sourceComparison.tmdbCandidates}`);
  console.log(`Initial Wikidata Candidates:           ${beforeReport.sourceComparison.secondaryCandidates}\n`);

  console.log('Starting paginated & batched discovery across Telugu and Hindi from 2002 to 2026...\n');

  const report = await ingestionService.runHistoricalCatalogExpansion({
    startYear: 2002,
    endYear: 2026,
    sources: ['TMDB', 'WIKIDATA'],
    languages: ['te', 'hi'],
    resume: process.argv.includes('--resume'),
    onProgress: (p) => {
      if (p.stage === 'CHECKPOINT') {
        console.log(`[CHECKPOINT] ${p.source} ${p.language.toUpperCase()} ${p.year} completed (New Movies: ${p.newMoviesCreated}, Duplicates: ${p.duplicatesMerged})`);
      }
    },
  });

  console.log('\n========================================================================');
  console.log('📊 HISTORICAL EXPANSION BATCH RESULTS');
  console.log('========================================================================');
  console.log(`Years Covered:                 ${report.startYear} → ${report.endYear}`);
  console.log(`Sources:                       ${report.sources.join(', ')}`);
  console.log(`Languages:                     ${report.languages.join(', ')}`);
  console.log(`Total Candidates Discovered:   ${report.totalDiscovered}`);
  console.log(`Total Candidates Processed:    ${report.totalProcessed}`);
  console.log(`New Canonical Movies Created:  ${report.newCanonicalMoviesAdded}`);
  console.log(`Duplicates Merged:             ${report.totalDuplicatesMerged}`);
  console.log(`Review Required:               ${report.totalReviewRequired}`);
  console.log(`Failed:                        ${report.totalFailed}`);
  console.log(`Checkpoints Saved:             ${report.checkpointsSaved}`);
  console.log(`Execution Time:                ${(report.durationMs / 1000).toFixed(2)}s`);

  const afterReport = await catalogCoverageService.getCoverageReport();
  console.log('\n========================================================================');
  console.log('🔍 AUTHORITATIVE RECONCILED DATABASE POST-EXPANSION METRICS');
  console.log('========================================================================');
  console.log(`Previous Canonical Count:      ${report.previousCanonicalCount}`);
  console.log(`New Canonical Added:           ${report.newCanonicalMoviesAdded}`);
  console.log(`Current Canonical Movies:      ${afterReport.totals.totalMovies}`);
  console.log(`Active Playable Movies:        ${afterReport.totals.activeMovies}`);
  console.log(`Playable as Guess:             ${afterReport.totals.playableAsGuess}`);
  console.log(`Playable as Target:            ${afterReport.totals.playableAsTarget}`);
  console.log(`Playable Both:                 ${afterReport.totals.playableBoth}`);
  console.log(`Needs Review:                  ${afterReport.totals.needsReview}`);
  console.log(`Rejected:                      ${afterReport.totals.rejected}`);
  console.log(`Disabled:                      ${afterReport.totals.disabled}`);
  console.log(`Merged:                        ${afterReport.totals.merged}`);

  console.log('\n--- Language Breakdown ---');
  console.log(`Telugu Only:                   ${afterReport.languageBreakdown.teluguOnly}`);
  console.log(`Hindi Only:                    ${afterReport.languageBreakdown.hindiOnly}`);
  console.log(`Multilingual:                  ${afterReport.languageBreakdown.multilingual}`);
  console.log(`Other:                         ${afterReport.languageBreakdown.other}`);
  console.log(`Unknown:                       ${afterReport.languageBreakdown.unknown}`);
  console.log(`Language Reconciled:           ${afterReport.invariants.languageReconciliationPass ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n--- Mathematical Invariants ---');
  console.log(`Year Totals Reconciled:        ${afterReport.invariants.yearReconciliationPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Zero Duplicate Movies:         ${afterReport.invariants.zeroDuplicateCanonicalMovies ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Coverage Status:               ${afterReport.coverageStatus}`);

  console.log('\n--- Source Cross-Reference Matrix ---');
  console.log(`TMDB Only Canonical:           ${afterReport.sourceComparison.tmdbOnlyCanonical}`);
  console.log(`Secondary Only Canonical:      ${afterReport.sourceComparison.secondaryOnlyCanonical}`);
  console.log(`Both Sources Cross-Referenced: ${afterReport.sourceComparison.bothSourcesCanonical}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during historical expansion:', err);
  process.exit(1);
});
