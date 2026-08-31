import { describe, it, expect, beforeAll } from 'vitest';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';
import { prisma } from '@/infrastructure/db/client';

describe('Historical Catalog Expansion Pipeline (2002–2026)', () => {
  beforeAll(async () => {
    // Run historical catalog expansion before tests
    await ingestionService.runHistoricalCatalogExpansion({
      startYear: 2002,
      endYear: 2026,
      sources: ['TMDB', 'WIKIDATA'],
      languages: ['te', 'hi'],
      resume: true,
    });
  });

  it('1. Executes batch historical expansion and tracks candidate accounting', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    expect(report.totals.totalMovies).toBeGreaterThanOrEqual(90);
    expect(report.totals.activeMovies).toBe(report.totals.totalMovies);
    expect(report.totals.playableAsGuess).toBe(report.totals.totalMovies);
    expect(report.totals.playableAsTarget).toBe(report.totals.totalMovies);
  });

  it('2. Records persistent DiscoveryCheckpoint entries across years, sources, and languages', async () => {
    const checkpoints = await prisma.discoveryCheckpoint.findMany();

    expect(checkpoints.length).toBeGreaterThan(0);
    const completedCheckpoints = checkpoints.filter((c) => c.status === 'COMPLETED');
    expect(completedCheckpoints.length).toBe(checkpoints.length);

    // Verify checkpoints contain both TMDB and WIKIDATA
    const tmdbCheckpoints = checkpoints.filter((c) => c.source === 'TMDB');
    const wikidataCheckpoints = checkpoints.filter((c) => c.source === 'WIKIDATA');
    expect(tmdbCheckpoints.length).toBeGreaterThan(0);
    expect(wikidataCheckpoints.length).toBeGreaterThan(0);
  });

  it('3. Supports resumable expansion without duplication or errors', async () => {
    const result = await ingestionService.runHistoricalCatalogExpansion({
      startYear: 2002,
      endYear: 2005,
      sources: ['TMDB', 'WIKIDATA'],
      languages: ['te', 'hi'],
      resume: true,
    });

    expect(result).toBeDefined();
    expect(result.totalFailed).toBe(0);
    expect(result.currentCanonicalCount).toBeGreaterThanOrEqual(result.previousCanonicalCount);
  });

  it('4. Newly expanded movies are searchable and active in database', async () => {
    const pushpa = await prisma.movie.findFirst({
      where: {
        primaryTitle: { contains: 'Pushpa', mode: 'insensitive' },
        lifecycleStatus: 'ACTIVE',
      },
      include: { eligibility: true },
    });

    expect(pushpa).toBeDefined();
    expect(pushpa?.releaseYear).toBe(2021);
    expect(pushpa?.eligibility?.playableAsGuess).toBe(true);
    expect(pushpa?.eligibility?.playableAsTarget).toBe(true);

    const kalki = await prisma.movie.findFirst({
      where: {
        primaryTitle: { contains: 'Kalki', mode: 'insensitive' },
        lifecycleStatus: 'ACTIVE',
      },
      include: { eligibility: true },
    });

    expect(kalki).toBeDefined();
    expect(kalki?.releaseYear).toBe(2024);
    expect(kalki?.eligibility?.playableAsTarget).toBe(true);
  });

  it('5. Guarantees 100% strict mathematical reconciliation across all language and year totals', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    // 1. Language sum equals total movies exactly
    const langSum =
      report.languageBreakdown.teluguOnly +
      report.languageBreakdown.hindiOnly +
      report.languageBreakdown.multilingual +
      report.languageBreakdown.other +
      report.languageBreakdown.unknown;
    expect(langSum).toBe(report.totals.totalMovies);

    // 2. Year sum equals total movies exactly
    const yearSum = report.yearBreakdown.reduce((acc, y) => acc + y.total, 0);
    expect(yearSum).toBe(report.totals.totalMovies);

    // 3. Year target playable sum equals total target playable exactly
    const yearTargetSum = report.yearBreakdown.reduce((acc, y) => acc + y.playableTargets, 0);
    expect(yearTargetSum).toBe(report.totals.playableAsTarget);

    // 4. Playable both constraint
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsGuess);
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsTarget);

    // 5. Invariant flags
    expect(report.invariants.languageReconciliationPass).toBe(true);
    expect(report.invariants.yearReconciliationPass).toBe(true);
    expect(report.invariants.sourceMatrixReconciliationPass).toBe(true);
    expect(report.invariants.zeroDuplicateCanonicalMovies).toBe(true);
    expect(report.coverageStatus).toBe('PARTIAL');
  });

  it('6. Reconciles the 4-part source cross-reference matrix (TMDB-only + Wikidata-only + Both + Neither = Total)', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    const sc = report.sourceComparison;

    expect(sc).toBeDefined();
    expect(sc.tmdbOnlyCanonical).toBeGreaterThan(0);
    expect(sc.secondaryOnlyCanonical).toBeGreaterThan(0);
    expect(sc.bothSourcesCanonical).toBeGreaterThanOrEqual(5);
    expect(sc.neitherSourceCanonical).toBeGreaterThanOrEqual(0);

    const matrixSum =
      sc.tmdbOnlyCanonical + sc.secondaryOnlyCanonical + sc.bothSourcesCanonical + sc.neitherSourceCanonical;
    expect(matrixSum).toBe(report.totals.totalMovies);
    expect(sc.sourceMatrixSum).toBe(report.totals.totalMovies);
    expect(sc.sourceMatrixReconciled).toBe(true);
    expect(report.invariants.sourceMatrixReconciliationPass).toBe(true);
  });

  it('7. Verifies the exact baseline 90 -> 100 transition (+10 new canonical movies)', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    const ep = report.expansionProgress;

    expect(ep.previousCanonicalCount).toBe(90);
    expect(ep.currentCanonicalCount).toBe(100);
    expect(ep.newCanonicalContributed).toBe(10);
    expect(ep.previousCanonicalCount + ep.newCanonicalContributed).toBe(ep.currentCanonicalCount);
  });

  it('8. Verifies 100 discovery checkpoints (2 sources x 2 languages x 25 years)', async () => {
    const checkpoints = await prisma.discoveryCheckpoint.findMany();
    expect(checkpoints.length).toBe(100);

    const tmdbTe = checkpoints.filter((c) => c.source === 'TMDB' && c.language === 'te');
    const tmdbHi = checkpoints.filter((c) => c.source === 'TMDB' && c.language === 'hi');
    const wikiTe = checkpoints.filter((c) => c.source === 'WIKIDATA' && c.language === 'te');
    const wikiHi = checkpoints.filter((c) => c.source === 'WIKIDATA' && c.language === 'hi');

    expect(tmdbTe.length).toBe(25);
    expect(tmdbHi.length).toBe(25);
    expect(wikiTe.length).toBe(25);
    expect(wikiHi.length).toBe(25);
  });

  it('9. Preserves honest PARTIAL coverage status after batch expansion', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    expect(report.coverageStatus).toBe('PARTIAL');
    expect(report.coverageStatusDescription).toContain('Catalog actively enriched');
  });
});
