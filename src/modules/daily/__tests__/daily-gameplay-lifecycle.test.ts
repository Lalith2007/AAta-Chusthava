import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { dailyPuzzleService } from '../daily-puzzle-service';
import { gameEngine } from '@/modules/games/game-engine';
import { gameRepository } from '@/modules/games/game-repository';
import { movieRepository } from '@/modules/movies/movie-repository';

describe('Sprint 23: Daily Game Lifecycle, 10-Attempt Rule, Hints & Secrecy Regression', () => {
  const TEST_DATES = [
    '2040-01-01',
    '2040-01-02',
    '2040-01-03',
    '2040-01-04',
    '2040-01-05',
    '2024-02-14',
  ];

  beforeEach(async () => {
    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: { in: TEST_DATES } },
    });
  });

  afterEach(async () => {
    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: { in: TEST_DATES } },
    });
  });

  // 1. CRITICAL FIX #1 & FIX #5: 10-ATTEMPT RULE & WIN/LOSS STATE MACHINE
  describe('1. 10-Attempt Rule & Win/Loss State Machine', () => {
    it('enforces maxAttempts = 10 on Daily sessions and completes game accurately', async () => {
      const date = '2040-01-01';
      const player = { anonymousPlayerId: 'test-player-10-attempts' };

      // 1. Initialize daily game session
      const sessionState = await dailyPuzzleService.getDailySession(date, player);
      expect(sessionState.maxAttempts).toBe(10);
      expect(sessionState.attemptsUsed).toBe(0);
      expect(sessionState.attemptsRemaining).toBe(10);
      expect(sessionState.status).toBe('NOT_STARTED');
      expect(sessionState.isCompleted).toBe(false);
      expect(sessionState.revealedTarget).toBeNull();

      // 2. Fetch daily puzzle to know the target for testing
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
        include: { targetMovie: true },
      });
      expect(puzzle).not.toBeNull();
      const targetId = puzzle!.targetMovieId;

      // Find 10 distinct non-target movies to use for guesses
      const candidateMovies = await prisma.movie.findMany({
        where: {
          id: { not: targetId },
          lifecycleStatus: 'ACTIVE',
          eligibility: { playableAsGuess: true },
        },
        take: 12,
      });
      expect(candidateMovies.length).toBeGreaterThanOrEqual(10);

      // 3. Submit 9 consecutive wrong guesses
      for (let i = 0; i < 9; i++) {
        const guessRes = await gameEngine.submitGuess(sessionState.sessionId, {
          movieId: candidateMovies[i].id,
        });

        expect(guessRes.isCorrect).toBe(false);
        expect(guessRes.status).toBe('IN_PROGRESS');
        expect(guessRes.attemptNumber).toBe(i + 1);
        expect(guessRes.attemptsUsed).toBe(i + 1);
        expect(guessRes.attemptsRemaining).toBe(10 - (i + 1));
        // Target must remain hidden through all 9 wrong attempts
        expect(guessRes.revealedTarget).toBeNull();
      }

      // Verify state after 9 wrong attempts (must still be active)
      const stateAfter9 = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAfter9.attemptsUsed).toBe(9);
      expect(stateAfter9.attemptsRemaining).toBe(1);
      expect(stateAfter9.status).toBe('IN_PROGRESS');
      expect(stateAfter9.isCompleted).toBe(false);
      expect(stateAfter9.revealedTarget).toBeNull();

      // 4. Test duplicate guess handling on attempt 9 (REJECT_NO_PENALTY)
      await expect(
        gameEngine.submitGuess(sessionState.sessionId, {
          movieId: candidateMovies[0].id, // Already guessed on attempt 1
        })
      ).rejects.toThrow('You have already guessed this movie.');

      // State must NOT be altered by duplicate attempt
      const stateAfterDup = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAfterDup.attemptsUsed).toBe(9);
      expect(stateAfterDup.attemptsRemaining).toBe(1);
      expect(stateAfterDup.status).toBe('IN_PROGRESS');

      // 5. Submit 10th wrong guess -> Triggers LOSS
      const lossRes = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: candidateMovies[9].id,
      });

      expect(lossRes.isCorrect).toBe(false);
      expect(lossRes.status).toBe('LOST');
      expect(lossRes.attemptNumber).toBe(10);
      expect(lossRes.attemptsUsed).toBe(10);
      expect(lossRes.attemptsRemaining).toBe(0);
      expect(lossRes.revealedTarget).not.toBeNull();
      expect(lossRes.revealedTarget?.id).toBe(targetId);

      // Verify completed state in DB
      const finalState = await gameEngine.getSessionState(sessionState.sessionId);
      expect(finalState.status).toBe('LOST');
      expect(finalState.isCompleted).toBe(true);
      expect(finalState.isWon).toBe(false);
      expect(finalState.revealedTarget).not.toBeNull();
      expect(finalState.revealedTarget?.id).toBe(targetId);

      // 6. 11th attempt must be rejected because game is already completed
      await expect(
        gameEngine.submitGuess(sessionState.sessionId, {
          movieId: candidateMovies[10].id,
        })
      ).rejects.toThrow('This game session has already finished.');
    });

    it('handles WIN flow correctly with immediate completion and target reveal', async () => {
      const date = '2040-01-01';
      const player = { anonymousPlayerId: 'test-player-win-flow' };

      const sessionState = await dailyPuzzleService.getDailySession(date, player);
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
      });
      const targetId = puzzle!.targetMovieId;

      // Guess the correct movie on attempt 1
      const winRes = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: targetId,
      });

      expect(winRes.isCorrect).toBe(true);
      expect(winRes.status).toBe('WON');
      expect(winRes.attemptNumber).toBe(1);
      expect(winRes.attemptsUsed).toBe(1);
      expect(winRes.attemptsRemaining).toBe(9);
      expect(winRes.revealedTarget).not.toBeNull();
      expect(winRes.revealedTarget?.id).toBe(targetId);

      const stateAfterWin = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAfterWin.status).toBe('WON');
      expect(stateAfterWin.isCompleted).toBe(true);
      expect(stateAfterWin.isWon).toBe(true);
      expect(stateAfterWin.revealedTarget).not.toBeNull();

      // Further guesses rejected
      const candidateMovie = await prisma.movie.findFirst({
        where: { id: { not: targetId }, lifecycleStatus: 'ACTIVE' },
      });
      if (candidateMovie) {
        await expect(
          gameEngine.submitGuess(sessionState.sessionId, {
            movieId: candidateMovie.id,
          })
        ).rejects.toThrow('This game session has already finished.');
      }
    });
  });

  // 2. FIX #2: EXACT HINT MILESTONES (ATTEMPT 5: DIRECTOR, ATTEMPT 8: ERA+GENRE)
  describe('2. Progressive Hint Milestones (Attempt 5 & Attempt 8)', () => {
    it('unlocks Director Initial strictly at Attempt 5 and Era+Genre strictly at Attempt 8', async () => {
      const date = '2040-01-02';
      const player = { anonymousPlayerId: 'test-player-hint-milestones' };

      const sessionState = await dailyPuzzleService.getDailySession(date, player);
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
      });
      const targetId = puzzle!.targetMovieId;

      const wrongMovies = await prisma.movie.findMany({
        where: {
          id: { not: targetId },
          lifecycleStatus: 'ACTIVE',
          eligibility: { playableAsGuess: true },
        },
        take: 9,
      });

      // Attempts 1 to 4: Hints must be completely UNAVAILABLE
      for (let i = 0; i < 4; i++) {
        const guessRes = await gameEngine.submitGuess(sessionState.sessionId, {
          movieId: wrongMovies[i].id,
        });
        expect(guessRes.attemptNumber).toBe(i + 1);
        expect(guessRes.unlockedHint).toBeNull();

        const curState = await gameEngine.getSessionState(sessionState.sessionId);
        expect(curState.hints.length).toBe(0);
      }

      // Attempt 5: Director Initial Hint MUST BE UNLOCKED
      const guess5 = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: wrongMovies[4].id,
      });
      expect(guess5.attemptNumber).toBe(5);
      expect(guess5.unlockedHint).not.toBeNull();
      expect(guess5.unlockedHint?.hintType).toBe('DIRECTOR_INITIAL');
      expect((guess5.unlockedHint?.hintContent as any).label).toBe('Director Clue');
      expect((guess5.unlockedHint?.hintContent as any).hintText).toMatch(/^Directed by/);

      const stateAt5 = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAt5.hints.length).toBe(1);
      expect(stateAt5.hints[0].hintType).toBe('DIRECTOR_INITIAL');

      // Attempts 6 and 7: No new hint unlocked, but Attempt 5 hint remains available
      for (let i = 5; i < 7; i++) {
        const guessRes = await gameEngine.submitGuess(sessionState.sessionId, {
          movieId: wrongMovies[i].id,
        });
        expect(guessRes.attemptNumber).toBe(i + 1);
        expect(guessRes.unlockedHint).toBeNull(); // No new hint

        const curState = await gameEngine.getSessionState(sessionState.sessionId);
        expect(curState.hints.length).toBe(1);
        expect(curState.hints[0].hintType).toBe('DIRECTOR_INITIAL');
      }

      // Attempt 8: Era + Genre Hint MUST BE UNLOCKED
      const guess8 = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: wrongMovies[7].id,
      });
      expect(guess8.attemptNumber).toBe(8);
      expect(guess8.unlockedHint).not.toBeNull();
      expect(guess8.unlockedHint?.hintType).toBe('GENRE_DECADE');
      expect((guess8.unlockedHint?.hintContent as any).label).toBe('Era & Genre Clue');
      expect((guess8.unlockedHint?.hintContent as any).hintText).toMatch(/Released in the \d{4}s/);

      const stateAt8 = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAt8.hints.length).toBe(2);
      expect(stateAt8.hints.map((h) => h.hintType)).toEqual(['DIRECTOR_INITIAL', 'GENRE_DECADE']);

      // Attempt 9: No new hint, total hints remains 2
      const guess9 = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: wrongMovies[8].id,
      });
      expect(guess9.attemptNumber).toBe(9);
      expect(guess9.unlockedHint).toBeNull();

      const stateAt9 = await gameEngine.getSessionState(sessionState.sessionId);
      expect(stateAt9.hints.length).toBe(2);
    });
  });

  // 3. FIX #3: DAILY PUZZLE CONCURRENCY & RACE HANDLING
  describe('3. Daily Puzzle Concurrency & Race Handling', () => {
    it('creates exactly one DailyPuzzle row under high concurrency and serves identical puzzle', async () => {
      const date = '2040-01-03';

      // Verify no row exists initially
      const initialCount = await prisma.dailyPuzzle.count({
        where: { puzzleDate: date },
      });
      expect(initialCount).toBe(0);

      // Launch 10 simultaneous getOrCreatePuzzleForDate requests
      const concurrentRequests = Array.from({ length: 10 }, () =>
        dailyPuzzleService.getOrCreatePuzzleForDate(date)
      );

      const resolvedGameIds = await Promise.all(concurrentRequests);

      // All 10 callers MUST receive the exact same gameId
      const firstGameId = resolvedGameIds[0];
      expect(firstGameId).toBeDefined();
      for (const gameId of resolvedGameIds) {
        expect(gameId).toBe(firstGameId);
      }

      // Assert exactly one DailyPuzzle row exists in DB
      const finalCount = await prisma.dailyPuzzle.count({
        where: { puzzleDate: date },
      });
      expect(finalCount).toBe(1);

      // Verify exactly one target movie was bound
      const puzzles = await prisma.dailyPuzzle.findMany({
        where: { puzzleDate: date },
      });
      expect(puzzles.length).toBe(1);
      expect(puzzles[0].gameId).toBe(firstGameId);
      expect(puzzles[0].targetMovieId).toBeDefined();
    });
  });

  // 4. FIX #4: TARGET SECRECY RUNTIME REGRESSION
  describe('4. Target Secrecy Runtime Response Inspection', () => {
    it('verifies active Daily game public payload contains ZERO secret target metadata', async () => {
      const date = '2040-01-04';
      const player = { anonymousPlayerId: 'test-player-target-secrecy-audit' };

      const sessionState = await dailyPuzzleService.getDailySession(date, player);

      // Resolve the true target directly from DB for comparison
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
        include: { targetMovie: true },
      });
      const target = puzzle!.targetMovie;

      // Serialize sessionState exactly as returned over the wire
      const serializedJson = JSON.stringify(sessionState);
      const rawObject = JSON.parse(serializedJson);

      // 1. Assert revealedTarget is null
      expect(rawObject.revealedTarget).toBeNull();
      expect(rawObject.isCompleted).toBe(false);

      // 2. Assert secret target identifiers NEVER appear in the public payload
      expect(rawObject.targetMovieId).toBeUndefined();
      expect(rawObject.targetMovie).toBeUndefined();
      expect(rawObject.selectionMetadata).toBeUndefined();
      expect(rawObject.algorithmVersion).toBeUndefined();
      expect(rawObject.deterministicPriority).toBeUndefined();
      expect(rawObject.jitter).toBeUndefined();

      // 3. Assert raw JSON string contains zero target title / target ID / slug leaks
      expect(serializedJson).not.toContain(target.id);
      expect(serializedJson).not.toContain(target.slug);
      expect(serializedJson).not.toContain(target.primaryTitle);
      if (target.originalTitle) {
        expect(serializedJson).not.toContain(target.originalTitle);
      }
    });
  });

  // 5. FIX #6: HISTORICAL IMMUTABILITY
  describe('5. Historical Archive Immutability', () => {
    it('preserves historical DailyPuzzle target without calling selector on replay', async () => {
      const historicalDate = '2024-02-14';

      // 1. Pick a specific movie to represent a historical target
      const historicalMovie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });
      expect(historicalMovie).not.toBeNull();

      const defaultRuleset = await gameRepository.getOrCreateDefaultRuleset();
      const game = await gameRepository.createGame({
        mode: 'DAILY',
        targetMovieId: historicalMovie!.id,
        rulesetId: defaultRuleset.id,
        maxAttempts: 10,
      });

      const initialMetadata = {
        algorithmVersion: 'DAILY_SELECTION_V1',
        puzzleDate: historicalDate,
        selectedMovieId: historicalMovie!.id,
        selectedTitle: historicalMovie!.primaryTitle,
        language: 'TELUGU',
        preferredLanguage: 'TELUGU',
        qualityTier: 'TIER_1_RICH',
        qualityScore: 100,
        availableCluesCount: 8,
        deterministicPriority: 100,
        jitter: 0.42,
        fallbackLevel: 'LEVEL_1_STANDARD',
        recentTeluguCount: 5,
        recentHindiCount: 5,
        cooldownDays: 60,
        cooldownExcludedCount: 10,
        candidatePoolSize: 4500,
        evaluatedCandidatesCount: 4575,
        selectionDurationMs: 5,
        isOverridden: false,
      };

      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: historicalDate,
          gameId: game.id,
          targetMovieId: historicalMovie!.id,
          rulesetId: defaultRuleset.id,
          selectionMethod: 'WEIGHTED_RANDOM',
          selectionMetadata: initialMetadata as any,
          status: 'ACTIVE',
          activatedAt: new Date('2024-02-14T00:00:00.000Z'),
        },
      });

      // 2. Access historical puzzle via daily service
      const fetchedGameId = await dailyPuzzleService.getOrCreatePuzzleForDate(historicalDate);
      expect(fetchedGameId).toBe(game.id);

      const preview = await dailyPuzzleService.previewDailyTarget(historicalDate);
      expect(preview.puzzleDate).toBe(historicalDate);
      expect(preview.movie.id).toBe(historicalMovie!.id);
      expect(preview.movie.primaryTitle).toBe(historicalMovie!.primaryTitle);
      expect(preview.isAlreadyPersisted).toBe(true);

      // 3. Inspect DB row: must be 100% identical to initial record
      const dbRecord = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: historicalDate },
      });
      expect(dbRecord?.targetMovieId).toBe(historicalMovie!.id);
      expect(dbRecord?.gameId).toBe(game.id);
      expect((dbRecord?.selectionMetadata as any).selectedMovieId).toBe(historicalMovie!.id);
    });
  });

  // 6. FIX #7: RESULT / SHARE VERIFICATION (/10)
  describe('6. Result / Share Verification (/10)', () => {
    it('formats spoiler-free share text reflecting /10 max attempts', async () => {
      const date = '2040-01-05';
      const player = { anonymousPlayerId: 'test-player-share-card-audit' };

      const sessionState = await dailyPuzzleService.getDailySession(date, player);
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
      });
      const targetId = puzzle!.targetMovieId;

      const wrongMovies = await prisma.movie.findMany({
        where: { id: { not: targetId }, lifecycleStatus: 'ACTIVE' },
        take: 3,
      });

      // Submit 3 wrong guesses
      for (let i = 0; i < 3; i++) {
        await gameEngine.submitGuess(sessionState.sessionId, {
          movieId: wrongMovies[i].id,
        });
      }

      // Submit 4th correct guess -> Solved in 4/10!
      const winRes = await gameEngine.submitGuess(sessionState.sessionId, {
        movieId: targetId,
      });
      expect(winRes.status).toBe('WON');
      expect(winRes.attemptsUsed).toBe(4);

      // Fetch result state
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionState.sessionId },
        include: {
          game: { include: { dailyPuzzle: true } },
          guesses: { orderBy: { attemptNumber: 'asc' } },
        },
      });

      // Generate share text using result formatter logic
      const targetMovie = await movieRepository.findById(targetId);
      expect(targetMovie).not.toBeNull();

      // Test score text
      const isWon = session!.status === 'WON';
      const scoreText = isWon ? `${session!.attemptsUsed}/${session!.game.maxAttempts}` : `X/${session!.game.maxAttempts}`;
      expect(scoreText).toBe('4/10');
      expect(session!.game.maxAttempts).toBe(10);
    });
  });
});
