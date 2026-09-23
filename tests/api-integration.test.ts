import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { gameEngine } from '@/modules/games/game-engine';
import { challengeService } from '@/modules/challenges/challenge-service';
import { movieRepository } from '@/modules/movies/movie-repository';

describe('AAta Chusthava Full Stack Domain & API Integration', () => {
  let createdChallengeId: string | undefined;
  let createdChallengeGameId: string | undefined;
  const TEST_DAILY_DATE = '2046-01-01';

  const cleanTestData = async () => {
    // Clean up created challenge and associated game
    if (createdChallengeId) {
      await prisma.challenge.deleteMany({
        where: { id: createdChallengeId },
      });
      createdChallengeId = undefined;
    }
    if (createdChallengeGameId) {
      await prisma.game.deleteMany({
        where: { id: createdChallengeGameId },
      });
      createdChallengeGameId = undefined;
    }

    // Clean up test daily puzzle, its game, and any sessions/guesses
    const testPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate: TEST_DAILY_DATE },
      select: { id: true, gameId: true },
    });
    if (testPuzzle) {
      const sessions = await prisma.gameSession.findMany({
        where: { gameId: testPuzzle.gameId },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        await prisma.gameGuess.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await prisma.gameSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }
      await prisma.dailyPuzzle.delete({
        where: { id: testPuzzle.id },
      });
      await prisma.game.delete({
        where: { id: testPuzzle.gameId },
      });
    }
  };

  beforeAll(async () => {
    // Ensure database connection
    await prisma.$queryRaw`SELECT 1`;
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
  });

  it('verifies daily session generation and strict target privacy', async () => {
    const sessionState = await dailyPuzzleService.getDailySession(TEST_DAILY_DATE, {
      anonymousPlayerId: 'test_anon_player_1',
    });

    expect(sessionState.sessionId).toBeDefined();
    expect(sessionState.mode).toBe('DAILY');
    expect(sessionState.maxAttempts).toBe(10);
    expect(sessionState.attemptsUsed).toBe(0);
    expect(sessionState.isCompleted).toBe(false);
    expect(sessionState.isWon).toBe(false);
    // CRITICAL: Hidden target must NEVER be exposed before completion
    expect(sessionState.revealedTarget).toBeNull();
  });

  it('performs internal movie search with correct filters', async () => {
    const results = await movieRepository.search('RRR', {
      playableAsGuessOnly: true,
      limit: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    const rrr = results.find((r) => r.primaryTitle === 'RRR');
    expect(rrr).toBeDefined();
    expect(rrr?.releaseYear).toBe(2022);
    expect(rrr?.supportedLanguages).toContain('TELUGU');
    expect(rrr?.directorNames).toContain('S. S. Rajamouli');
  });

  it('creates a custom friend challenge and generates opaque 6-char public code', async () => {
    const dangal = await prisma.movie.findFirst({
      where: { primaryTitle: 'Dangal' },
    });
    expect(dangal).toBeDefined();

    const challenge = await challengeService.createChallenge(
      dangal!.id,
      'Tollywood Fan 99'
    );
    createdChallengeId = challenge.challengeId;
    createdChallengeGameId = challenge.gameId;

    expect(challenge.publicCode).toBeDefined();
    expect(challenge.publicCode.length).toBe(6);
    expect(challenge.shareUrl).toContain(`/challenge/${challenge.publicCode}`);
    expect(challenge.targetMovieTitle).toContain('Dangal');

    // Resolve challenge session for another player
    const challengeSession = await challengeService.getChallengeSession(
      challenge.publicCode,
      { anonymousPlayerId: 'friend_player_2' }
    );

    expect(challengeSession.mode).toBe('CHALLENGE');
    expect(challengeSession.revealedTarget).toBeNull(); // Still hidden!
    expect(challengeSession.attemptsUsed).toBe(0);
  });

  it('executes full guess flow, verifies transactional state, and unlocks clues', async () => {
    const sessionState = await dailyPuzzleService.getDailySession(TEST_DAILY_DATE, {
      anonymousPlayerId: 'test_integration_guesser',
    });

    // Find a movie to guess
    const baahubali = await prisma.movie.findFirst({
      where: { slug: 'baahubali-2-the-conclusion-2017' },
    });
    expect(baahubali).toBeDefined();

    const guessResponse = await gameEngine.submitGuess(sessionState.sessionId, {
      movieId: baahubali!.id,
      clientRequestId: 'req_test_1',
    });

    expect(guessResponse.attemptNumber).toBe(1);
    expect(guessResponse.attemptsUsed).toBe(1);
    expect(guessResponse.attemptsRemaining).toBe(9);
    expect(guessResponse.evaluation).toBeDefined();
    expect(guessResponse.evaluation.clues).toBeDefined();
    expect(guessResponse.evaluation.clues.DIRECTOR).toBeDefined();
    expect(guessResponse.evaluation.clues.RELEASE_YEAR).toBeDefined();
    expect(guessResponse.revealedTarget).toBeNull(); // Target still strictly hidden!
  });
});
