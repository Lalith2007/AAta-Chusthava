import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { DiscoverySourceRegistry } from '@/infrastructure/external-sources/discovery-source';
import { wikidataDiscoveryAdapter } from '@/infrastructure/external-sources/wikidata-adapter';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';

describe('Secondary Movie Discovery Source (Wikidata / Open Knowledge Graph)', () => {
  beforeAll(async () => {
    // Clean up test candidate and movie to ensure fresh deterministic test run
    await prisma.ingestionCandidate.deleteMany({
      where: {
        source: 'WIKIDATA',
        sourceMovieId: { in: ['Q4699313', 'Q20649372'] },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        wikidataId: 'Q4699313',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Wikidata adapter correctly implements the MovieDiscoverySource contract', async () => {
    expect(wikidataDiscoveryAdapter.sourceName).toBe('WIKIDATA');
    expect(wikidataDiscoveryAdapter.isImplemented).toBe(true);
    expect(wikidataDiscoveryAdapter.status).toBe('ACTIVE');

    // Discover Telugu movies for 2003
    const discovery = await wikidataDiscoveryAdapter.discover({ language: 'te', year: 2003 });
    expect(discovery.results.length).toBeGreaterThan(0);
    const aitheSummary = discovery.results.find((r) => r.sourceMovieId === 'Q4699313');
    expect(aitheSummary).toBeDefined();
    expect(aitheSummary?.title).toBe('Aithe');

    // Identity, metadata, credits, release data
    const identity = await wikidataDiscoveryAdapter.getCandidateIdentity('Q4699313');
    expect(identity.title).toBe('Aithe');
    expect(identity.releaseYear).toBe(2003);
    expect(identity.primaryLanguage).toBe('te');

    const metadata = await wikidataDiscoveryAdapter.getMetadata('Q4699313');
    expect(metadata.genres.length).toBeGreaterThan(0);

    const credits = await wikidataDiscoveryAdapter.getCredits('Q4699313');
    expect(credits.directors.length).toBeGreaterThan(0);
    expect(credits.directors[0].name).toBe('Chandra Sekhar Yeleti');
    expect(credits.cast.length).toBeGreaterThan(0);

    const releaseData = await wikidataDiscoveryAdapter.getReleaseData('Q4699313');
    expect(releaseData.releaseDate).toBe('2003-04-11');
    expect(releaseData.countries).toContain('IN');
  });

  it('2. DiscoverySourceRegistry reports TMDB and WIKIDATA as ACTIVE, and IMDB as NOT_IMPLEMENTED', () => {
    const registry = DiscoverySourceRegistry.getInstance();
    const registered = registry.getRegisteredSources();

    const tmdb = registered.find((s) => s.code === 'TMDB');
    const wikidata = registered.find((s) => s.code === 'WIKIDATA');
    const imdb = registered.find((s) => s.code === 'IMDB');

    expect(tmdb?.status).toBe('ACTIVE');
    expect(tmdb?.isImplemented).toBe(true);

    expect(wikidata?.status).toBe('ACTIVE');
    expect(wikidata?.isImplemented).toBe(true);
    expect(wikidata?.capabilities.discovery).toBe(true);

    expect(imdb?.status).toBe('NOT_IMPLEMENTED');
    expect(imdb?.isImplemented).toBe(false);
  });

  it('3. Ingestion deduplication: matches existing canonical movie and marks candidate as DUPLICATE without duplicating Movie record', async () => {
    // Process candidate for Baahubali 2 (Q20649372) which already exists in canonical catalog
    const res = await ingestionService.discoverAndIngestMissingCandidate(
      'WIKIDATA',
      'Q20649372',
      'Testing Wikidata cross-reference deduplication'
    );

    expect(res.status).toBe('PROCESSED');
    expect(res.isDuplicate).toBe(true);
    expect(res.isNewCanonicalMovie).toBe(false);
    expect(res.movieId).toBeDefined();

    // Verify candidate in DB
    const candidate = await prisma.ingestionCandidate.findUnique({
      where: {
        source_sourceMovieId: {
          source: 'WIKIDATA',
          sourceMovieId: 'Q20649372',
        },
      },
    });

    expect(candidate?.status).toBe('DUPLICATE');
    expect(candidate?.duplicateOfMovieId).toBe(res.movieId);
    expect(candidate?.resolutionReason).toBe('DUPLICATE_CANONICAL_MATCH');

    // Verify canonical movie has wikidataId linked
    const canonicalMovie = await prisma.movie.findUnique({
      where: { id: res.movieId! },
    });
    expect(canonicalMovie?.wikidataId).toBe('Q20649372');
  });

  it('4. New canonical candidate ingestion: creates active canonical movie from secondary discovery', async () => {
    // Ingest Aithe (Q4699313) from Wikidata
    const res = await ingestionService.discoverAndIngestMissingCandidate(
      'WIKIDATA',
      'Q4699313',
      'Targeted secondary expansion test'
    );

    expect(res.status).toBe('PROCESSED');
    expect(res.movieId).toBeDefined();

    const movie = await prisma.movie.findUnique({
      where: { id: res.movieId! },
      include: {
        eligibility: true,
        people: { include: { person: true } },
      },
    });

    expect(movie).toBeDefined();
    expect(movie?.primaryTitle).toBe('Aithe');
    expect(movie?.releaseYear).toBe(2003);
    expect(movie?.supportedLanguages).toContain('TELUGU');
    expect(movie?.wikidataId).toBe('Q4699313');
    expect(movie?.lifecycleStatus).toBe('ACTIVE');
    expect(movie?.eligibility?.playableAsGuess).toBe(true);
    expect(movie?.eligibility?.playableAsTarget).toBe(true);

    // Verify candidate resolution
    const candidate = await prisma.ingestionCandidate.findUnique({
      where: {
        source_sourceMovieId: {
          source: 'WIKIDATA',
          sourceMovieId: 'Q4699313',
        },
      },
    });
    expect(['VALIDATED', 'DUPLICATE']).toContain(candidate?.status);
    expect(['ACCEPTED_NEW_CANONICAL', 'DUPLICATE_CANONICAL_MATCH']).toContain(candidate?.resolutionReason);
  });

  it('5. Newly ingested secondary movie is searchable', async () => {
    const searchResults = await prisma.movie.findMany({
      where: {
        primaryTitle: { contains: 'Aithe', mode: 'insensitive' },
        lifecycleStatus: 'ACTIVE',
      },
    });

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].primaryTitle).toBe('Aithe');
  });

  it('6. Coverage service computes multi-source comparison and verifies all mathematical invariants', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    expect(report.sourceComparison).toBeDefined();
    expect(report.sourceComparison.secondaryCandidates).toBeGreaterThanOrEqual(1);
    expect(report.sourceComparison.crossSourceOverlap).toBeGreaterThanOrEqual(1);
    expect(report.sourceComparison.newCanonicalContributedBySecondary).toBeGreaterThanOrEqual(1);

    // Source breakdown verification
    const wikidataSource = report.sourceBreakdown.find((s) => s.code === 'WIKIDATA');
    expect(wikidataSource?.status).toBe('ACTIVE');
    expect(wikidataSource?.isImplemented).toBe(true);
    expect(wikidataSource?.candidatesDiscovered).toBeGreaterThanOrEqual(1);

    // Invariant verifications
    expect(report.invariants.languageReconciliationPass).toBe(true);
    expect(report.invariants.yearReconciliationPass).toBe(true);
    expect(report.invariants.zeroDuplicateCanonicalMovies).toBe(true);
    expect(report.coverageStatus).toBe('PARTIAL');
  });

  it('7. Guarantees 100% strict mathematical reconciliation across all language and year totals', async () => {
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
  });
});
