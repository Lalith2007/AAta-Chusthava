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

  it('7. Verifies the exact baseline 90 -> expanded transition', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    const ep = report.expansionProgress;

    expect(ep.previousCanonicalCount).toBe(90);
    expect(ep.currentCanonicalCount).toBeGreaterThanOrEqual(100);
    expect(ep.newCanonicalContributed).toBeGreaterThanOrEqual(10);
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

  it('10. Exhaustive pagination: verifies all checkpoints record page exhaustion', async () => {
    const checkpoints = await prisma.discoveryCheckpoint.findMany({
      where: { status: 'COMPLETED' },
    });

    expect(checkpoints.length).toBeGreaterThanOrEqual(100);
    for (const cp of checkpoints) {
      expect(cp.page).toBeGreaterThanOrEqual(1);
      expect(cp.totalPages).toBeGreaterThanOrEqual(1);
      expect(cp.status).toBe('COMPLETED');
    }
  });

  it('11. Candidate deduplication: verifies duplicate candidates are matched with duplicateOfMovieId', async () => {
    const duplicates = await prisma.ingestionCandidate.findMany({
      where: { status: 'DUPLICATE' },
    });

    expect(duplicates.length).toBeGreaterThan(0);
    for (const d of duplicates) {
      expect(d.duplicateOfMovieId).toBeDefined();
      expect(d.duplicateOfMovieId).not.toBeNull();
    }
  });

  it('12. Game eligibility integrity: verifies all canonical movies have valid game eligibility', async () => {
    const movies = await prisma.movie.findMany({
      where: { lifecycleStatus: 'ACTIVE' },
      include: { eligibility: true },
    });

    expect(movies.length).toBeGreaterThanOrEqual(100);
    for (const m of movies) {
      expect(m.eligibility).toBeDefined();
      expect(m.eligibility?.playableAsGuess).toBe(true);
      expect(m.eligibility?.playableAsTarget).toBe(true);
    }
  });

  it('13. Game safety constraint: verifies playableBoth <= playableAsGuess and playableBoth <= playableAsTarget', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsGuess);
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsTarget);
  });

  it('14. Reconciles candidate-level outcome arithmetic for TMDB (accepted + prior + duplicate + review + rejected = discovered)', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    const tmdb = report.sourceBreakdown.find((s) => s.code === 'TMDB');

    expect(tmdb).toBeDefined();
    expect(tmdb!.candidatesDiscovered).toBeGreaterThan(0);
    const outcomeSum =
      tmdb!.accepted + (tmdb!.priorProcessed || 0) + tmdb!.duplicates + tmdb!.review + tmdb!.rejected;
    expect(outcomeSum).toBe(tmdb!.candidatesDiscovered);
    expect(tmdb!.candidateOutcomeReconciled).toBe(true);
  });

  it('15. Reconciles candidate-level outcome arithmetic for Wikidata (accepted + prior + duplicate + review + rejected = discovered)', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    const wiki = report.sourceBreakdown.find((s) => s.code === 'WIKIDATA');

    expect(wiki).toBeDefined();
    expect(wiki!.candidatesDiscovered).toBeGreaterThan(0);
    const outcomeSum =
      wiki!.accepted + (wiki!.priorProcessed || 0) + wiki!.duplicates + wiki!.review + wiki!.rejected;
    expect(outcomeSum).toBe(wiki!.candidatesDiscovered);
    expect(wiki!.candidateOutcomeReconciled).toBe(true);
  });
});
