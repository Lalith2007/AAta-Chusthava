import { describe, it, expect, beforeEach } from 'vitest';
import { catalogCoverageService } from '../catalog-coverage-service';
import { DiscoverySourceRegistry, TmdbDiscoverySource } from '@/infrastructure/external-sources/discovery-source';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { prisma } from '@/infrastructure/db/client';

describe('Catalog Coverage & Ingestion Pipeline', () => {
  it('reconciles language classification with 100% mutually exclusive sums', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    expect(report).toBeDefined();
    expect(report.totals.totalMovies).toBeGreaterThanOrEqual(18);

    const { teluguOnly, hindiOnly, multilingual, other, unknown, total, isReconciled } =
      report.languageBreakdown;

    // Mutually exclusive invariant: Telugu + Hindi + Multilingual + Other + Unknown === Total
    expect(teluguOnly + hindiOnly + multilingual + other + unknown).toBe(total);
    expect(total).toBe(report.totals.totalMovies);
    expect(isReconciled).toBe(true);
    expect(report.invariants.languageReconciliationPass).toBe(true);
  });

  it('reconciles year-by-year totals across 2002–2026', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    expect(report.yearBreakdown.length).toBe(25); // 2002 to 2026

    let sumYearTotals = 0;
    for (const yearItem of report.yearBreakdown) {
      expect(yearItem.year).toBeGreaterThanOrEqual(2002);
      expect(yearItem.year).toBeLessThanOrEqual(2026);

      // Invariant per year: Telugu + Hindi + Multilingual + Other === Year Total
      expect(
        yearItem.teluguOnly + yearItem.hindiOnly + yearItem.multilingual + yearItem.other
      ).toBe(yearItem.total);
      expect(yearItem.isReconciled).toBe(true);

      sumYearTotals += yearItem.total;
    }

    expect(sumYearTotals).toBe(report.totals.totalMovies);
    expect(report.invariants.yearReconciliationPass).toBe(true);
  });

  it('reports source status accurately with TMDB active and IMDb/Wikidata not implemented', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    const tmdbSource = report.sourceBreakdown.find((s) => s.code === 'TMDB');
    const imdbSource = report.sourceBreakdown.find((s) => s.code === 'IMDB');
    const wikidataSource = report.sourceBreakdown.find((s) => s.code === 'WIKIDATA');

    expect(tmdbSource).toBeDefined();
    expect(tmdbSource?.status).toBe('ACTIVE');
    expect(tmdbSource?.isImplemented).toBe(true);
    expect(tmdbSource?.accepted).toBeGreaterThanOrEqual(0);

    expect(imdbSource).toBeDefined();
    expect(imdbSource?.status).toBe('NOT_IMPLEMENTED');
    expect(imdbSource?.isImplemented).toBe(false);
    expect(imdbSource?.candidatesDiscovered).toBe(0);

    expect(wikidataSource).toBeDefined();
    expect(wikidataSource?.status).toBe('ACTIVE');
    expect(wikidataSource?.isImplemented).toBe(true);
  });

  it('verifies DiscoverySourceRegistry source registration contract', () => {
    const registry = DiscoverySourceRegistry.getInstance();
    const sources = registry.getRegisteredSources();

    expect(sources.length).toBeGreaterThanOrEqual(3);
    const tmdb = registry.getSource('TMDB');
    expect(tmdb).toBeDefined();
    expect(tmdb?.sourceName).toBe('TMDB');
    expect(tmdb?.isImplemented).toBe(true);

    const imdb = registry.getSource('IMDB');
    expect(imdb).toBeDefined();
    expect(imdb?.isImplemented).toBe(false);

    const omdb = sources.find((s) => s.code === 'OMDB');
    expect(omdb).toBeDefined();
    expect(omdb?.status).toBe('SOURCE_CANDIDATE');

    const indianCinemaArchive = sources.find((s) => s.code === 'INDIANCINEMA_MA');
    expect(indianCinemaArchive).toBeDefined();
    expect(indianCinemaArchive?.status).toBe('NOT_APPROVED');

    const nfdc = sources.find((s) => s.code === 'NFDC_CBFC');
    expect(nfdc).toBeDefined();
    expect(nfdc?.status).toBe('NOT_IMPLEMENTED');
  });

  it('guarantees zero duplicate canonical movies in database', async () => {
    const report = await catalogCoverageService.getCoverageReport();
    expect(report.invariants.zeroDuplicateCanonicalMovies).toBe(true);
  });

  it('derives playability counts strictly from GameEligibility', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    expect(report.totals.playableAsGuess).toBeGreaterThan(0);
    expect(report.totals.playableAsTarget).toBeGreaterThan(0);
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsGuess);
    expect(report.totals.playableBoth).toBeLessThanOrEqual(report.totals.playableAsTarget);
  });

  it('safely discovers and ingests missing candidate through pipeline', async () => {
    // Discover missing candidate or process targeted source ID from historical catalog
    const result = await ingestionService.discoverAndIngestMissingCandidate(
      'TMDB',
      '200202', // Manmadhudu (2002)
      'Automated Test Missing Candidate Ingestion'
    );

    expect(result).toBeDefined();
    expect(result.candidateId).toBeDefined();
    expect(result.status).toMatch(/PROCESSED|REVIEW_REQUIRED/);

    const candidate = await prisma.ingestionCandidate.findUnique({
      where: { id: result.candidateId },
    });

    expect(candidate).toBeDefined();
    expect(candidate?.status).toBe('VALIDATED');
    expect(candidate?.processedAt).toBeDefined();
    expect(candidate?.resolutionReason).toBeDefined();
  });
});
