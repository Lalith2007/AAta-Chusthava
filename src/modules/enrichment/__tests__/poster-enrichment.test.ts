import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { posterEnrichmentService } from '../poster-enrichment-service';
import { resolvePosterUrl, TMDB_IMAGE_BASE_URL } from '@/lib/poster-utils';

describe('Sprint 26B: Real Movie Poster Enrichment Pipeline Test Suite', () => {
  const TEST_MOVIE_ID_1 = 'poster-enrich-test-1';
  const TEST_MOVIE_ID_2 = 'poster-enrich-test-2';
  const TEST_MOVIE_ID_3 = 'poster-enrich-test-3';
  const TEST_MOVIE_ID_4 = 'poster-enrich-test-4';
  const TEST_TMDB_ID_1 = 888001;
  const TEST_TMDB_ID_2 = 888002;
  const TEST_TMDB_ID_3 = 888003;
  const TEST_TMDB_ID_4 = 888004;

  beforeEach(async () => {
    // Clean up test records
    await prisma.gameSession.deleteMany({
      where: { game: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } } },
    });
    await prisma.dailyPuzzle.deleteMany({
      where: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.challenge.deleteMany({
      where: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.game.deleteMany({
      where: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.movie.deleteMany({
      where: { id: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'TMDB',
        sourceRecordId: { in: [String(TEST_TMDB_ID_1), String(TEST_TMDB_ID_2), String(TEST_TMDB_ID_3), String(TEST_TMDB_ID_4)] },
      },
    });

    // 1. Candidate with missing posterAsset
    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_1,
        slug: 'test-poster-candidate-1-2023',
        primaryTitle: 'Test Poster Candidate 1',
        originalTitle: 'Test Poster Candidate 1',
        releaseYear: 2023,
        supportedLanguages: ['TELUGU'],
        industries: ['TOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: TEST_TMDB_ID_1,
        posterAsset: null,
      },
    });

    // 2. Movie with ALREADY VALID posterAsset
    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_2,
        slug: 'test-already-has-poster-2023',
        primaryTitle: 'Test Already Has Poster',
        originalTitle: 'Test Already Has Poster',
        releaseYear: 2023,
        supportedLanguages: ['HINDI'],
        industries: ['BOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: TEST_TMDB_ID_2,
        posterAsset: 'https://image.tmdb.org/t/p/w500/existing_valid_poster.jpg',
      },
    });

    // 3. Movie with NO POSTER available on TMDB
    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_3,
        slug: 'test-no-poster-on-tmdb-2023',
        primaryTitle: 'Test No Poster on TMDB',
        originalTitle: 'Test No Poster on TMDB',
        releaseYear: 2023,
        supportedLanguages: ['TELUGU'],
        industries: ['TOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: TEST_TMDB_ID_3,
        posterAsset: null,
      },
    });

    // 4. Movie that acts as a DailyPuzzle / Challenge target
    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_4,
        slug: 'test-target-integrity-movie-2023',
        primaryTitle: 'Test Target Integrity Movie',
        originalTitle: 'Test Target Integrity Movie',
        releaseYear: 2023,
        supportedLanguages: ['HINDI'],
        industries: ['BOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: TEST_TMDB_ID_4,
        posterAsset: null,
      },
    });

    // Link TEST_MOVIE_ID_4 to DailyPuzzle and Challenge
    const ruleset = await prisma.gameRuleset.findFirst();
    const game = await prisma.game.create({
      data: {
        mode: 'DAILY',
        targetMovieId: TEST_MOVIE_ID_4,
        rulesetId: ruleset!.id,
        maxAttempts: 10,
        status: 'ACTIVE',
      },
    });

    await prisma.dailyPuzzle.create({
      data: {
        puzzleDate: '2099-01-01',
        gameId: game.id,
        targetMovieId: TEST_MOVIE_ID_4,
        rulesetId: ruleset!.id,
        selectionMethod: 'WEIGHTED_RANDOM',
        algorithmVersion: 'DAILY_SELECTION_V1',
        status: 'SCHEDULED',
      },
    });

    const challengeGame = await prisma.game.create({
      data: {
        mode: 'CHALLENGE',
        targetMovieId: TEST_MOVIE_ID_4,
        rulesetId: ruleset!.id,
        maxAttempts: 10,
        status: 'ACTIVE',
      },
    });

    await prisma.challenge.create({
      data: {
        gameId: challengeGame.id,
        targetMovieId: TEST_MOVIE_ID_4,
        publicCode: 'TESTPOSTERCODE99',
        creator: 'TestCreator',
        status: 'ACTIVE',
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.dailyPuzzle.deleteMany({
      where: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.challenge.deleteMany({
      where: { targetMovieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.movie.deleteMany({
      where: { id: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_ID_3, TEST_MOVIE_ID_4] } },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'TMDB',
        sourceRecordId: { in: [String(TEST_TMDB_ID_1), String(TEST_TMDB_ID_2), String(TEST_TMDB_ID_3), String(TEST_TMDB_ID_4)] },
      },
    });
  });

  it('A & D. Enriches candidate movie with real TMDB poster_path and normalizes URL', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockImplementation(async (id: string) => {
      if (id === String(TEST_TMDB_ID_1)) {
        return {
          id: TEST_TMDB_ID_1,
          title: 'Test Poster Candidate 1',
          original_title: 'Test Poster Candidate 1',
          original_language: 'te',
          overview: 'Test overview',
          release_date: '2023-01-01',
          poster_path: '/real_candidate_poster_123.jpg',
          genres: [],
          production_companies: [],
        };
      }
      throw new Error(`Unknown ID ${id}`);
    });

    const result = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_1, { dryRun: false });

    expect(result.status).toBe('ENRICHED');
    expect(result.rawPosterPath).toBe('/real_candidate_poster_123.jpg');
    expect(result.newPosterAsset).toBe(`${TMDB_IMAGE_BASE_URL}/w500/real_candidate_poster_123.jpg`);

    // Verify Database Persistence
    const updatedMovie = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_1 } });
    expect(updatedMovie?.posterAsset).toBe(`${TMDB_IMAGE_BASE_URL}/w500/real_candidate_poster_123.jpg`);

    // Verify RawSourceRecord Provenance Retention
    const rawRecord = await prisma.rawSourceRecord.findUnique({
      where: {
        source_sourceRecordId: {
          source: 'TMDB',
          sourceRecordId: String(TEST_TMDB_ID_1),
        },
      },
    });
    expect(rawRecord).not.toBeNull();
    expect(rawRecord?.source).toBe('TMDB');
    expect(rawRecord?.sourceRecordId).toBe(String(TEST_TMDB_ID_1));
    expect((rawRecord?.payload as any)?.details?.poster_path).toBe('/real_candidate_poster_123.jpg');
  });

  it('B. Preserves existing valid poster and skips mutation (never overwrites)', async () => {
    const tmdbSpy = vi.spyOn(tmdbAdapter, 'getMovieDetails');

    const result = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_2, { dryRun: false });

    expect(result.status).toBe('ALREADY_HAD_POSTER');
    expect(result.newPosterAsset).toBe('https://image.tmdb.org/t/p/w500/existing_valid_poster.jpg');
    // TMDB should not even be called for records that already have valid posters
    expect(tmdbSpy).not.toHaveBeenCalled();

    // Verify DB was unchanged
    const movie = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_2 } });
    expect(movie?.posterAsset).toBe('https://image.tmdb.org/t/p/w500/existing_valid_poster.jpg');
  });

  it('E. Handles missing poster_path gracefully leaving posterAsset null without fabricating URLs', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValue({
      id: TEST_TMDB_ID_3,
      title: 'Test No Poster on TMDB',
      original_title: 'Test No Poster on TMDB',
      original_language: 'te',
      overview: 'No poster film',
      release_date: '2023-01-01',
      poster_path: null,
      genres: [],
      production_companies: [],
    });

    const result = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_3, { dryRun: false });

    expect(result.status).toBe('NO_POSTER_AVAILABLE');
    expect(result.newPosterAsset).toBeNull();

    const movie = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_3 } });
    expect(movie?.posterAsset).toBeNull();
  });

  it('F. Handles TMDB 404 / lookup failure without corrupting movie record', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockRejectedValue(new Error('TMDB getMovieDetails error: 404 Not Found'));

    const result = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_1, { dryRun: false });

    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('404');

    const movie = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_1 } });
    expect(movie?.posterAsset).toBeNull();
    expect(movie?.lifecycleStatus).toBe('ACTIVE');
  });

  it('G. Retries on transient errors with backoff', async () => {
    let callCount = 0;
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('503 Service Unavailable');
      }
      return {
        id: TEST_TMDB_ID_1,
        title: 'Test Poster Candidate 1',
        original_title: 'Test Poster Candidate 1',
        original_language: 'te',
        overview: 'Overview',
        release_date: '2023-01-01',
        poster_path: '/retry_recovered_poster.jpg',
        genres: [],
        production_companies: [],
      };
    });

    const result = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_1, {
      dryRun: false,
      maxRetries: 2,
    });

    expect(result.status).toBe('ENRICHED');
    expect(callCount).toBe(2);
    expect(result.newPosterAsset).toBe(`${TMDB_IMAGE_BASE_URL}/w500/retry_recovered_poster.jpg`);
  });

  it('H. Idempotent execution: second run skips already-enriched records', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValue({
      id: TEST_TMDB_ID_1,
      title: 'Test Poster Candidate 1',
      original_title: 'Test Poster Candidate 1',
      original_language: 'te',
      overview: 'Overview',
      release_date: '2023-01-01',
      poster_path: '/idempotent_poster.jpg',
      genres: [],
      production_companies: [],
    });

    // Run 1: Enriches
    const run1 = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_1, { dryRun: false });
    expect(run1.status).toBe('ENRICHED');

    // Run 2: Already had poster
    const run2 = await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_1, { dryRun: false });
    expect(run2.status).toBe('ALREADY_HAD_POSTER');
    expect(run2.newPosterAsset).toBe(`${TMDB_IMAGE_BASE_URL}/w500/idempotent_poster.jpg`);
  });

  it('I. Bounded concurrency batch execution with progress reporting', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockImplementation(async (id: string) => {
      return {
        id: Number(id),
        title: `Movie ${id}`,
        original_title: `Movie ${id}`,
        original_language: 'te',
        overview: 'Overview',
        release_date: '2023-01-01',
        poster_path: `/batch_poster_${id}.jpg`,
        genres: [],
        production_companies: [],
      };
    });

    let progressEvents = 0;
    const report = await posterEnrichmentService.enrichAllMissingPosters({
      movieId: TEST_MOVIE_ID_1,
      concurrency: 2,
      dryRun: false,
      onProgress: () => {
        progressEvents++;
      },
    });

    expect(report.totalProcessed).toBe(1);
    expect(report.successfullyEnriched).toBe(1);
    expect(progressEvents).toBeGreaterThanOrEqual(1);
  });

  it('J. Target Identity Safety: DailyPuzzle and Challenge targetMovieIds remain untouched', async () => {
    vi.spyOn(tmdbAdapter, 'getMovieDetails').mockResolvedValue({
      id: TEST_TMDB_ID_4,
      title: 'Test Target Integrity Movie',
      original_title: 'Test Target Integrity Movie',
      original_language: 'hi',
      overview: 'Overview',
      release_date: '2023-01-01',
      poster_path: '/target_integrity_poster.jpg',
      genres: [],
      production_companies: [],
    });

    const beforePuzzle = await prisma.dailyPuzzle.findUnique({ where: { puzzleDate: '2099-01-01' } });
    const beforeChallenge = await prisma.challenge.findUnique({ where: { publicCode: 'TESTPOSTERCODE99' } });

    expect(beforePuzzle?.targetMovieId).toBe(TEST_MOVIE_ID_4);
    expect(beforeChallenge?.targetMovieId).toBe(TEST_MOVIE_ID_4);

    // Enrich target movie poster
    await posterEnrichmentService.enrichMoviePoster(TEST_MOVIE_ID_4, { dryRun: false });

    // Verify after enrichment
    const afterPuzzle = await prisma.dailyPuzzle.findUnique({ where: { puzzleDate: '2099-01-01' } });
    const afterChallenge = await prisma.challenge.findUnique({ where: { publicCode: 'TESTPOSTERCODE99' } });

    expect(afterPuzzle?.targetMovieId).toBe(TEST_MOVIE_ID_4);
    expect(afterChallenge?.targetMovieId).toBe(TEST_MOVIE_ID_4);

    const targetMovie = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_4 } });
    expect(targetMovie?.posterAsset).toBe(`${TMDB_IMAGE_BASE_URL}/w500/target_integrity_poster.jpg`);
    expect(targetMovie?.slug).toBe('test-target-integrity-movie-2023');
    expect(targetMovie?.primaryTitle).toBe('Test Target Integrity Movie');
  });
});
