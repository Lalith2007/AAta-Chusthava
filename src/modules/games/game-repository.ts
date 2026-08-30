import { prisma } from '@/infrastructure/db/client';
import {
  Game,
  GameSession,
  GameGuess,
  GameRuleset,
  DailyPuzzle,
  Challenge,
  SessionHint,
  GameMode,
  SessionStatus,
} from '@prisma/client';
import { GameRulesetDomain } from '@/domain/game/types';

export class GameRepository {
  async getOrCreateDefaultRuleset(): Promise<GameRuleset> {
    let ruleset = await prisma.gameRuleset.findUnique({
      where: { name: 'DEFAULT_V1' },
    });

    if (!ruleset) {
      ruleset = await prisma.gameRuleset.create({
        data: {
          name: 'DEFAULT_V1',
          maxAttempts: 10,
          enabledClues: [
            'LANGUAGE',
            'DIRECTOR',
            'PRODUCTION_HOUSE',
            'RELEASE_YEAR',
            'BOX_OFFICE',
            'RATING',
            'LEAD_ACTOR',
            'LEAD_ACTRESS',
            'SUPPORTING_CAST',
            'MUSIC_DIRECTOR',
            'GENRES',
          ],
          clueConfiguration: {
            yearCloseThreshold: 3,
            ratingCloseThreshold: 0.5,
            boxOfficeCloseThresholdAbsolute: 1000000000, // 100 Cr
          },
          hintConfiguration: {
            firstHintUnlockAttempt: 5,
            secondHintUnlockAttempt: 8,
          },
          duplicateGuessPolicy: 'REJECT_NO_PENALTY',
          targetEligibilityPolicy: 'PLAYABLE_AS_TARGET',
        },
      });
    }

    return ruleset;
  }

  static toDomainRuleset(r: GameRuleset): GameRulesetDomain {
    const clueConfig = (r.clueConfiguration as any) || {};
    const hintConfig = (r.hintConfiguration as any) || {};

    return {
      id: r.id,
      name: r.name,
      maxAttempts: r.maxAttempts,
      clueConfig: {
        yearCloseThreshold: clueConfig.yearCloseThreshold ?? 3,
        ratingCloseThreshold: clueConfig.ratingCloseThreshold ?? 0.5,
        boxOfficeCloseThresholdAbsolute: clueConfig.boxOfficeCloseThresholdAbsolute ?? 1000000000,
        enabledClues: r.enabledClues as any,
      },
      hintConfig: {
        firstHintUnlockAttempt: hintConfig.firstHintUnlockAttempt ?? 5,
        secondHintUnlockAttempt: hintConfig.secondHintUnlockAttempt ?? 8,
      },
      duplicateGuessPolicy: r.duplicateGuessPolicy as any,
      targetEligibilityPolicy: r.targetEligibilityPolicy,
    };
  }

  async createGame(data: {
    mode: GameMode;
    targetMovieId: string;
    rulesetId: string;
    maxAttempts?: number;
  }): Promise<Game> {
    return prisma.game.create({
      data: {
        mode: data.mode,
        targetMovieId: data.targetMovieId,
        rulesetId: data.rulesetId,
        maxAttempts: data.maxAttempts ?? 10,
        status: 'ACTIVE',
      },
    });
  }

  async findGameById(id: string) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        ruleset: true,
        dailyPuzzle: true,
        challenge: true,
      },
    });
  }

  async getOrCreateSession(
    gameId: string,
    playerIdentifier?: { anonymousPlayerId?: string; playerId?: string }
  ): Promise<GameSession & { guesses: GameGuess[]; hintsUsed: SessionHint[] }> {
    const anonId = playerIdentifier?.anonymousPlayerId || 'anon_player_default';
    const pId = playerIdentifier?.playerId;

    let session = await prisma.gameSession.findFirst({
      where: {
        gameId,
        ...(pId ? { playerId: pId } : { anonymousPlayerId: anonId }),
      },
      include: {
        guesses: { orderBy: { attemptNumber: 'asc' } },
        hintsUsed: true,
      },
    });

    if (!session) {
      session = await prisma.gameSession.create({
        data: {
          gameId,
          anonymousPlayerId: pId ? null : anonId,
          playerId: pId || null,
          status: 'NOT_STARTED',
          attemptsUsed: 0,
        },
        include: {
          guesses: { orderBy: { attemptNumber: 'asc' } },
          hintsUsed: true,
        },
      });
    }

    return session;
  }

  async findSessionById(id: string) {
    return prisma.gameSession.findUnique({
      where: { id },
      include: {
        game: {
          include: {
            ruleset: true,
            dailyPuzzle: true,
            challenge: true,
          },
        },
        guesses: { orderBy: { attemptNumber: 'asc' } },
        hintsUsed: true,
      },
    });
  }

  async recordGuessTransaction(
    sessionId: string,
    data: {
      movieId: string;
      attemptNumber: number;
      evaluation: any;
      isCorrect: boolean;
      clientRequestId?: string;
      newSessionStatus: SessionStatus;
      completedAt?: Date;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // Create guess
      const guess = await tx.gameGuess.create({
        data: {
          sessionId,
          movieId: data.movieId,
          attemptNumber: data.attemptNumber,
          evaluation: data.evaluation,
          isCorrect: data.isCorrect,
          clientRequestId: data.clientRequestId,
        },
      });

      // Update session atomically
      const updatedSession = await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          attemptsUsed: data.attemptNumber,
          status: data.newSessionStatus,
          completedAt: data.completedAt,
        },
        include: {
          guesses: { orderBy: { attemptNumber: 'asc' } },
          hintsUsed: true,
        },
      });

      return { guess, session: updatedSession };
    });
  }

  async addHintToSession(sessionId: string, hintType: string, content: any): Promise<SessionHint> {
    return prisma.sessionHint.create({
      data: {
        sessionId,
        hintType,
        hintContent: content,
        unlockedAt: new Date(),
      },
    });
  }
}

export const gameRepository = new GameRepository();
