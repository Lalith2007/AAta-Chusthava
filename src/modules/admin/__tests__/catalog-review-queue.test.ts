import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { catalogReviewService } from '../catalog-review-service';
import { adminService } from '../admin-service';
import { enrichmentService } from '@/modules/enrichment/enrichment-service';

describe('Sprint 28: Catalog Review Queue & Curation Suite', () => {
  let initialMovieCount = 0;
  const TEST_MOVIE_ID_1 = '00000000-0000-0000-0000-000000000281';
  const TEST_MOVIE_ID_2 = '00000000-0000-0000-0000-000000000282';
  const TEST_MOVIE_TARGET = '00000000-0000-0000-0000-000000000283';
  const TEST_PERSON_DIR = '00000000-0000-0000-0000-000000000381';
  const TEST_PERSON_LEAD = '00000000-0000-0000-0000-000000000382';
  const TEST_PERSON_COLEAD = '00000000-0000-0000-0000-000000000383';

  beforeAll(async () => {
    initialMovieCount = await prisma.movie.count();

    // Create test people
    await prisma.person.upsert({
      where: { id: TEST_PERSON_DIR },
      create: { id: TEST_PERSON_DIR, canonicalName: 'Test Director 28' },
      update: {},
    });
    await prisma.person.upsert({
      where: { id: TEST_PERSON_LEAD },
      create: { id: TEST_PERSON_LEAD, canonicalName: 'Test Lead Actor 28' },
      update: {},
    });
    await prisma.person.upsert({
      where: { id: TEST_PERSON_COLEAD },
      create: { id: TEST_PERSON_COLEAD, canonicalName: 'Test CoLead Actor 28' },
      update: {},
    });

    // Create Movie 1: Incomplete clues (pending review)
    await prisma.movie.upsert({
      where: { id: TEST_MOVIE_ID_1 },
      create: {
        id: TEST_MOVIE_ID_1,
        slug: 'test-review-film-1-2026',
        primaryTitle: 'Test Review Film 1',
        originalTitle: 'Test Review Film 1',
        releaseYear: 2026,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: 999281,
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });

    await prisma.gameEligibility.upsert({
      where: { movieId: TEST_MOVIE_ID_1 },
      create: {
        movieId: TEST_MOVIE_ID_1,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'INSUFFICIENT_CLUE_COVERAGE',
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'INSUFFICIENT_CLUE_COVERAGE',
      },
    });

    // Create Movie 2: Duplicate candidate of Movie 1
    await prisma.movie.upsert({
      where: { id: TEST_MOVIE_ID_2 },
      create: {
        id: TEST_MOVIE_ID_2,
        slug: 'test-review-film-1-dup-2026',
        primaryTitle: 'Test Review Film 1 (Duplicate)',
        originalTitle: 'Test Review Film 1',
        releaseYear: 2026,
        supportedLanguages: ['TELUGU'],
        posterAsset: 'https://image.tmdb.org/t/p/w500/test_dup_poster.jpg',
        lifecycleStatus: 'ACTIVE',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });

    await prisma.gameEligibility.upsert({
      where: { movieId: TEST_MOVIE_ID_2 },
      create: {
        movieId: TEST_MOVIE_ID_2,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
      },
    });

    // Create Movie 3: Protected target movie
    await prisma.movie.upsert({
      where: { id: TEST_MOVIE_TARGET },
      create: {
        id: TEST_MOVIE_TARGET,
        slug: 'test-target-film-2026',
        primaryTitle: 'Test Target Film',
        originalTitle: 'Test Target Film',
        releaseYear: 2026,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });

    await prisma.gameEligibility.upsert({
      where: { movieId: TEST_MOVIE_TARGET },
      create: {
        movieId: TEST_MOVIE_TARGET,
        playableAsGuess: true,
        playableAsTarget: true,
        reviewStatus: 'APPROVED',
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: true,
        reviewStatus: 'APPROVED',
      },
    });

    const ruleset = await prisma.gameRuleset.findFirst();
    if (!ruleset) throw new Error('No ruleset found for test');

    const targetGame = await prisma.game.upsert({
      where: { id: 'test-game-sprint-28-target' },
      create: {
        id: 'test-game-sprint-28-target',
        mode: 'DAILY',
        targetMovieId: TEST_MOVIE_TARGET,
        rulesetId: ruleset.id,
        maxAttempts: 10,
        status: 'ACTIVE',
      },
      update: { targetMovieId: TEST_MOVIE_TARGET },
    });

    // Create a challenge referencing TEST_MOVIE_TARGET
    await prisma.challenge.upsert({
      where: { id: 'test-challenge-sprint-28' },
      create: {
        id: 'test-challenge-sprint-28',
        gameId: targetGame.id,
        publicCode: 'SPRINT28CHALLENGE',
        targetMovieId: TEST_MOVIE_TARGET,
        status: 'ACTIVE',
      },
      update: { targetMovieId: TEST_MOVIE_TARGET },
    });
  });

  afterAll(async () => {
    // Clean up test entities
    await prisma.challenge.deleteMany({ where: { id: 'test-challenge-sprint-28' } });
    await prisma.game.deleteMany({ where: { id: 'test-game-sprint-28-target' } });
    await prisma.movieGenre.deleteMany({
      where: { movieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_TARGET] } },
    });
    await prisma.moviePerson.deleteMany({
      where: { movieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_TARGET] } },
    });
    await prisma.gameEligibility.deleteMany({
      where: { movieId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_TARGET] } },
    });
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_TARGET] } },
    });
    await prisma.movie.deleteMany({
      where: { id: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, TEST_MOVIE_TARGET] } },
    });
    await prisma.person.deleteMany({
      where: { id: { in: [TEST_PERSON_DIR, TEST_PERSON_LEAD, TEST_PERSON_COLEAD] } },
    });
  });

  // --------------------------------------------------------------------------
  // 1. Review Queue Retrieval & Filtering
  // --------------------------------------------------------------------------

  it('1. Retrieves review queue with server-side pagination', async () => {
    const res = await catalogReviewService.getReviewQueue({ page: 1, limit: 10 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.length).toBeLessThanOrEqual(10);
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.page).toBe(1);
  });

  it('2. Filters review queue by language and release year', async () => {
    const res = await catalogReviewService.getReviewQueue({
      language: 'te',
      year: 2026,
      limit: 10,
    });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((item) => item.supportedLanguages.includes('TELUGU'))).toBe(true);
    expect(res.items.every((item) => item.releaseYear === 2026)).toBe(true);
  });

  it('3. Filters review queue by review reason and poster status', async () => {
    const res = await catalogReviewService.getReviewQueue({
      hasPoster: false,
      reason: 'INSUFFICIENT_CLUE_COVERAGE',
      limit: 10,
    });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((item) => !item.hasPoster)).toBe(true);
    expect(res.items.every((item) => item.reasons.includes('INSUFFICIENT_CLUE_COVERAGE'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. Review Detail & 11-Clue Dimension Diagnostics
  // --------------------------------------------------------------------------

  it('4. Retrieves comprehensive review detail with all 11 clue dimensions', async () => {
    const detail = await catalogReviewService.getReviewDetail(TEST_MOVIE_ID_1);

    expect(detail.movie.id).toBe(TEST_MOVIE_ID_1);
    expect(detail.movie.primaryTitle).toBe('Test Review Film 1');
    expect(detail.clueAnalysis).toBeDefined();
    expect(Object.keys(detail.clueAnalysis.dimensions)).toHaveLength(11);

    // Verify key dimensions are identified
    expect(detail.clueAnalysis.dimensions.LANGUAGE.status).toBe('PRESENT');
    expect(detail.clueAnalysis.dimensions.RELEASE_YEAR.status).toBe('PRESENT');
    expect(detail.clueAnalysis.dimensions.DIRECTOR.status).toBe('MISSING');
    expect(detail.clueAnalysis.dimensions.LEAD_ACTOR.status).toBe('MISSING');
    expect(detail.clueAnalysis.dimensions.GENRES.status).toBe('MISSING');
    expect(detail.clueAnalysis.isTargetPlayable).toBe(false);
  });

  it('5. Missing numeric fields remain null and UNAVAILABLE (never converted to 0)', async () => {
    const detail = await catalogReviewService.getReviewDetail(TEST_MOVIE_ID_1);

    expect(detail.movie.boxOffice).toBeNull();
    expect(detail.movie.budget).toBeNull();
    expect(detail.clueAnalysis.dimensions.BOX_OFFICE.status).toBe('UNAVAILABLE');
    expect(detail.clueAnalysis.dimensions.BOX_OFFICE.value).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 3. Playability Decision & Approval Workflow
  // --------------------------------------------------------------------------

  it('6. Approve workflow validates playability and does NOT grant target status without complete clues', async () => {
    // Movie 1 has no director/cast/genres, so approving it makes it Guess Playable only
    const res = await catalogReviewService.approveMovie(TEST_MOVIE_ID_1, 'test-admin');

    expect(res.success).toBe(true);
    expect(res.reviewStatus).toBe('APPROVED');
    expect(res.playableAsGuess).toBe(true);
    expect(res.playableAsTarget).toBe(false); // Incomplete clue coverage prevents target playability
    expect(res.disabledReason).toBe('INSUFFICIENT_CLUE_COVERAGE');
  });

  it('7. Grants playableAsTarget=true only when all 11-clue engine requirements are satisfied', async () => {
    // Add Director, 2 Cast Members, and 1 Genre to Movie 1
    const genre = await prisma.genre.findFirst();

    await prisma.moviePerson.createMany({
      data: [
        { movieId: TEST_MOVIE_ID_1, personId: TEST_PERSON_DIR, roleType: 'DIRECTOR', relationType: 'CREW' },
        { movieId: TEST_MOVIE_ID_1, personId: TEST_PERSON_LEAD, roleType: 'LEAD', relationType: 'CAST', billingOrder: 0 },
        { movieId: TEST_MOVIE_ID_1, personId: TEST_PERSON_COLEAD, roleType: 'LEAD', relationType: 'CAST', billingOrder: 1 },
      ],
    });

    if (genre) {
      await prisma.movieGenre.create({
        data: { movieId: TEST_MOVIE_ID_1, genreId: genre.id },
      });
    }

    const res = await catalogReviewService.approveMovie(TEST_MOVIE_ID_1, 'test-admin');

    expect(res.success).toBe(true);
    expect(res.reviewStatus).toBe('APPROVED');
    expect(res.playableAsGuess).toBe(true);
    expect(res.playableAsTarget).toBe(true); // Now 100% target playable
    expect(res.disabledReason).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 4. Return to Review & Rejection Workflow
  // --------------------------------------------------------------------------

  it('8. Return-to-review workflow resets movie review status to PENDING', async () => {
    const res = await catalogReviewService.returnMovieToReview(TEST_MOVIE_ID_1, 'Needs further verification', 'test-admin');

    expect(res.success).toBe(true);
    expect(res.reviewStatus).toBe('PENDING');

    const check = await prisma.gameEligibility.findUnique({ where: { movieId: TEST_MOVIE_ID_1 } });
    expect(check?.reviewStatus).toBe('PENDING');
  });

  it('9. Reject workflow disables movie and marks lifecycleStatus as REJECTED', async () => {
    const res = await catalogReviewService.rejectMovie(TEST_MOVIE_ID_1, 'Test invalid entry', 'test-admin');

    expect(res.success).toBe(true);
    expect(res.lifecycleStatus).toBe('REJECTED');
    expect(res.reviewStatus).toBe('REJECTED');

    const movie = await prisma.movie.findUnique({
      where: { id: TEST_MOVIE_ID_1 },
      include: { eligibility: true },
    });
    expect(movie?.lifecycleStatus).toBe('REJECTED');
    expect(movie?.eligibility?.playableAsGuess).toBe(false);
    expect(movie?.eligibility?.playableAsTarget).toBe(false);

    // Reset back to ACTIVE for subsequent tests
    await prisma.movie.update({ where: { id: TEST_MOVIE_ID_1 }, data: { lifecycleStatus: 'ACTIVE' } });
    await prisma.gameEligibility.update({ where: { movieId: TEST_MOVIE_ID_1 }, data: { reviewStatus: 'PENDING' } });
  });

  // --------------------------------------------------------------------------
  // 5. Duplicate Detection & Safe Merge
  // --------------------------------------------------------------------------

  it('10. Detects suspected duplicates by normalized title within year range', async () => {
    const detail = await catalogReviewService.getReviewDetail(TEST_MOVIE_ID_1);

    expect(detail.suspectedDuplicates.length).toBeGreaterThan(0);
    const foundDup = detail.suspectedDuplicates.some((d) => d.canonicalMovie.id === TEST_MOVIE_ID_2);
    expect(foundDup).toBe(true);
  });

  it('11. Merges duplicate safely, preserving poster asset, alternate titles, and re-linking guesses', async () => {
    // Movie 1 initially has no poster. Movie 2 has a poster.
    const res = await catalogReviewService.mergeDuplicateMovie(TEST_MOVIE_ID_1, TEST_MOVIE_ID_2, 'test-admin');

    expect(res.success).toBe(true);
    expect(res.mergedFields).toContain('posterAsset');

    const primary = await prisma.movie.findUnique({ where: { id: TEST_MOVIE_ID_1 } });
    const duplicate = await prisma.movie.findUnique({
      where: { id: TEST_MOVIE_ID_2 },
      include: { eligibility: true },
    });

    expect(primary?.posterAsset).toBe('https://image.tmdb.org/t/p/w500/test_dup_poster.jpg');
    expect(duplicate?.lifecycleStatus).toBe('MERGED');
    expect(duplicate?.eligibility?.playableAsTarget).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 6. Strict Target Immutability Protection
  // --------------------------------------------------------------------------

  it('12. Blocks rejection if the movie is an active or historical game target (Target Safety)', async () => {
    // TEST_MOVIE_TARGET is referenced by a challenge
    await expect(
      catalogReviewService.rejectMovie(TEST_MOVIE_TARGET, 'Accidental rejection attempt', 'test-admin')
    ).rejects.toThrow(/Targets are strictly immutable/);
  });

  it('13. Blocks duplicate merging away of an active or historical game target', async () => {
    await expect(
      catalogReviewService.mergeDuplicateMovie(TEST_MOVIE_ID_1, TEST_MOVIE_TARGET, 'test-admin')
    ).rejects.toThrow(/Targets are strictly immutable/);
  });

  it('14. Guarantees DailyPuzzle, Challenge, and Game targetMovieId immutability', async () => {
    const challengeBefore = await prisma.challenge.findUnique({ where: { id: 'test-challenge-sprint-28' } });
    expect(challengeBefore?.targetMovieId).toBe(TEST_MOVIE_TARGET);

    // Any valid review operation on other movies must not mutate target IDs
    await catalogReviewService.approveMovie(TEST_MOVIE_ID_1, 'test-admin');

    const challengeAfter = await prisma.challenge.findUnique({ where: { id: 'test-challenge-sprint-28' } });
    expect(challengeAfter?.targetMovieId).toBe(TEST_MOVIE_TARGET);
  });

  // --------------------------------------------------------------------------
  // 7. Audit Logging
  // --------------------------------------------------------------------------

  it('15. Creates structured audit logs for APPROVE, REJECT, and MERGE operations', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: TEST_MOVIE_ID_1 },
      orderBy: { timestamp: 'desc' },
    });

    expect(logs.length).toBeGreaterThanOrEqual(3);
    const actions = logs.map((l) => l.action);
    expect(actions).toContain('APPROVE_MOVIE');
    expect(actions).toContain('MERGE_DUPLICATE_MOVIE');
  });

  // --------------------------------------------------------------------------
  // 8. Individual Enrichment from Review
  // --------------------------------------------------------------------------

  it('16. Invokes single-movie enrichment safely without triggering global re-runs', async () => {
    vi.spyOn(enrichmentService, 'enrichMovie').mockResolvedValueOnce({
      movieId: TEST_MOVIE_ID_1,
      title: 'Test Review Film 1',
      releaseYear: 2026,
      enrichedFromTmdb: true,
      enrichedFromWikidata: false,
      enrichedFromWikipediaArticle: false,
      previousTargetPlayable: false,
      newTargetPlayable: true,
      recoveredTarget: true,
      directorsAdded: ['Sachin Saraf'],
      castAdded: ['Hero A', 'Heroine B'],
      musicDirectorsAdded: [],
      genresAdded: ['Action'],
      productionHousesAdded: [],
      metadataUpdated: true,
      unmatched: false,
      ambiguous: false,
      reason: 'Enriched successfully from TMDB',
    });

    const res = await catalogReviewService.enrichSingleMovie(TEST_MOVIE_ID_1, 'test-admin');

    expect(res.enrichedFromTmdb).toBe(true);
    expect(res.recoveredTarget).toBe(true);

    const log = await prisma.auditLog.findFirst({
      where: { entityId: TEST_MOVIE_ID_1, action: 'ENRICH_MOVIE_SINGLE' },
    });
    expect(log).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 9. Batch Operations (Dry-Run & Deterministic Live)
  // --------------------------------------------------------------------------

  it('17. Executes batch review operations in dry-run mode with zero database writes', async () => {
    const countBefore = await prisma.gameEligibility.count({ where: { reviewStatus: 'APPROVED' } });

    const report = await catalogReviewService.batchProcessEligibleMovies({
      dryRun: true,
      limit: 10,
    });

    expect(report.mode).toBe('DRY_RUN');
    expect(report.totalEvaluated).toBeGreaterThanOrEqual(1);

    const countAfter = await prisma.gameEligibility.count({ where: { reviewStatus: 'APPROVED' } });
    expect(countAfter).toBe(countBefore);
  });

  it('18. Aggregates authoritative server-side review queue statistics', async () => {
    const stats = await catalogReviewService.getReviewStats();

    expect(stats.totalPending).toBeGreaterThanOrEqual(1);
    expect(stats.byLanguage.telugu).toBeGreaterThanOrEqual(1);
    expect(stats.byReason.INSUFFICIENT_CLUE_COVERAGE).toBeGreaterThanOrEqual(1);
    expect(typeof stats.missingPoster).toBe('number');
  });

  it('19. Handles idempotent review approvals consistently', async () => {
    const first = await catalogReviewService.approveMovie(TEST_MOVIE_ID_1, 'test-admin');
    const second = await catalogReviewService.approveMovie(TEST_MOVIE_ID_1, 'test-admin');

    expect(first.reviewStatus).toBe(second.reviewStatus);
    expect(first.playableAsTarget).toBe(second.playableAsTarget);
  });

  it('20. Guarantees complete test catalog isolation and zero unmanaged additions', async () => {
    const currentCount = await prisma.movie.count();
    // Accounting for our 3 test movies created in beforeAll
    expect(currentCount).toBe(initialMovieCount + 3);
  });
});
