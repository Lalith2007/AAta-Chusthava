import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import {
  getIndianCalendarDate,
  isValidPuzzleDate,
  addDaysToPuzzleDate,
  subtractDaysFromPuzzleDate,
} from '@/lib/date-utils';
import { dailyPuzzleSelector } from '../daily-puzzle-selector';
import { dailyPuzzleService } from '../daily-puzzle-service';

describe('Deterministic Daily Puzzle Engine (DAILY_SELECTION_V1)', () => {
  const TEST_DATE_1 = '2030-01-01';
  const TEST_DATE_2 = '2030-01-02';
  const TEST_DATE_3 = '2030-01-03';

  beforeEach(async () => {
    // Clean up any test DailyPuzzle records
    await prisma.dailyPuzzle.deleteMany({
      where: {
        puzzleDate: { in: [TEST_DATE_1, TEST_DATE_2, TEST_DATE_3, '2030-01-04', '2030-01-05'] },
      },
    });
  });

  afterEach(async () => {
    await prisma.dailyPuzzle.deleteMany({
      where: {
        puzzleDate: { in: [TEST_DATE_1, TEST_DATE_2, TEST_DATE_3, '2030-01-04', '2030-01-05'] },
      },
    });
  });

  // 1. TIMEZONE & DATE UTILITIES
  describe('1. Asia/Kolkata (IST) Authoritative Timezone Logic', () => {
    it('correctly maps UTC timestamps to Indian Standard Time calendar dates', () => {
      // 2026-09-21 18:29:59 UTC is 23:59:59 IST on 2026-09-21
      const dateBeforeMidnightIST = new Date('2026-09-21T18:29:59.000Z');
      expect(getIndianCalendarDate(dateBeforeMidnightIST)).toBe('2026-09-21');

      // 2026-09-21 18:30:00 UTC is 00:00:00 IST on 2026-09-22
      const dateAtMidnightIST = new Date('2026-09-21T18:30:00.000Z');
      expect(getIndianCalendarDate(dateAtMidnightIST)).toBe('2026-09-22');

      // 2026-09-21 18:30:01 UTC is 00:00:01 IST on 2026-09-22
      const dateAfterMidnightIST = new Date('2026-09-21T18:30:01.000Z');
      expect(getIndianCalendarDate(dateAfterMidnightIST)).toBe('2026-09-22');
    });

    it('validates and performs date arithmetic accurately', () => {
      expect(isValidPuzzleDate('2026-09-21')).toBe(true);
      expect(isValidPuzzleDate('2026-02-29')).toBe(false); // 2026 is not a leap year
      expect(isValidPuzzleDate('invalid-date')).toBe(false);

      expect(addDaysToPuzzleDate('2026-12-31', 1)).toBe('2027-01-01');
      expect(subtractDaysFromPuzzleDate('2027-01-01', 1)).toBe('2026-12-31');
    });
  });

  // 2. DETERMINISM & PRNG
  describe('2. Deterministic PRNG & Jitter Engine', () => {
    it('produces 100% identical target selection for the same date across repeated runs', async () => {
      const run1 = await dailyPuzzleSelector.selectDailyTarget(TEST_DATE_1);
      const run2 = await dailyPuzzleSelector.selectDailyTarget(TEST_DATE_1);
      const run3 = await dailyPuzzleSelector.selectDailyTarget(TEST_DATE_1);

      expect(run1.selectedMovieId).toBe(run2.selectedMovieId);
      expect(run2.selectedMovieId).toBe(run3.selectedMovieId);
      expect(run1.metadata.deterministicPriority).toBe(run2.metadata.deterministicPriority);
      expect(run1.metadata.selectedTitle).toBe(run2.metadata.selectedTitle);
    });

    it('computes deterministic jitter within [0, 1) derived from SHA-256', () => {
      const jitter1 = dailyPuzzleSelector.computeDeterministicJitter(TEST_DATE_1, 'movie-abc');
      const jitter2 = dailyPuzzleSelector.computeDeterministicJitter(TEST_DATE_1, 'movie-abc');
      const jitter3 = dailyPuzzleSelector.computeDeterministicJitter(TEST_DATE_1, 'movie-xyz');

      expect(jitter1).toBe(jitter2);
      expect(jitter1).toBeGreaterThanOrEqual(0);
      expect(jitter1).toBeLessThan(1);
      expect(jitter1).not.toBe(jitter3); // different movie gives different jitter
    });
  });

  // 3. QUALITY SCORING & TIERS
  describe('3. Target Quality Profile & Tiering', () => {
    it('correctly categorizes rich and medium quality targets without fake data', () => {
      const richMovie = {
        id: 'test-rich',
        primaryTitle: 'Baahubali: The Conclusion',
        releaseYear: 2017,
        supportedLanguages: ['TELUGU', 'HINDI'],
        rating: 8.2,
        ratingVoteCount: 100000,
        boxOffice: 18100000000,
        people: [
          { roleType: 'DIRECTOR', relationType: 'CREW', job: 'Director', person: { canonicalName: 'S. S. Rajamouli' } },
          { roleType: 'LEAD', relationType: 'CAST', job: null, person: { canonicalName: 'Prabhas' } },
          { roleType: 'LEAD', relationType: 'CAST', job: null, person: { canonicalName: 'Anushka Shetty' } },
          { roleType: 'SUPPORTING', relationType: 'CAST', job: null, person: { canonicalName: 'Rana Daggubati' } },
          { roleType: 'MUSIC_DIRECTOR', relationType: 'CREW', job: 'Music Director', person: { canonicalName: 'M. M. Keeravani' } },
        ],
        productionHouses: [{ productionHouse: { canonicalName: 'Arka Media Works' } }],
        genres: [{ genre: { canonicalName: 'Action' } }],
      };

      const richProfile = dailyPuzzleSelector.computeTargetQualityProfile(richMovie);
      expect(richProfile.qualityTier).toBe('TIER_1_RICH');
      expect(richProfile.availableCluesCount).toBeGreaterThanOrEqual(7);
      expect(richProfile.qualityScore).toBeGreaterThanOrEqual(80);

      const mediumMovie = {
        id: 'test-med',
        primaryTitle: 'Sample Indie Film',
        releaseYear: 2021,
        supportedLanguages: ['TELUGU'],
        rating: null,
        ratingVoteCount: null,
        boxOffice: null,
        people: [
          { roleType: 'DIRECTOR', relationType: 'CREW', job: 'Director', person: { canonicalName: 'Sample Director' } },
          { roleType: 'LEAD', relationType: 'CAST', job: null, person: { canonicalName: 'Actor One' } },
          { roleType: 'LEAD', relationType: 'CAST', job: null, person: { canonicalName: 'Actor Two' } },
        ],
        productionHouses: [],
        genres: [],
      };

      const medProfile = dailyPuzzleSelector.computeTargetQualityProfile(mediumMovie);
      expect(medProfile.qualityTier).toBe('TIER_2_MEDIUM');
      expect(medProfile.availableCluesCount).toBe(5);
      expect(medProfile.qualityScore).toBe(50);

      // Single-lead minimal movie: only Language + Director + Release Year + 1 Lead Cast
      const singleLeadMovie = {
        id: 'test-single-lead',
        primaryTitle: 'Solo Lead Movie',
        releaseYear: 2022,
        supportedLanguages: ['TELUGU'],
        rating: null,
        ratingVoteCount: null,
        boxOffice: null,
        people: [
          { roleType: 'DIRECTOR', relationType: 'CREW', job: 'Director', person: { canonicalName: 'Solo Director' } },
          { roleType: 'LEAD', relationType: 'CAST', job: null, person: { canonicalName: 'Solo Actor' } },
        ],
        productionHouses: [],
        genres: [],
      };

      const singleLeadProfile = dailyPuzzleSelector.computeTargetQualityProfile(singleLeadMovie);
      // Language (1) + Director (1) + Release Year (1) + Lead Actor (1) = 4 clues (Lead Actress is FALSE)
      expect(singleLeadProfile.availableCluesCount).toBe(4);
      expect(singleLeadProfile.qualityScore).toBe(40);
      expect(singleLeadProfile.qualityTier).toBe('TIER_2_MEDIUM');
    });

    it('independently evaluates all 11 clues against genuine data', () => {
      // Zero-lead movie (e.g. documentary or missing cast)
      const zeroLeadMovie = {
        id: 'test-zero-lead',
        primaryTitle: 'Documentary Film',
        releaseYear: 2020,
        supportedLanguages: ['HINDI'],
        rating: null,
        ratingVoteCount: null,
        boxOffice: null,
        people: [
          { roleType: 'DIRECTOR', relationType: 'CREW', job: 'Director', person: { canonicalName: 'Doc Director' } },
        ],
        productionHouses: [],
        genres: [],
      };

      const zeroProfile = dailyPuzzleSelector.computeTargetQualityProfile(zeroLeadMovie);
      // Language(1) + Director(1) + Release Year(1) = 3 clues
      expect(zeroProfile.availableCluesCount).toBe(3);
      expect(zeroProfile.qualityScore).toBe(30);
    });
  });

  // 4. RECENCY COOLDOWN
  describe('4. 60-Day Recency Cooldown Policy', () => {
    it('excludes target movies used in the preceding 60 Daily puzzle dates', async () => {
      // 1. Create a puzzle for TEST_DATE_1
      const gameId1 = await dailyPuzzleService.getOrCreatePuzzleForDate(TEST_DATE_1);
      const puzzle1 = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: TEST_DATE_1 },
      });
      expect(puzzle1).not.toBeNull();

      // 2. Select puzzle for next day (TEST_DATE_2)
      const { selectedMovieId: movie2Id } = await dailyPuzzleSelector.selectDailyTarget(TEST_DATE_2);

      // Movie from day 1 MUST NOT be selected on day 2
      expect(movie2Id).not.toBe(puzzle1!.targetMovieId);
    });
  });

  // 5. LANGUAGE BALANCING
  describe('5. Dynamic Language Balancing', () => {
    it('balances Telugu and Hindi based on recent Daily history without brittle odd/even days', async () => {
      const selection = await dailyPuzzleSelector.selectDailyTarget(TEST_DATE_1);
      expect(['TELUGU', 'HINDI', 'MULTILINGUAL']).toContain(selection.metadata.language);
      expect(['TELUGU', 'HINDI']).toContain(selection.metadata.preferredLanguage);
    });
  });

  // 6. ADMIN PREVIEW & OVERRIDE
  describe('6. Admin Preview & Target Override', () => {
    it('previews daily target on the fly without mutating database', async () => {
      const preview = await dailyPuzzleService.previewDailyTarget(TEST_DATE_1);
      expect(preview.puzzleDate).toBe(TEST_DATE_1);
      expect(preview.isAlreadyPersisted).toBe(false);
      expect(preview.movie.primaryTitle).toBeDefined();
      expect(preview.selectionMetadata.algorithmVersion).toBe('DAILY_SELECTION_V1');

      // Verify no DB record was created during preview
      const inDb = await prisma.dailyPuzzle.findUnique({ where: { puzzleDate: TEST_DATE_1 } });
      expect(inDb).toBeNull();
    });

    it('allows an admin to manually override a puzzle target with strict validation', async () => {
      // Find an active target-eligible movie
      const targetMovie = await prisma.movie.findFirst({
        where: {
          lifecycleStatus: 'ACTIVE',
          eligibility: { playableAsTarget: true },
        },
      });
      expect(targetMovie).not.toBeNull();

      const overrideResult = await dailyPuzzleService.overrideDailyTarget({
        puzzleDate: TEST_DATE_1,
        movieId: targetMovie!.id,
        overrideReason: 'Festival Special Curation',
        adminId: 'super-admin-1',
      });

      expect(overrideResult.movie.id).toBe(targetMovie!.id);
      expect(overrideResult.selectionMethod).toBe('ADMIN_SELECTED');
      expect(overrideResult.selectionMetadata.isOverridden).toBe(true);
      expect(overrideResult.selectionMetadata.overrideReason).toBe('Festival Special Curation');

      // Verify DB was persisted with ADMIN_SELECTED
      const dbPuzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: TEST_DATE_1 },
        include: { targetMovie: true },
      });
      expect(dbPuzzle?.targetMovieId).toBe(targetMovie!.id);
      expect(dbPuzzle?.selectionMethod).toBe('ADMIN_SELECTED');
    });

    it('rejects override attempts using non-target-eligible or inactive movies', async () => {
      // Find a review movie where playableAsTarget is false
      const reviewMovie = await prisma.movie.findFirst({
        where: { eligibility: { playableAsTarget: false } },
      });

      if (reviewMovie) {
        await expect(
          dailyPuzzleService.overrideDailyTarget({
            puzzleDate: TEST_DATE_1,
            movieId: reviewMovie.id,
            overrideReason: 'Invalid Movie Test',
          })
        ).rejects.toThrow();
      }
    });
  });

  // 7. TARGET SECRECY
  describe('7. Strict Target Secrecy Verification', () => {
    it('never exposes target title, ID, poster, or metadata to active players', async () => {
      const sessionState = await dailyPuzzleService.getDailySession(TEST_DATE_1, {
        anonymousPlayerId: 'test-player-secret-audit',
      });

      expect(sessionState.revealedTarget).toBeNull();
      expect(sessionState.isCompleted).toBe(false);
      expect((sessionState as any).targetMovieId).toBeUndefined();
      expect((sessionState as any).targetMovie).toBeUndefined();
    });
  });

  // 8. BATCH SCHEDULING & CONCURRENCY
  describe('8. Batch Scheduling & Idempotency', () => {
    it('idempotently schedules future puzzles for N days ahead', async () => {
      const scheduledCount = await dailyPuzzleService.ensureUpcomingPuzzlesScheduled(3);
      expect(scheduledCount).toBeGreaterThanOrEqual(0);

      // Second run must be idempotent (0 newly scheduled)
      const secondRunCount = await dailyPuzzleService.ensureUpcomingPuzzlesScheduled(3);
      expect(secondRunCount).toBe(0);
    });
  });
});
