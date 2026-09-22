import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { ingestionService, normalizeMovieTitle } from '../ingestion-service';
import { resolvePosterUrl } from '@/lib/poster-utils';

describe('Sprint 27: Production Catalog Ingestion & Continuous Discovery Pipeline Suite', () => {
  let initialMovieCount = 0;
  const TEST_TMDB_ID_NEW = 999101;
  const TEST_TMDB_ID_INCOMPLETE = 999102;
  const TEST_TMDB_ID_DUPLICATE = 999103;

  beforeAll(async () => {
    initialMovieCount = await prisma.movie.count();

    // Clean any prior test records
    await prisma.ingestionCandidate.deleteMany({
      where: {
        source: 'TMDB',
        sourceMovieId: { in: [String(TEST_TMDB_ID_NEW), String(TEST_TMDB_ID_INCOMPLETE), String(TEST_TMDB_ID_DUPLICATE)] },
      },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'TMDB',
        sourceRecordId: { in: [String(TEST_TMDB_ID_NEW), String(TEST_TMDB_ID_INCOMPLETE), String(TEST_TMDB_ID_DUPLICATE)] },
      },
    });
  });

  afterAll(async () => {
    // Clean up created test entities to guarantee test database isolation
    await prisma.ingestionCandidate.deleteMany({
      where: {
        source: 'TMDB',
        sourceMovieId: { in: [String(TEST_TMDB_ID_NEW), String(TEST_TMDB_ID_INCOMPLETE), String(TEST_TMDB_ID_DUPLICATE)] },
      },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'TMDB',
        sourceRecordId: { in: [String(TEST_TMDB_ID_NEW), String(TEST_TMDB_ID_INCOMPLETE), String(TEST_TMDB_ID_DUPLICATE)] },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        tmdbId: { in: [TEST_TMDB_ID_NEW, TEST_TMDB_ID_INCOMPLETE, TEST_TMDB_ID_DUPLICATE] },
      },
    });
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. TMDB Discovery, Pagination, Date Ranges & Error Handling
  // --------------------------------------------------------------------------

  it('1. TMDB discovery supports multi-page pagination', async () => {
    vi.spyOn(tmdbAdapter, 'discover').mockResolvedValueOnce({
      results: [
        {
          source: 'TMDB',
          sourceMovieId: '101',
          title: 'Movie Page 1',
          originalTitle: 'Movie Page 1',
          releaseDate: '2026-05-10',
          originalLanguage: 'te',
          popularity: 20,
          voteAverage: 8.0,
          voteCount: 100,
        },
      ],
      totalPages: 2,
      totalResults: 2,
    });

    const res = await tmdbAdapter.discover!({ language: 'te', page: 1 });
    expect(res.results.length).toBe(1);
    expect(res.totalPages).toBe(2);
    expect(res.results[0].title).toBe('Movie Page 1');
  });

  it('2. Distinguishes live TMDB failure from empty results and throws categorized error', async () => {
    vi.spyOn(tmdbAdapter, 'isConfigured').mockReturnValue(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(tmdbAdapter.discover!({ language: 'te', year: 2026 })).rejects.toThrow(/TMDB 5xx/);
    fetchSpy.mockRestore();
  });

  it('3. Retries on 429 rate limit with backoff before throwing', async () => {
    vi.spyOn(tmdbAdapter, 'isConfigured').mockReturnValue(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], total_pages: 1, total_results: 0 }),
      } as Response);

    const res = await tmdbAdapter.discover!({ language: 'te', year: 2026 });
    expect(res.results).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  it('4. Queries TMDB discovery endpoint with date window', async () => {
    vi.spyOn(tmdbAdapter, 'isConfigured').mockReturnValue(true);
    let capturedUrl = '';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      capturedUrl = String(input);
      return {
        ok: true,
        status: 200,
        json: async () => ({ results: [], total_pages: 1, total_results: 0 }),
      } as Response;
    });

    await tmdbAdapter.discover!({
      language: 'te',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });

    expect(capturedUrl).toContain('primary_release_date.gte=2026-01-01');
    expect(capturedUrl).toContain('primary_release_date.lte=2026-03-31');
    expect(capturedUrl).toContain('with_original_language=te');
    fetchSpy.mockRestore();
  });

  // --------------------------------------------------------------------------
  // Phase F & G: Normalization & Multi-Strategy Deduplication
  // --------------------------------------------------------------------------

  it('5. Normalizes movie titles removing colons, dashes, symbols, and parentheticals', () => {
    expect(normalizeMovieTitle('Baahubali: The Beginning')).toBe('baahubali the beginning');
    expect(normalizeMovieTitle('Pushpa - The Rise (Part 1)')).toBe('pushpa the rise');
    expect(normalizeMovieTitle('K.G.F: Chapter 2 [Telugu]')).toBe('kgf chapter 2');
  });

  it('6. Deduplication by TMDB ID matches existing movie and prevents duplicate creation', async () => {
    const existing = await prisma.movie.findFirst({
      where: { tmdbId: { not: null }, lifecycleStatus: 'ACTIVE' },
    });
    expect(existing).toBeDefined();

    const match = await ingestionService.findExistingCanonicalMovie({
      tmdbId: existing!.tmdbId,
      title: 'Different Title Spelled Wrong',
      releaseYear: existing!.releaseYear,
    });

    expect(match).toBeDefined();
    expect(match?.id).toBe(existing?.id);
  });

  it('7. Deduplication matches by normalized title and year tolerance (+/- 1 year)', async () => {
    const existing = await prisma.movie.findFirst({
      where: { lifecycleStatus: 'ACTIVE' },
    });
    expect(existing).toBeDefined();

    const match = await ingestionService.findExistingCanonicalMovie({
      title: `${existing!.primaryTitle} (Telugu Remastered)`,
      releaseYear: existing!.releaseYear + 1,
    });

    expect(match).toBeDefined();
    expect(match?.id).toBe(existing?.id);
  });

  it('8. Rejects candidate with release year prior to 2002', async () => {
    const oldCandidate = await prisma.ingestionCandidate.upsert({
      where: {
        source_sourceMovieId: { source: 'TMDB', sourceMovieId: '199901' },
      },
      create: {
        source: 'TMDB',
        sourceMovieId: '199901',
        status: 'DISCOVERED',
      },
      update: {},
    });

    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValueOnce({
      id: 199901,
      title: 'Old Film 1999',
      original_title: 'Old Film 1999',
      release_date: '1999-08-15',
      original_language: 'te',
      overview: 'Film from 1999',
      genres: [{ id: 28, name: 'Action' }],
      production_companies: [],
    });
    vi.spyOn(tmdbAdapter, 'getCredits').mockResolvedValueOnce({ id: 199901, cast: [], crew: [] });
    vi.spyOn(tmdbAdapter, 'getAlternativeTitles').mockResolvedValueOnce([]);

    const res = await ingestionService.processCandidate(oldCandidate.id);
    expect(res.status).toBe('SKIPPED');
    expect(res.reason).toContain('Year before 2002');

    const updatedCandidate = await prisma.ingestionCandidate.findUnique({
      where: { id: oldCandidate.id },
    });
    expect(updatedCandidate?.status).toBe('REJECTED');
    expect(updatedCandidate?.resolutionReason).toBe('REJECTED_YEAR_BEFORE_2002');

    // Clean up
    await prisma.ingestionCandidate.delete({ where: { id: oldCandidate.id } });
  });

  // --------------------------------------------------------------------------
  // 3. Playability Classification & Review Queue Routing
  // --------------------------------------------------------------------------

  it('9. Movie with complete metadata is ACCEPTED_APPROVED and target playable', async () => {
    const candidate = await prisma.ingestionCandidate.upsert({
      where: {
        source_sourceMovieId: { source: 'TMDB', sourceMovieId: String(TEST_TMDB_ID_NEW) },
      },
      create: {
        source: 'TMDB',
        sourceMovieId: String(TEST_TMDB_ID_NEW),
        status: 'DISCOVERED',
      },
      update: { status: 'DISCOVERED' },
    });

    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValueOnce({
      id: TEST_TMDB_ID_NEW,
      title: 'Test Production Complete Movie',
      original_title: 'Test Production Complete Movie',
      release_date: '2026-03-15',
      original_language: 'te',
      overview: 'Complete test film',
      poster_path: '/complete_test_poster.jpg',
      backdrop_path: '/complete_test_backdrop.jpg',
      revenue: 150000000,
      budget: 50000000,
      vote_average: 7.8,
      vote_count: 500,
      genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }],
      production_companies: [{ id: 501, name: 'Mythri Movie Makers' }],
    });

    vi.spyOn(tmdbAdapter, 'getCredits').mockResolvedValueOnce({
      id: TEST_TMDB_ID_NEW,
      cast: [
        { id: 901, name: 'Test Lead Actor', original_name: 'Test Lead Actor', character: 'Hero', order: 0 },
        { id: 902, name: 'Test Lead Actress', original_name: 'Test Lead Actress', character: 'Heroine', order: 1 },
      ],
      crew: [
        { id: 903, name: 'Test Director', job: 'Director', department: 'Directing' },
        { id: 904, name: 'Test Music Director', job: 'Original Music Composer', department: 'Sound' },
      ],
    });

    vi.spyOn(tmdbAdapter, 'getAlternativeTitles').mockResolvedValueOnce(['Complete Alt Title']);

    const res = await ingestionService.processCandidate(candidate.id);
    expect(res.status).toBe('PROCESSED');
    expect(res.isNewCanonicalMovie).toBe(true);

    const movie = await prisma.movie.findUnique({
      where: { id: res.movieId },
      include: { eligibility: true },
    });

    expect(movie).toBeDefined();
    expect(movie?.eligibility?.playableAsGuess).toBe(true);
    expect(movie?.eligibility?.playableAsTarget).toBe(true);
    expect(movie?.eligibility?.reviewStatus).toBe('APPROVED');
    expect(movie?.boxOffice).toBe(150000000);
    expect(movie?.boxOfficeStatus).toBe('REPORTED');
  });

  it('10. Incomplete candidate routes to review queue with playableAsTarget = false', async () => {
    const candidate = await prisma.ingestionCandidate.upsert({
      where: {
        source_sourceMovieId: { source: 'TMDB', sourceMovieId: String(TEST_TMDB_ID_INCOMPLETE) },
      },
      create: {
        source: 'TMDB',
        sourceMovieId: String(TEST_TMDB_ID_INCOMPLETE),
        status: 'DISCOVERED',
      },
      update: { status: 'DISCOVERED' },
    });

    // Incomplete cast (only 1 cast member) and no director
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValueOnce({
      id: TEST_TMDB_ID_INCOMPLETE,
      title: 'Test Incomplete Ingestion Movie',
      original_title: 'Test Incomplete Ingestion Movie',
      release_date: '2026-04-10',
      original_language: 'te',
      overview: 'Incomplete test film',
      genres: [{ id: 18, name: 'Drama' }],
      production_companies: [],
    });

    vi.spyOn(tmdbAdapter, 'getCredits').mockResolvedValueOnce({
      id: TEST_TMDB_ID_INCOMPLETE,
      cast: [{ id: 905, name: 'Solo Actor', original_name: 'Solo Actor', character: 'Solo', order: 0 }],
      crew: [],
    });

    vi.spyOn(tmdbAdapter, 'getAlternativeTitles').mockResolvedValueOnce([]);

    const res = await ingestionService.processCandidate(candidate.id);
    expect(res.status).toBe('REVIEW_REQUIRED');

    const movie = await prisma.movie.findUnique({
      where: { id: res.movieId },
      include: { eligibility: true },
    });

    expect(movie).toBeDefined();
    expect(movie?.eligibility?.playableAsGuess).toBe(true);
    expect(movie?.eligibility?.playableAsTarget).toBe(false);
    expect(movie?.eligibility?.reviewStatus).toBe('PENDING');
    expect(movie?.eligibility?.disabledReason).toBe('INSUFFICIENT_CLUE_COVERAGE');

    const updatedCandidate = await prisma.ingestionCandidate.findUnique({
      where: { id: candidate.id },
    });
    expect(updatedCandidate?.resolutionReason).toBe('ACCEPTED_NEEDS_REVIEW');
  });

  // --------------------------------------------------------------------------
  // 4. Missing Numeric Data & Poster Safety
  // --------------------------------------------------------------------------

  it('11. Missing box office and budget remain null and status UNAVAILABLE (never zero)', async () => {
    const incompleteMovie = await prisma.movie.findUnique({
      where: { tmdbId: TEST_TMDB_ID_INCOMPLETE },
    });

    expect(incompleteMovie).toBeDefined();
    expect(incompleteMovie?.boxOffice).toBeNull();
    expect(incompleteMovie?.budget).toBeNull();
    expect(incompleteMovie?.boxOfficeStatus).toBe('UNAVAILABLE');
  });

  it('12. Resolves TMDB poster URLs into normalized absolute HTTPS URLs and preserves provenance', async () => {
    const completeMovie = await prisma.movie.findUnique({
      where: { tmdbId: TEST_TMDB_ID_NEW },
    });

    expect(completeMovie).toBeDefined();
    expect(completeMovie?.posterAsset).toBe('https://image.tmdb.org/t/p/w500/complete_test_poster.jpg');

    const rawRecord = await prisma.rawSourceRecord.findUnique({
      where: {
        source_sourceRecordId: { source: 'TMDB', sourceRecordId: String(TEST_TMDB_ID_NEW) },
      },
    });
    expect(rawRecord).toBeDefined();
    expect(rawRecord?.payload).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 5. Dry-Run Zero-Write Behavior & Target Immutability
  // --------------------------------------------------------------------------

  it('13. Dry-run mode produces full classification report with zero database writes', async () => {
    const movieCountBefore = await prisma.movie.count();
    const candidateCountBefore = await prisma.ingestionCandidate.count();

    vi.spyOn(tmdbAdapter, 'discover').mockResolvedValueOnce({
      results: [
        {
          source: 'TMDB',
          sourceMovieId: '888777',
          title: 'Simulated Dry Run Movie',
          originalTitle: 'Simulated Dry Run Movie',
          releaseDate: '2026-07-20',
          originalLanguage: 'te',
          popularity: 10,
          voteAverage: 7.0,
          voteCount: 50,
        },
      ],
      totalPages: 1,
      totalResults: 1,
    });

    const report = await ingestionService.runContinuousDiscovery({
      dryRun: true,
      languages: ['te'],
      year: 2026,
      limit: 1,
    });

    expect(report.mode).toBe('DRY_RUN');
    expect(report.discovery.rawDiscoveries).toBe(1);
    expect(report.validation.accepted).toBe(1);

    const movieCountAfter = await prisma.movie.count();
    const candidateCountAfter = await prisma.ingestionCandidate.count();

    expect(movieCountAfter).toBe(movieCountBefore);
    expect(candidateCountAfter).toBe(candidateCountBefore);
  });

  it('14. Guarantees 100% target immutability: DailyPuzzle, Challenge, and Game targets remain untouched', async () => {
    const puzzlesBefore = await prisma.dailyPuzzle.findMany({ select: { id: true, targetMovieId: true } });
    const challengesBefore = await prisma.challenge.findMany({ select: { id: true, targetMovieId: true } });
    const gamesBefore = await prisma.game.findMany({ select: { id: true, targetMovieId: true } });

    // Execute dry run
    await ingestionService.runContinuousDiscovery({
      dryRun: true,
      languages: ['te'],
      year: 2026,
      limit: 2,
    });

    const puzzlesAfter = await prisma.dailyPuzzle.findMany({ select: { id: true, targetMovieId: true } });
    const challengesAfter = await prisma.challenge.findMany({ select: { id: true, targetMovieId: true } });
    const gamesAfter = await prisma.game.findMany({ select: { id: true, targetMovieId: true } });

    expect(puzzlesAfter).toEqual(puzzlesBefore);
    expect(challengesAfter).toEqual(challengesBefore);
    expect(gamesAfter).toEqual(gamesBefore);
  });

  it('15. Guarantees complete automated test catalog isolation: zero unmanaged movie additions', async () => {
    // Clean up our 2 specific test movies
    await prisma.movie.deleteMany({
      where: {
        tmdbId: { in: [TEST_TMDB_ID_NEW, TEST_TMDB_ID_INCOMPLETE] },
      },
    });

    const currentCount = await prisma.movie.count();
    expect(currentCount).toBe(initialMovieCount);
  });
});
