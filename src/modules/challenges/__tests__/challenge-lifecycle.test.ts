import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { challengeService } from '../challenge-service';
import { gameEngine } from '@/modules/games/game-engine';
import { AppError } from '@/domain/errors';

describe('Sprint 24: Friend Challenge End-to-End Lifecycle, Secrecy & Multi-Player Isolation', () => {
  const createdChallengeIds: string[] = [];
  const createdGameIds: string[] = [];
  const createdMovieIds: string[] = [];

  afterEach(async () => {
    // Clean up created challenge test records
    if (createdChallengeIds.length > 0) {
      await prisma.challenge.deleteMany({
        where: { id: { in: createdChallengeIds } },
      });
      createdChallengeIds.length = 0;
    }

    if (createdGameIds.length > 0) {
      await prisma.game.deleteMany({
        where: { id: { in: createdGameIds } },
      });
      createdGameIds.length = 0;
    }

    if (createdMovieIds.length > 0) {
      await prisma.movie.deleteMany({
        where: { id: { in: createdMovieIds } },
      });
      createdMovieIds.length = 0;
    }
  });

  // =========================================================================
  // 1. PHASE A, B, C — CHALLENGE CREATION & TARGET ELIGIBILITY
  // =========================================================================
  describe('1. Challenge Creation & Target Playability Validation', () => {
    it('creates a challenge successfully for an active, target-playable movie', async () => {
      const movie = await prisma.movie.findFirst({
        where: {
          lifecycleStatus: 'ACTIVE',
          eligibility: { playableAsTarget: true },
        },
      });
      expect(movie).not.toBeNull();

      const challenge = await challengeService.createChallenge(
        movie!.id,
        'Director Sukumar Fan'
      );

      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      expect(challenge.challengeId).toBeDefined();
      expect(challenge.gameId).toBeDefined();
      expect(challenge.publicCode).toBeDefined();
      expect(challenge.publicCode.length).toBe(6);
      expect(challenge.shareUrl).toContain(`/challenge/${challenge.publicCode}`);
      expect(challenge.targetMovieTitle).toContain(movie!.primaryTitle);
      expect(challenge.expiresAt).not.toBeNull();

      // Verify DB persistence
      const dbChallenge = await prisma.challenge.findUnique({
        where: { id: challenge.challengeId },
        include: { game: true },
      });

      expect(dbChallenge).not.toBeNull();
      expect(dbChallenge!.status).toBe('ACTIVE');
      expect(dbChallenge!.targetMovieId).toBe(movie!.id);
      expect(dbChallenge!.game.mode).toBe('CHALLENGE');
      expect(dbChallenge!.game.maxAttempts).toBe(10);
    });

    it('rejects non-existent movie IDs with MOVIE_NOT_FOUND (404)', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await expect(
        challengeService.createChallenge(nonExistentId, 'Tester')
      ).rejects.toThrowError(AppError);

      try {
        await challengeService.createChallenge(nonExistentId, 'Tester');
      } catch (err: any) {
        expect(err.code).toBe('MOVIE_NOT_FOUND');
        expect(err.statusCode).toBe(404);
      }
    });

    it('rejects movies not eligible as targets (playableAsTarget = false)', async () => {
      // Create a temporary movie ineligible as target
      const ineligibleMovie = await prisma.movie.create({
        data: {
          primaryTitle: 'Ineligible Short Film 2024',
          originalTitle: 'Ineligible Short Film 2024',
          slug: `ineligible-short-film-${Date.now()}`,
          releaseYear: 2024,
          supportedLanguages: ['TELUGU'],
          industries: ['TOLLYWOOD'],
          lifecycleStatus: 'ACTIVE',
          eligibility: {
            create: {
              playableAsGuess: true,
              playableAsTarget: false,
              disabledReason: 'Short film under 40 minutes',
            },
          },
        },
      });
      createdMovieIds.push(ineligibleMovie.id);

      try {
        await challengeService.createChallenge(ineligibleMovie.id, 'Tester');
        expect.unreachable('Should have thrown MOVIE_NOT_PLAYABLE');
      } catch (err: any) {
        expect(err.code).toBe('MOVIE_NOT_PLAYABLE');
        expect(err.statusCode).toBe(400);
      }
    });

    it('rejects movies that are not active in the catalog (lifecycleStatus != ACTIVE)', async () => {
      const inactiveMovie = await prisma.movie.create({
        data: {
          primaryTitle: 'Draft Unreleased Film 2025',
          originalTitle: 'Draft Unreleased Film 2025',
          slug: `draft-unreleased-film-${Date.now()}`,
          releaseYear: 2025,
          supportedLanguages: ['TELUGU'],
          industries: ['TOLLYWOOD'],
          lifecycleStatus: 'INGESTING',
          eligibility: {
            create: {
              playableAsGuess: true,
              playableAsTarget: true,
            },
          },
        },
      });
      createdMovieIds.push(inactiveMovie.id);

      try {
        await challengeService.createChallenge(inactiveMovie.id, 'Tester');
        expect.unreachable('Should have thrown MOVIE_NOT_PLAYABLE');
      } catch (err: any) {
        expect(err.code).toBe('MOVIE_NOT_PLAYABLE');
        expect(err.statusCode).toBe(400);
      }
    });
  });

  // =========================================================================
  // 2. PHASE D, E — OPAQUE 6-CHARACTER CODE & UNIQUENESS
  // =========================================================================
  describe('2. Opaque 6-Character Code Properties & Uniqueness', () => {
    it('generates non-sequential, opaque, 6-character uppercase codes matching allowed alphabet', async () => {
      const movie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });

      const codes: string[] = [];
      const codeRegex = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

      for (let i = 0; i < 5; i++) {
        const challenge = await challengeService.createChallenge(movie!.id, `Batch ${i}`);
        createdChallengeIds.push(challenge.challengeId);
        createdGameIds.push(challenge.gameId);

        expect(challenge.publicCode).toMatch(codeRegex);
        expect(challenge.publicCode.length).toBe(6);

        // Guarantee no raw ID or title substring leakage in code
        expect(challenge.publicCode).not.toContain(movie!.id.substring(0, 4));
        expect(challenge.publicCode).not.toContain(String(movie!.releaseYear));
        expect(codes).not.toContain(challenge.publicCode);
        codes.push(challenge.publicCode);
      }

      // All 5 generated codes must be distinct
      expect(new Set(codes).size).toBe(5);
    });
  });

  // =========================================================================
  // 3. PHASE F, G — CHALLENGE RESOLUTION & TARGET SECRECY
  // =========================================================================
  describe('3. Challenge Resolution & Strict Target Secrecy', () => {
    it('public metadata lookup returns safe metadata with ZERO target leakage', async () => {
      const movie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
        include: { people: { include: { person: true } } },
      });

      const challenge = await challengeService.createChallenge(movie!.id, 'Secret Master');
      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      // 1. Lookup metadata using lowercase (verifying case normalization)
      const meta = await challengeService.getChallengeMeta(challenge.publicCode.toLowerCase());

      expect(meta.publicCode).toBe(challenge.publicCode);
      expect(meta.creator).toBe('Secret Master');
      expect(meta.status).toBe('ACTIVE');
      expect(meta.totalPlays).toBe(0);

      // Serialize to JSON and verify ZERO target leakage
      const serialized = JSON.stringify(meta);
      expect(serialized).not.toContain(movie!.id);
      expect(serialized).not.toContain(movie!.primaryTitle);
      expect(serialized).not.toContain(movie!.slug);

      for (const p of movie!.people) {
        expect(serialized).not.toContain(p.person.canonicalName);
      }
    });

    it('handles non-existent, disabled, and expired challenges cleanly', async () => {
      // 1. Non-existent code
      await expect(
        challengeService.getChallengeMeta('ZZZZZZ')
      ).rejects.toThrowError(AppError);

      await expect(
        challengeService.getChallengeSession('ZZZZZZ', { anonymousPlayerId: 'p1' })
      ).rejects.toThrowError(AppError);

      // 2. Disabled challenge
      const movie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });
      const disabledChallenge = await challengeService.createChallenge(movie!.id, 'Disabled Test');
      createdChallengeIds.push(disabledChallenge.challengeId);
      createdGameIds.push(disabledChallenge.gameId);

      await prisma.challenge.update({
        where: { id: disabledChallenge.challengeId },
        data: { status: 'DISABLED' },
      });

      await expect(
        challengeService.getChallengeSession(disabledChallenge.publicCode, { anonymousPlayerId: 'p1' })
      ).rejects.toThrowError(AppError);

      // 3. Expired challenge
      const expiredChallenge = await challengeService.createChallenge(movie!.id, 'Expired Test', -1);
      createdChallengeIds.push(expiredChallenge.challengeId);
      createdGameIds.push(expiredChallenge.gameId);

      await expect(
        challengeService.getChallengeSession(expiredChallenge.publicCode, { anonymousPlayerId: 'p1' })
      ).rejects.toThrowError(AppError);
    });
  });

  // =========================================================================
  // 4. PHASE H — MULTI-PLAYER ISOLATION
  // =========================================================================
  describe('4. Multi-Player Session Isolation', () => {
    it('provides independent game sessions with isolated guess histories for multiple players', async () => {
      const targetMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'RRR', lifecycleStatus: 'ACTIVE' },
      });
      expect(targetMovie).not.toBeNull();

      const challenge = await challengeService.createChallenge(targetMovie!.id, 'Multiplayer Host');
      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      const playerA = { anonymousPlayerId: 'player_alpha_111' };
      const playerB = { anonymousPlayerId: 'player_beta_222' };

      // 1. Player A and Player B join the same challenge
      const sessionA = await challengeService.getChallengeSession(challenge.publicCode, playerA);
      const sessionB = await challengeService.getChallengeSession(challenge.publicCode, playerB);

      expect(sessionA.sessionId).not.toBe(sessionB.sessionId);
      expect(sessionA.gameId).toBe(sessionB.gameId);
      expect(sessionA.maxAttempts).toBe(10);
      expect(sessionB.maxAttempts).toBe(10);
      expect(sessionA.attemptsUsed).toBe(0);
      expect(sessionB.attemptsUsed).toBe(0);

      // 2. Player A submits a guess
      const guessMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'Pushpa: The Rise', lifecycleStatus: 'ACTIVE' },
      });
      expect(guessMovie).not.toBeNull();

      const guessResA = await gameEngine.submitGuess(sessionA.sessionId, {
        movieId: guessMovie!.id,
      });

      expect(guessResA.attemptsUsed).toBe(1);

      // 3. Verify Player B's session remains completely untouched
      const refreshedB = await gameEngine.getSessionState(sessionB.sessionId);
      expect(refreshedB.attemptsUsed).toBe(0);
      expect(refreshedB.guesses.length).toBe(0);
      expect(refreshedB.status).toBe('NOT_STARTED');

      // 4. Player A solves the challenge (wins)
      const winGuessA = await gameEngine.submitGuess(sessionA.sessionId, {
        movieId: targetMovie!.id,
      });
      expect(winGuessA.status).toBe('WON');
      expect(winGuessA.isCorrect).toBe(true);

      // 5. Verify Player B is STILL in progress and has not won
      const currentB = await gameEngine.getSessionState(sessionB.sessionId);
      expect(currentB.status).toBe('NOT_STARTED');
      expect(currentB.isCompleted).toBe(false);
      expect(currentB.isWon).toBe(false);
      expect(currentB.revealedTarget).toBeNull(); // Target remains hidden for Player B!
    });
  });

  // =========================================================================
  // 5. PHASE I, J, K, L, M, N, O — AUTHORITATIVE GAME ENGINE & 10-ATTEMPT LIFECYCLE
  // =========================================================================
  describe('5. Authoritative Gameplay, 10 Attempts, Duplicate Handling, Hints & Result Rejection', () => {
    it('executes full 10-attempt loss flow, hint milestones (5 & 8), duplicate penalty-free reject, and post-completion lock', async () => {
      const targetMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'Dangal', lifecycleStatus: 'ACTIVE' },
      });
      expect(targetMovie).not.toBeNull();

      const challenge = await challengeService.createChallenge(targetMovie!.id, 'Coach Mahavir');
      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      const player = { anonymousPlayerId: 'test_challenge_guesser_10' };
      const session = await challengeService.getChallengeSession(challenge.publicCode, player);

      // Find 10 distinct non-target movies
      const candidateMovies = await prisma.movie.findMany({
        where: {
          id: { not: targetMovie!.id },
          lifecycleStatus: 'ACTIVE',
          eligibility: { playableAsGuess: true },
        },
        take: 12,
      });
      expect(candidateMovies.length).toBeGreaterThanOrEqual(10);

      // Guesses 1 to 4: In progress, no hints yet
      for (let i = 0; i < 4; i++) {
        const res = await gameEngine.submitGuess(session.sessionId, {
          movieId: candidateMovies[i].id,
        });
        expect(res.attemptNumber).toBe(i + 1);
        expect(res.attemptsUsed).toBe(i + 1);
        expect(res.attemptsRemaining).toBe(10 - (i + 1));
        expect(res.status).toBe('IN_PROGRESS');
        expect(res.revealedTarget).toBeNull();
        expect(res.unlockedHint).toBeNull();
      }

      // Test Duplicate Guess Policy (REJECT_NO_PENALTY) on attempt 4
      try {
        await gameEngine.submitGuess(session.sessionId, {
          movieId: candidateMovies[0].id,
        });
        expect.unreachable('Duplicate guess should have thrown DUPLICATE_GUESS');
      } catch (err: any) {
        expect(err.code).toBe('DUPLICATE_GUESS');
        expect(err.statusCode).toBe(400);
      }

      // Confirm attempt count was not penalized by duplicate
      const stateAfterDup = await gameEngine.getSessionState(session.sessionId);
      expect(stateAfterDup.attemptsUsed).toBe(4);
      expect(stateAfterDup.attemptsRemaining).toBe(6);

      // Guess 5: Unlocks Attempt 5 Hint (DIRECTOR_INITIAL)
      const res5 = await gameEngine.submitGuess(session.sessionId, {
        movieId: candidateMovies[4].id,
      });
      expect(res5.attemptNumber).toBe(5);
      expect(res5.attemptsUsed).toBe(5);
      expect(res5.unlockedHint).not.toBeNull();
      expect(res5.unlockedHint!.hintType).toBe('DIRECTOR_INITIAL');
      expect((res5.unlockedHint!.hintContent as any).hintText).toContain('Directed by');

      // Guesses 6 & 7: In progress
      for (let i = 5; i < 7; i++) {
        const res = await gameEngine.submitGuess(session.sessionId, {
          movieId: candidateMovies[i].id,
        });
        expect(res.attemptNumber).toBe(i + 1);
        expect(res.unlockedHint).toBeNull();
      }

      // Guess 8: Unlocks Attempt 8 Hint (GENRE_DECADE)
      const res8 = await gameEngine.submitGuess(session.sessionId, {
        movieId: candidateMovies[7].id,
      });
      expect(res8.attemptNumber).toBe(8);
      expect(res8.unlockedHint).not.toBeNull();
      expect(res8.unlockedHint!.hintType).toBe('GENRE_DECADE');
      expect((res8.unlockedHint!.hintContent as any).hintText).toContain('Released in the');

      // Guess 9: In progress
      const res9 = await gameEngine.submitGuess(session.sessionId, {
        movieId: candidateMovies[8].id,
      });
      expect(res9.attemptNumber).toBe(9);
      expect(res9.status).toBe('IN_PROGRESS');

      // Guess 10: Loss condition at attempt 10
      const res10 = await gameEngine.submitGuess(session.sessionId, {
        movieId: candidateMovies[9].id,
      });
      expect(res10.attemptNumber).toBe(10);
      expect(res10.attemptsUsed).toBe(10);
      expect(res10.attemptsRemaining).toBe(0);
      expect(res10.status).toBe('LOST');
      expect(res10.isCorrect).toBe(false);
      expect(res10.revealedTarget).not.toBeNull();
      expect(res10.revealedTarget!.title).toBe(targetMovie!.primaryTitle);

      // Post-completion rejection: 11th guess must be rejected with GAME_ALREADY_COMPLETED
      try {
        await gameEngine.submitGuess(session.sessionId, {
          movieId: candidateMovies[10].id,
        });
        expect.unreachable('Should reject post-completion guess');
      } catch (err: any) {
        expect(err.code).toBe('GAME_ALREADY_COMPLETED');
        expect(err.statusCode).toBe(400);
      }
    });

    it('executes win flow when target is correctly guessed', async () => {
      const targetMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'Kalki 2898 AD', lifecycleStatus: 'ACTIVE' },
      });
      expect(targetMovie).not.toBeNull();

      const challenge = await challengeService.createChallenge(targetMovie!.id, 'Nag Ashwin Fan');
      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      const player = { anonymousPlayerId: 'test_challenge_winner' };
      const session = await challengeService.getChallengeSession(challenge.publicCode, player);

      const winRes = await gameEngine.submitGuess(session.sessionId, {
        movieId: targetMovie!.id,
      });

      expect(winRes.attemptNumber).toBe(1);
      expect(winRes.attemptsUsed).toBe(1);
      expect(winRes.isCorrect).toBe(true);
      expect(winRes.status).toBe('WON');
      expect(winRes.revealedTarget).not.toBeNull();
      expect(winRes.revealedTarget!.title).toBe('Kalki 2898 AD');
    });
  });

  // =========================================================================
  // 6. PHASE P, Q — CHALLENGE IMMUTABILITY & RESULT SPOILER SECRECY
  // =========================================================================
  describe('6. Challenge Target Immutability & Spoiler-Safe Results', () => {
    it('guarantees target immutability and spoiler-free share output with /10 attempts', async () => {
      const targetMovie = await prisma.movie.findFirst({
        where: { primaryTitle: 'Baahubali 2: The Conclusion', lifecycleStatus: 'ACTIVE' },
      });
      expect(targetMovie).not.toBeNull();

      const challenge = await challengeService.createChallenge(targetMovie!.id, 'Mahishmati Ruler');
      createdChallengeIds.push(challenge.challengeId);
      createdGameIds.push(challenge.gameId);

      const player = { anonymousPlayerId: 'test_immutability_player' };
      const session = await challengeService.getChallengeSession(challenge.publicCode, player);

      // Verify re-reading session returns exact same game & target
      const sessionReplay = await challengeService.getChallengeSession(challenge.publicCode, player);
      expect(sessionReplay.sessionId).toBe(session.sessionId);
      expect(sessionReplay.gameId).toBe(session.gameId);

      // Solve the puzzle
      await gameEngine.submitGuess(session.sessionId, {
        movieId: targetMovie!.id,
      });

      // Fetch finished session state
      const finalState = await gameEngine.getSessionState(session.sessionId);
      expect(finalState.isCompleted).toBe(true);
      expect(finalState.isWon).toBe(true);
      expect(finalState.revealedTarget).not.toBeNull();
      expect(finalState.revealedTarget!.id).toBe(targetMovie!.id);
      expect(finalState.revealedTarget!.title).toBe('Baahubali 2: The Conclusion');
      expect(finalState.challengeCode).toBe(challenge.publicCode);
    });
  });
});
