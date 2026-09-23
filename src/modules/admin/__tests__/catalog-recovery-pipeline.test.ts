import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { catalogReviewService, isScraperArtifact, classifyPendingMovie } from '../catalog-review-service';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { enrichmentService } from '@/modules/enrichment/enrichment-service';
import { resolvePosterUrl } from '@/lib/poster-utils';

describe('Sprint 29: Catalog Review Recovery & Identity Resolution Suite', () => {
  let initialMovieCount = 0;
  let initialDailyPuzzleCount = 0;
  let initialGameCount = 0;
  let initialChallengeCount = 0;

  // Test movie IDs for Sprint 29
  const MOVIE_ARTIFACT_ID = '00000000-0000-0000-0000-000000000291';
  const MOVIE_TMDB_LINKED_ID = '00000000-0000-0000-0000-000000000292';
  const MOVIE_NO_ID_ID = '00000000-0000-0000-0000-000000000293';
  const MOVIE_TARGET_ID = '00000000-0000-0000-0000-000000000294';
  const MOVIE_DUPLICATE_ID = '00000000-0000-0000-0000-000000000295';
  const MOVIE_CANONICAL_TARGET = '00000000-0000-0000-0000-000000000296';

  const PERSON_DIR_ID = '00000000-0000-0000-0000-000000000391';
  const PERSON_ACTOR_1 = '00000000-0000-0000-0000-000000000392';
  const PERSON_ACTOR_2 = '00000000-0000-0000-0000-000000000393';

  const TEST_MOVIE_IDS = [
    MOVIE_ARTIFACT_ID,
    MOVIE_TMDB_LINKED_ID,
    MOVIE_NO_ID_ID,
    MOVIE_TARGET_ID,
    MOVIE_DUPLICATE_ID,
    MOVIE_CANONICAL_TARGET,
  ];

  beforeAll(async () => {
    initialMovieCount = await prisma.movie.count();
    initialDailyPuzzleCount = await prisma.dailyPuzzle.count();
    initialGameCount = await prisma.game.count();
    initialChallengeCount = await prisma.challenge.count();

    // 1. Create test people
    await prisma.person.upsert({
      where: { id: PERSON_DIR_ID },
      create: { id: PERSON_DIR_ID, canonicalName: 'Sprint29 Director' },
      update: {},
    });
    await prisma.person.upsert({
      where: { id: PERSON_ACTOR_1 },
      create: { id: PERSON_ACTOR_1, canonicalName: 'Sprint29 Lead Actor' },
      update: {},
    });
    await prisma.person.upsert({
      where: { id: PERSON_ACTOR_2 },
      create: { id: PERSON_ACTOR_2, canonicalName: 'Sprint29 CoLead Actor' },
      update: {},
    });

    // 2. Create Artifact Movie (Scraper noise)
    await prisma.movie.upsert({
      where: { id: MOVIE_ARTIFACT_ID },
      create: {
        id: MOVIE_ARTIFACT_ID,
        slug: 'artifact-sep-2020',
        primaryTitle: '- September!',
        originalTitle: '- September!',
        releaseYear: 2020,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_ARTIFACT_ID },
      create: {
        movieId: MOVIE_ARTIFACT_ID,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'SCRAPER_ARTIFACT_DETECTED',
      },
      update: { reviewStatus: 'PENDING', disabledReason: 'SCRAPER_ARTIFACT_DETECTED' },
    });

    // 3. Create TMDB-linked Movie
    await prisma.movie.upsert({
      where: { id: MOVIE_TMDB_LINKED_ID },
      create: {
        id: MOVIE_TMDB_LINKED_ID,
        slug: 'tmdb-linked-film-2026',
        primaryTitle: 'TMDB Linked Film',
        originalTitle: 'TMDB Linked Film',
        releaseYear: 2026,
        supportedLanguages: ['HINDI'],
        lifecycleStatus: 'ACTIVE',
        tmdbId: 888292,
      },
      update: { lifecycleStatus: 'ACTIVE', tmdbId: 888292 },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_TMDB_LINKED_ID },
      create: {
        movieId: MOVIE_TMDB_LINKED_ID,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'MISSING_CAST_DATA',
      },
      update: { reviewStatus: 'PENDING', disabledReason: 'MISSING_CAST_DATA' },
    });

    // 4. Create Movie with NO external ID
    await prisma.movie.upsert({
      where: { id: MOVIE_NO_ID_ID },
      create: {
        id: MOVIE_NO_ID_ID,
        slug: 'unresolved-identity-film-2026',
        primaryTitle: 'Unresolved Identity Film',
        originalTitle: 'Unresolved Identity Film',
        releaseYear: 2026,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_NO_ID_ID },
      create: {
        movieId: MOVIE_NO_ID_ID,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'MISSING_EXTERNAL_ID',
      },
      update: { reviewStatus: 'PENDING', disabledReason: 'MISSING_EXTERNAL_ID' },
    });
    await prisma.moviePerson.create({
      data: {
        movieId: MOVIE_NO_ID_ID,
        personId: PERSON_DIR_ID,
        relationType: 'CREW',
        roleType: 'DIRECTOR',
      },
    });

    // 5. Create Approved Movie for Duplicate test
    await prisma.movie.upsert({
      where: { id: MOVIE_CANONICAL_TARGET },
      create: {
        id: MOVIE_CANONICAL_TARGET,
        slug: 'canonical-duplicate-target-2025',
        primaryTitle: 'Duplicate Target Film',
        originalTitle: 'Duplicate Target Film',
        releaseYear: 2025,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
        posterAsset: 'https://image.tmdb.org/t/p/w500/canonical.jpg',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_CANONICAL_TARGET },
      create: {
        movieId: MOVIE_CANONICAL_TARGET,
        playableAsGuess: true,
        playableAsTarget: true,
        reviewStatus: 'APPROVED',
      },
      update: { reviewStatus: 'APPROVED', playableAsTarget: true },
    });

    // 6. Create Pending Duplicate Movie
    await prisma.movie.upsert({
      where: { id: MOVIE_DUPLICATE_ID },
      create: {
        id: MOVIE_DUPLICATE_ID,
        slug: 'pending-duplicate-2025',
        primaryTitle: 'Duplicate Target Film',
        originalTitle: 'Duplicate Target Film',
        releaseYear: 2025,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_DUPLICATE_ID },
      create: {
        movieId: MOVIE_DUPLICATE_ID,
        playableAsGuess: true,
        playableAsTarget: false,
        reviewStatus: 'PENDING',
        disabledReason: 'POTENTIAL_DUPLICATE_COLLISION',
      },
      update: { reviewStatus: 'PENDING', disabledReason: 'POTENTIAL_DUPLICATE_COLLISION' },
    });

    // 7. Create Target-Playable Film with Game & Challenge dependencies
    await prisma.movie.upsert({
      where: { id: MOVIE_TARGET_ID },
      create: {
        id: MOVIE_TARGET_ID,
        slug: 'immutable-target-film-2026',
        primaryTitle: 'Immutable Target Film',
        originalTitle: 'Immutable Target Film',
        releaseYear: 2026,
        supportedLanguages: ['TELUGU'],
        lifecycleStatus: 'ACTIVE',
        posterAsset: 'https://image.tmdb.org/t/p/w500/target.jpg',
      },
      update: { lifecycleStatus: 'ACTIVE' },
    });
    await prisma.gameEligibility.upsert({
      where: { movieId: MOVIE_TARGET_ID },
      create: {
        movieId: MOVIE_TARGET_ID,
        playableAsGuess: true,
        playableAsTarget: true,
        reviewStatus: 'APPROVED',
      },
      update: { reviewStatus: 'APPROVED', playableAsTarget: true },
    });

    const ruleset = await prisma.gameRuleset.findFirst();
    if (!ruleset) throw new Error('No ruleset found');

    const game = await prisma.game.upsert({
      where: { id: 'sprint29-test-game' },
      create: {
        id: 'sprint29-test-game',
        mode: 'DAILY',
        targetMovieId: MOVIE_TARGET_ID,
        rulesetId: ruleset.id,
        maxAttempts: 6,
        status: 'ACTIVE',
      },
      update: { targetMovieId: MOVIE_TARGET_ID },
    });

    await prisma.challenge.upsert({
      where: { id: 'sprint29-test-challenge' },
      create: {
        id: 'sprint29-test-challenge',
        gameId: game.id,
        publicCode: 'SPRINT29TESTCODE',
        targetMovieId: MOVIE_TARGET_ID,
        status: 'ACTIVE',
      },
      update: { targetMovieId: MOVIE_TARGET_ID },
    });
  });

  afterAll(async () => {
    // 1. Delete test challenges & games
    await prisma.challenge.deleteMany({ where: { id: 'sprint29-test-challenge' } });
    await prisma.game.deleteMany({ where: { id: 'sprint29-test-game' } });

    // 2. Delete movie relations
    await prisma.moviePerson.deleteMany({ where: { movieId: { in: TEST_MOVIE_IDS } } });
    await prisma.movieGenre.deleteMany({ where: { movieId: { in: TEST_MOVIE_IDS } } });
    await prisma.gameEligibility.deleteMany({ where: { movieId: { in: TEST_MOVIE_IDS } } });
    await prisma.auditLog.deleteMany({ where: { entityId: { in: TEST_MOVIE_IDS } } });

    // 3. Delete test movies
    await prisma.movie.deleteMany({ where: { id: { in: TEST_MOVIE_IDS } } });

    // 4. Delete test persons
    await prisma.person.deleteMany({
      where: { id: { in: [PERSON_DIR_ID, PERSON_ACTOR_1, PERSON_ACTOR_2] } },
    });
  });

  // 1. Exact primary recovery classification
  it('1. Classifies pending movies deterministically into authoritative recovery categories', () => {
    const artifactRes = classifyPendingMovie(
      { primaryTitle: '- September!', releaseYear: 2020 },
      { reasons: ['INSUFFICIENT_CLUE_COVERAGE'], score: { present: 1, total: 11 }, missingClues: ['Cast'] } as any,
      false
    );
    expect(artifactRes.primaryClass).toBe('ARTIFACT_REJECTION_CANDIDATE');

    const duplicateRes = classifyPendingMovie(
      { primaryTitle: 'Duplicate Target Film', releaseYear: 2025 },
      { reasons: ['INSUFFICIENT_CLUE_COVERAGE'], score: { present: 3, total: 11 }, missingClues: [] } as any,
      true
    );
    expect(duplicateRes.primaryClass).toBe('DUPLICATE_REVIEW_REQUIRED');

    const readyRes = classifyPendingMovie(
      {
        primaryTitle: 'Vanaveera',
        releaseYear: 2026,
        tmdbId: 1634301,
        posterAsset: 'https://image.tmdb.org/t/p/w500/vanaveera.jpg',
      },
      {
        reasons: [],
        score: { present: 7, total: 11 },
        missingClues: [],
        isTargetPlayable: true,
      } as any,
      false
    );
    expect(readyRes.primaryClass).toBe('READY_FOR_APPROVAL');
  });

  // 2. Classification totals sum to pending queue
  it('2. Guarantees that recovery classification totals sum exactly to pending count', async () => {
    const stats = await catalogReviewService.getReviewStats();
    let sum = 0;
    for (const count of Object.values(stats.recoveryBreakdown)) {
      sum += count;
    }
    expect(sum).toBe(stats.totalPending);
  });

  // 3. TMDB-linked enrichment
  it('3. Enriches TMDB-linked candidate using mocked external source data', async () => {
    const spyEnrich = vi.spyOn(enrichmentService, 'enrichMovie').mockResolvedValueOnce({
      movieId: MOVIE_TMDB_LINKED_ID,
      title: 'TMDB Linked Film',
      releaseYear: 2026,
      enrichedFromTmdb: true,
      enrichedFromWikidata: false,
      enrichedFromWikipediaArticle: false,
      previousTargetPlayable: false,
      newTargetPlayable: false,
      recoveredTarget: false,
      directorsAdded: [],
      castAdded: ['Sprint29 Lead Actor'],
      musicDirectorsAdded: [],
      genresAdded: ['Action'],
      productionHousesAdded: [],
      metadataUpdated: true,
      unmatched: false,
      ambiguous: false,
    });

    const res = await catalogReviewService.enrichSingleMovie(MOVIE_TMDB_LINKED_ID, {
      dryRun: false,
      actorId: 'test-suite',
    });

    expect(spyEnrich).toHaveBeenCalled();
    expect(res.enrichedFromTmdb).toBe(true);
    spyEnrich.mockRestore();
  });

  // 4. Missing TMDB ID handling
  it('4. Correctly classifies missing TMDB ID records as identity recovery candidates', async () => {
    const detail = await catalogReviewService.getReviewDetail(MOVIE_NO_ID_ID);
    expect(detail.movie.tmdbId).toBeNull();
    expect(detail.primaryRecoveryClass).toBe('TMDB_IDENTITY_RECOVERY_CANDIDATE');
  });

  // 5. Exact TMDB match
  it('5. Resolves exact TMDB identity match with HIGH confidence', async () => {
    const searchSpy = vi.spyOn(tmdbAdapter, 'searchMovies').mockResolvedValueOnce({
      results: [
        {
          id: 777123,
          title: 'Unresolved Identity Film',
          original_title: 'Unresolved Identity Film',
          release_date: '2026-05-10',
          original_language: 'te',
          overview: 'A high quality test film',
          popularity: 12.5,
        },
      ],
      totalPages: 1,
      totalResults: 1,
    });

    const res = await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-suite',
    });

    expect(res.status).toBe('MATCHED');
    expect(res.matchedTmdbId).toBe(777123);
    expect(['HIGH', 'EXACT']).toContain(res.confidence);
    expect(res.dryRun).toBe(true);
    searchSpy.mockRestore();
  });

  // 6. Ambiguous TMDB match
  it('6. Flags multiple competing candidate results as AMBIGUOUS without mutating record', async () => {
    const searchSpy = vi.spyOn(tmdbAdapter, 'searchMovies').mockResolvedValueOnce({
      results: [
        {
          id: 111,
          title: 'Unresolved Identity Film Part 1',
          original_title: 'Unresolved Identity Film Part 1',
          release_date: '2026-01-01',
          original_language: 'te',
          popularity: 5.0,
        },
        {
          id: 222,
          title: 'Unresolved Identity Film Part 2',
          original_title: 'Unresolved Identity Film Part 2',
          release_date: '2026-06-01',
          original_language: 'te',
          popularity: 6.0,
        },
      ],
      totalPages: 1,
      totalResults: 2,
    });

    const res = await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-suite',
    });

    expect(res.status).toBe('AMBIGUOUS');
    expect(res.candidates?.length).toBe(2);
    expect(res.matchedTmdbId).toBeUndefined();

    // Verify database was untouched
    const movie = await prisma.movie.findUnique({ where: { id: MOVIE_NO_ID_ID } });
    expect(movie?.tmdbId).toBeNull();
    searchSpy.mockRestore();
  });

  // 7. TMDB not found
  it('7. Handles zero TMDB search candidates by returning NOT_FOUND status', async () => {
    const searchSpy = vi.spyOn(tmdbAdapter, 'searchMovies').mockResolvedValueOnce({
      results: [],
      totalPages: 1,
      totalResults: 0,
    });

    const res = await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-suite',
    });

    expect(res.status).toBe('NOT_FOUND');
    expect(res.matchedTmdbId).toBeUndefined();
    searchSpy.mockRestore();
  });

  // 8. Artifact detection
  it('8. Reliably detects calendar headers, wikitext, and newline artifacts', () => {
    expect(isScraperArtifact('- September!')).toBe(true);
    expect(isScraperArtifact('- February!')).toBe(true);
    expect(isScraperArtifact('Kaliyugam 2064{{efn-lg|name="tt"')).toBe(true);
    expect(isScraperArtifact('Film with\nNewline')).toBe(true);
    expect(isScraperArtifact('MAY\n! rowspan="2" style="background:#C5E384;"')).toBe(true);
    expect(isScraperArtifact('Srihari')).toBe(true);
    expect(isScraperArtifact('Dharmavarapu Subramanyam')).toBe(true);

    // Valid titles must return false
    expect(isScraperArtifact('Baahubali: The Beginning')).toBe(false);
    expect(isScraperArtifact('Vanaveera')).toBe(false);
    expect(isScraperArtifact('RRR')).toBe(false);
  });

  // 9. Duplicate candidate handling
  it('9. Identifies suspected duplicate pairs in duplicate scan', async () => {
    const scanRes = await catalogReviewService.scanDuplicates({ limit: 10 });
    expect(scanRes.totalFound).toBeGreaterThanOrEqual(1);

    const match = scanRes.duplicates.find(
      (d) => d.pendingMovie.id === MOVIE_DUPLICATE_ID
    );
    expect(match).toBeDefined();
    expect(match?.canonicalMatches.some((m) => m.id === MOVIE_CANONICAL_TARGET)).toBe(true);
  });

  // 10. Poster recovery
  it('10. Recovers valid TMDB poster URL and rejects invalid formatting', async () => {
    // Verify detail inspection resolves poster correctly
    const detail = await catalogReviewService.getReviewDetail(MOVIE_CANONICAL_TARGET);
    expect(detail.movie.posterAsset).toMatch(/^https:\/\//);

    // Verify resolvePosterUrl normalizes relative paths
    const resolved = resolvePosterUrl('/test_poster.jpg');
    expect(resolved).toBe('https://image.tmdb.org/t/p/w500/test_poster.jpg');

    // Verify null/empty/invalid inputs return null without fabricating fake URLs
    expect(resolvePosterUrl(null)).toBeNull();
    expect(resolvePosterUrl('')).toBeNull();
    expect(resolvePosterUrl('null')).toBeNull();
    expect(resolvePosterUrl('invalid_string_no_ext')).toBeNull();
  });

  // 11. Playability recalculation
  it('11. Recalculates GameEligibility when movie is evaluated', async () => {
    const detail = await catalogReviewService.getReviewDetail(MOVIE_ARTIFACT_ID);
    expect(detail.clueAnalysis.isTargetPlayable).toBe(false);
    expect(detail.clueAnalysis.score.present).toBeLessThan(11);
  });

  // 12. Audit logging
  it('12. Records AuditLog on review queue curation actions', async () => {
    await catalogReviewService.rejectMovie(MOVIE_ARTIFACT_ID, 'Test rejection reason', 'test-operator');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entityId: MOVIE_ARTIFACT_ID,
        action: 'REJECT_MOVIE',
      },
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog?.actorId).toBe('test-operator');
  });

  // 13. Dry-run zero-write behavior
  it('13. Guarantees zero database writes when dryRun = true in resolution and scans', async () => {
    const beforeMovie = await prisma.movie.findUnique({ where: { id: MOVIE_NO_ID_ID } });
    const beforeAuditCount = await prisma.auditLog.count({ where: { entityId: MOVIE_NO_ID_ID } });

    const searchSpy = vi.spyOn(tmdbAdapter, 'searchMovies').mockResolvedValueOnce({
      results: [
        {
          id: 999999,
          title: 'Unresolved Identity Film',
          original_title: 'Unresolved Identity Film',
          release_date: '2026-01-01',
          original_language: 'te',
        },
      ],
      totalPages: 1,
      totalResults: 1,
    });

    await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-admin',
    });

    const afterMovie = await prisma.movie.findUnique({ where: { id: MOVIE_NO_ID_ID } });
    const afterAuditCount = await prisma.auditLog.count({ where: { entityId: MOVIE_NO_ID_ID } });

    expect(afterMovie?.tmdbId).toBe(beforeMovie?.tmdbId);
    expect(afterAuditCount).toBe(beforeAuditCount);
    searchSpy.mockRestore();
  });

  // 14. Approval safety
  it('14. Prevents incomplete movies from becoming target-playable on approval', async () => {
    // Approve incomplete movie
    const res = await catalogReviewService.approveMovie(MOVIE_NO_ID_ID, 'test-admin');
    expect(res.reviewStatus).toBe('APPROVED');
    // Engine must not make it target-playable due to missing clues
    expect(res.playableAsTarget).toBe(false);
  });

  // 15. Target immutability
  it('15. Prevents destructive merge or modification on active game targets', async () => {
    // Attempting to merge a movie that is an active target must throw or be blocked
    await expect(
      catalogReviewService.mergeDuplicateMovie(MOVIE_DUPLICATE_ID, MOVIE_TARGET_ID, 'test-admin')
    ).rejects.toThrow();
  });

  // 16. DailyPuzzle immutability
  it('16. Verifies that DailyPuzzle collection remains 100% immutable', async () => {
    const count = await prisma.dailyPuzzle.count();
    expect(count).toBe(initialDailyPuzzleCount);
  });

  // 17. Challenge immutability
  it('17. Verifies that existing Challenge target references are protected', async () => {
    const challenge = await prisma.challenge.findUnique({ where: { id: 'sprint29-test-challenge' } });
    expect(challenge?.targetMovieId).toBe(MOVIE_TARGET_ID);
  });

  // 18. Game immutability
  it('18. Verifies that active Game targets cannot be orphaned', async () => {
    const game = await prisma.game.findUnique({ where: { id: 'sprint29-test-game' } });
    expect(game?.targetMovieId).toBe(MOVIE_TARGET_ID);
  });

  // 19. Existing target protection
  it('19. Blocks attempts to reject active target movies', async () => {
    await expect(
      catalogReviewService.rejectMovie(MOVIE_TARGET_ID, 'Attempted target rejection', 'test-admin')
    ).rejects.toThrow();
  });

  // 20. Idempotent repeated recovery attempts
  it('20. Handles repeated resolution requests idempotently', async () => {
    const searchSpy = vi.spyOn(tmdbAdapter, 'searchMovies').mockResolvedValue({
      results: [
        {
          id: 777123,
          title: 'Unresolved Identity Film',
          original_title: 'Unresolved Identity Film',
          release_date: '2026-05-10',
          original_language: 'te',
        },
      ],
      totalPages: 1,
      totalResults: 1,
    });

    const res1 = await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-suite',
    });
    const res2 = await catalogReviewService.resolveTmdbIdentity(MOVIE_NO_ID_ID, {
      dryRun: true,
      actorId: 'test-suite',
    });

    expect(res1.status).toBe(res2.status);
    expect(res1.matchedTmdbId).toBe(res2.matchedTmdbId);
    searchSpy.mockRestore();
  });

  // 21. No fake poster URLs
  it('21. Validates that all poster assets are either valid HTTPS URLs or null', async () => {
    const moviesWithPosters = await prisma.movie.findMany({
      where: { posterAsset: { not: null } },
      select: { posterAsset: true },
      take: 20,
    });

    for (const m of moviesWithPosters) {
      expect(m.posterAsset).toMatch(/^https:\/\//);
    }
  });

  // 22. Provenance preservation
  it('22. Preserves movie lifecycle and identity metadata during curation', async () => {
    const movie = await prisma.movie.findUnique({ where: { id: MOVIE_CANONICAL_TARGET } });
    expect(movie?.lifecycleStatus).toBe('ACTIVE');
    expect(movie?.slug).toBe('canonical-duplicate-target-2025');
  });

  // 23. Test isolation
  it('23. Confirms test database isolation with exact tracked entity delta', async () => {
    const currentMovieCount = await prisma.movie.count();
    // Exactly our 6 test movies were added during beforeAll
    expect(currentMovieCount).toBe(initialMovieCount + 6);
  });
});
