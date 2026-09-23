import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { dailyPuzzleService } from '../daily-puzzle-service';
import { dailyPuzzleSelector } from '../daily-puzzle-selector';
import { gameEngine } from '@/modules/games/game-engine';
import { getIndianCalendarDate, addDaysToPuzzleDate, subtractDaysFromPuzzleDate } from '@/lib/date-utils';
import { AppError } from '@/domain/errors';

describe('Sprint 25: Historical Daily Archive Hardening & Immutability Suite', () => {
  const TEST_PAST_DATE_1 = '2023-05-10';
  const TEST_PAST_DATE_2 = '2023-05-11';
  const TEST_NONEXISTENT_PAST_DATE = '2021-11-20';
  const TEST_FUTURE_DATE = '2048-01-01';
  const ALL_TEST_DATES = [TEST_PAST_DATE_1, TEST_PAST_DATE_2, TEST_NONEXISTENT_PAST_DATE, TEST_FUTURE_DATE];

  const cleanArchivePuzzles = async () => {
    const testPuzzles = await prisma.dailyPuzzle.findMany({
      where: { puzzleDate: { in: ALL_TEST_DATES } },
      select: { id: true, gameId: true },
    });
    const gameIds = testPuzzles.map((p) => p.gameId);
    if (testPuzzles.length > 0) {
      await prisma.dailyPuzzle.deleteMany({
        where: { id: { in: testPuzzles.map((p) => p.id) } },
      });
    }
    if (gameIds.length > 0) {
      await prisma.game.deleteMany({
        where: { id: { in: gameIds } },
      });
    }
  };

  beforeEach(async () => {
    await cleanArchivePuzzles();
  });

  afterEach(async () => {
    await cleanArchivePuzzles();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. CRITICAL REGRESSION TEST — ARCHIVE MUST NEVER CREATE DAILY PUZZLE
  // =========================================================================
  describe('1. Critical Invariant: Non-Existent Historical Date Must Not Create Puzzle or Invoke Selector', () => {
    it('returns ARCHIVE_NOT_FOUND (404), creates 0 DailyPuzzle rows, creates 0 Game rows, and never invokes selector', async () => {
      const selectorSpy = vi.spyOn(dailyPuzzleSelector, 'selectDailyTarget');

      const initialPuzzleCount = await prisma.dailyPuzzle.count({
        where: { puzzleDate: TEST_NONEXISTENT_PAST_DATE },
      });
      expect(initialPuzzleCount).toBe(0);

      const initialGameCount = await prisma.game.count();

      // Attempt archive lookup for non-existent date
      try {
        await dailyPuzzleService.getArchiveSession(TEST_NONEXISTENT_PAST_DATE, {
          anonymousPlayerId: 'test_archive_player',
        });
        expect.unreachable('Should have thrown ARCHIVE_NOT_FOUND');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe('ARCHIVE_NOT_FOUND');
        expect(err.statusCode).toBe(404);
      }

      // Assert 0 DailyPuzzle rows created
      const finalPuzzleCount = await prisma.dailyPuzzle.count({
        where: { puzzleDate: TEST_NONEXISTENT_PAST_DATE },
      });
      expect(finalPuzzleCount).toBe(0);

      // Assert 0 Game rows created
      const finalGameCount = await prisma.game.count();
      expect(finalGameCount).toBe(initialGameCount);

      // Assert selector was NEVER invoked
      expect(selectorSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. DATE BOUNDARY TESTS
  // =========================================================================
  describe('2. Date Boundaries & Validation for Archive Mode', () => {
    it('successfully resolves an existing historical Daily puzzle without selector invocation', async () => {
      // 1. Pre-create a historical Daily puzzle (simulating an already-occurred daily game)
      const movie = await prisma.movie.findFirst({
        where: { primaryTitle: 'RRR', lifecycleStatus: 'ACTIVE' },
      });
      expect(movie).not.toBeNull();

      const game = await prisma.game.create({
        data: {
          mode: 'DAILY',
          targetMovieId: movie!.id,
          rulesetId: (await prisma.gameRuleset.findFirst())!.id,
          maxAttempts: 10,
          status: 'ACTIVE',
        },
      });

      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: TEST_PAST_DATE_1,
          gameId: game.id,
          targetMovieId: movie!.id,
          rulesetId: game.rulesetId,
          selectionMethod: 'WEIGHTED_RANDOM',
          algorithmVersion: 'DAILY_SELECTION_V1',
          status: 'ARCHIVED',
        },
      });

      const selectorSpy = vi.spyOn(dailyPuzzleSelector, 'selectDailyTarget');

      // 2. Play archive game
      const player = { anonymousPlayerId: 'archive_historian_1' };
      const sessionState = await dailyPuzzleService.getArchiveSession(TEST_PAST_DATE_1, player);

      expect(sessionState.sessionId).toBeDefined();
      expect(sessionState.gameId).toBe(game.id);
      expect(sessionState.mode).toBe('DAILY');
      expect(sessionState.maxAttempts).toBe(10);
      expect(sessionState.attemptsUsed).toBe(0);
      expect(sessionState.isCompleted).toBe(false);
      expect(sessionState.revealedTarget).toBeNull();
      expect(sessionState.puzzleDate).toBe(TEST_PAST_DATE_1);

      // Selector was never called
      expect(selectorSpy).not.toHaveBeenCalled();
    });

    it('rejects current today IST date in Archive mode', async () => {
      const todayIST = getIndianCalendarDate(new Date());

      try {
        await dailyPuzzleService.getArchiveSession(todayIST, {
          anonymousPlayerId: 'test_player',
        });
        expect.unreachable('Should have rejected today IST from archive');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('not a past historical date');
      }
    });

    it('rejects future dates in Archive mode', async () => {
      const todayIST = getIndianCalendarDate(new Date());
      const futureDate = addDaysToPuzzleDate(todayIST, 5);

      try {
        await dailyPuzzleService.getArchiveSession(futureDate, {
          anonymousPlayerId: 'test_player',
        });
        expect.unreachable('Should have rejected future date from archive');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.statusCode).toBe(400);
      }
    });

    it('rejects malformed date strings in Archive mode', async () => {
      const malformedDates = ['not-a-date', '2024-13-01', '2024-00-10', '2024/05/10', ''];

      for (const badDate of malformedDates) {
        try {
          await dailyPuzzleService.getArchiveSession(badDate, {
            anonymousPlayerId: 'test_player',
          });
          expect.unreachable(`Should have rejected malformed date: ${badDate}`);
        } catch (err: any) {
          expect(err).toBeInstanceOf(AppError);
          expect(err.code).toBe('VALIDATION_ERROR');
          expect(err.statusCode).toBe(400);
        }
      }
    });
  });

  // =========================================================================
  // 3. MULTI-PLAYER ARCHIVE ISOLATION & GAMEPLAY
  // =========================================================================
  describe('3. Multi-Player Isolation & Full Gameplay on Historical Puzzles', () => {
    it('isolates independent player sessions on the same historical puzzle', async () => {
      // Create historical puzzle
      const targetMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'Dangal', lifecycleStatus: 'ACTIVE' },
      });
      const ruleset = await prisma.gameRuleset.findFirst();

      const game = await prisma.game.create({
        data: {
          mode: 'DAILY',
          targetMovieId: targetMovie!.id,
          rulesetId: ruleset!.id,
          maxAttempts: 10,
        },
      });

      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: TEST_PAST_DATE_2,
          gameId: game.id,
          targetMovieId: targetMovie!.id,
          rulesetId: ruleset!.id,
          status: 'ARCHIVED',
        },
      });

      const playerA = { anonymousPlayerId: 'archive_player_alpha' };
      const playerB = { anonymousPlayerId: 'archive_player_beta' };

      const sessionA = await dailyPuzzleService.getArchiveSession(TEST_PAST_DATE_2, playerA);
      const sessionB = await dailyPuzzleService.getArchiveSession(TEST_PAST_DATE_2, playerB);

      expect(sessionA.sessionId).not.toBe(sessionB.sessionId);
      expect(sessionA.gameId).toBe(game.id);
      expect(sessionB.gameId).toBe(game.id);

      // Player A guesses Pushpa
      const pushpa = await prisma.movie.findFirst({
        where: { primaryTitle: 'Pushpa: The Rise', lifecycleStatus: 'ACTIVE' },
      });
      await gameEngine.submitGuess(sessionA.sessionId, { movieId: pushpa!.id });

      // Player B remains at 0 attempts
      const stateB = await gameEngine.getSessionState(sessionB.sessionId);
      expect(stateB.attemptsUsed).toBe(0);
      expect(stateB.guesses.length).toBe(0);

      // Player A wins
      const winResA = await gameEngine.submitGuess(sessionA.sessionId, { movieId: targetMovie!.id });
      expect(winResA.status).toBe('WON');
      expect(winResA.isCorrect).toBe(true);

      // Player B is still NOT_STARTED and target is NOT leaked to B
      const currentB = await gameEngine.getSessionState(sessionB.sessionId);
      expect(currentB.status).toBe('NOT_STARTED');
      expect(currentB.revealedTarget).toBeNull();
    });
  });

  // =========================================================================
  // 4. ARCHIVE LISTING FILTERING & TARGET SECRECY
  // =========================================================================
  describe('4. Archive Listing Filtering & Public Secrecy', () => {
    it('returns only genuinely historical past puzzles and never exposes secret target data', async () => {
      const todayIST = getIndianCalendarDate(new Date());
      const pastDate = TEST_PAST_DATE_1;
      const futureDate = TEST_FUTURE_DATE;

      // Clean up test dates if already existing
      const existingTestPuzzles = await prisma.dailyPuzzle.findMany({
        where: { puzzleDate: { in: [pastDate, futureDate] } },
        select: { id: true, gameId: true },
      });
      if (existingTestPuzzles.length > 0) {
        await prisma.dailyPuzzle.deleteMany({
          where: { id: { in: existingTestPuzzles.map((p) => p.id) } },
        });
        await prisma.game.deleteMany({
          where: { id: { in: existingTestPuzzles.map((p) => p.gameId) } },
        });
      }

      const movie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });
      const ruleset = await prisma.gameRuleset.findFirst();

      // Create a past puzzle and a future puzzle
      const pastGame = await prisma.game.create({
        data: { mode: 'DAILY', targetMovieId: movie!.id, rulesetId: ruleset!.id },
      });
      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: pastDate,
          gameId: pastGame.id,
          targetMovieId: movie!.id,
          rulesetId: ruleset!.id,
          status: 'ACTIVE',
        },
      });

      const futureGame = await prisma.game.create({
        data: { mode: 'DAILY', targetMovieId: movie!.id, rulesetId: ruleset!.id },
      });
      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: futureDate,
          gameId: futureGame.id,
          targetMovieId: movie!.id,
          rulesetId: ruleset!.id,
          status: 'ACTIVE',
        },
      });

      try {
        // Fetch archive list
        const archives = await dailyPuzzleService.getArchivePuzzles(60);

        // Past date MUST be in list
        expect(archives.some((a) => a.puzzleDate === pastDate)).toBe(true);

        // Today and Future dates MUST NOT be in archive list
        expect(archives.some((a) => a.puzzleDate === todayIST)).toBe(false);
        expect(archives.some((a) => a.puzzleDate === futureDate)).toBe(false);

        // Verify ZERO target metadata in serialized archive listing
        const serialized = JSON.stringify(archives);
        expect(serialized).not.toContain(movie!.id);
        expect(serialized).not.toContain(movie!.primaryTitle);
        expect(serialized).not.toContain('selectionMetadata');
      } finally {
        await prisma.dailyPuzzle.deleteMany({
          where: { puzzleDate: { in: [pastDate, futureDate] } },
        });
        await prisma.game.deleteMany({
          where: { id: { in: [pastGame.id, futureGame.id] } },
        });
      }
    });
  });

  // =========================================================================
  // 5. DAILY REGRESSION TEST
  // =========================================================================
  describe('5. Daily Gameplay Regressions (Confirm Daily Creation Remains Intact)', () => {
    it('verifies that getDailySession continues to dynamically create today puzzle via selection engine', async () => {
      const testDate = '2045-05-15';

      // Ensure test puzzle is clean
      const existing = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: testDate },
        select: { id: true, gameId: true },
      });
      if (existing) {
        await prisma.dailyPuzzle.delete({ where: { id: existing.id } });
        await prisma.game.delete({ where: { id: existing.gameId } });
      }

      const selectorSpy = vi.spyOn(dailyPuzzleSelector, 'selectDailyTarget');

      try {
        const session = await dailyPuzzleService.getDailySession(testDate, {
          anonymousPlayerId: 'daily_regression_tester',
        });

        expect(session.sessionId).toBeDefined();
        expect(session.mode).toBe('DAILY');
        expect(session.maxAttempts).toBe(10);
        expect(session.isCompleted).toBe(false);
        expect(session.revealedTarget).toBeNull();

        // Selector WAS called for Daily
        expect(selectorSpy).toHaveBeenCalledWith(testDate);

        // DailyPuzzle row exists in DB
        const createdPuzzle = await prisma.dailyPuzzle.findUnique({
          where: { puzzleDate: testDate },
        });
        expect(createdPuzzle).not.toBeNull();
        expect(createdPuzzle!.status).toBe('ACTIVE');
      } finally {
        const createdPuzzle = await prisma.dailyPuzzle.findUnique({
          where: { puzzleDate: testDate },
          select: { id: true, gameId: true },
        });
        if (createdPuzzle) {
          await prisma.dailyPuzzle.delete({ where: { id: createdPuzzle.id } });
          await prisma.game.delete({ where: { id: createdPuzzle.gameId } });
        }
      }
    });
  });
});
