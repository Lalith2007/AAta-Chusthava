import { prisma } from '@/infrastructure/db/client';
import { movieRepository } from '@/modules/movies/movie-repository';
import { gameRepository } from '@/modules/games/game-repository';
import { gameEngine } from '@/modules/games/game-engine';
import { AppError } from '@/domain/errors';
import { ClientSessionState } from '@/domain/game/types';
import { customAlphabet } from 'nanoid';

// Alphanumeric non-confusing characters for human-friendly short codes
const generatePublicCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

export interface CreateChallengeResponse {
  challengeId: string;
  gameId: string;
  publicCode: string;
  shareUrl: string;
  targetMovieTitle: string; // The creator deliberately knows which movie they selected
  expiresAt: string | null;
}

export class ChallengeService {
  async createChallenge(
    movieId: string,
    creatorName?: string,
    expiresInDays = 30
  ): Promise<CreateChallengeResponse> {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', 'Target movie not found.', 404);
    }

    if (movie.lifecycleStatus !== 'ACTIVE') {
      throw new AppError(
        'MOVIE_NOT_PLAYABLE',
        'This movie is not active in the catalog.',
        400
      );
    }

    if (!movie.playableAsTarget) {
      throw new AppError(
        'MOVIE_NOT_PLAYABLE',
        'This movie is not eligible as a challenge target.',
        400
      );
    }

    const defaultRuleset = await gameRepository.getOrCreateDefaultRuleset();

    // Create Game
    const game = await gameRepository.createGame({
      mode: 'CHALLENGE',
      targetMovieId: movie.id,
      rulesetId: defaultRuleset.id,
      maxAttempts: defaultRuleset.maxAttempts,
    });

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    let challenge: any = null;
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const publicCode = generatePublicCode();
      try {
        challenge = await prisma.challenge.create({
          data: {
            gameId: game.id,
            publicCode,
            targetMovieId: movie.id,
            creator: creatorName?.trim() || 'A Cinephile Friend',
            status: 'ACTIVE',
            expiresAt,
          },
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && attempt < maxRetries - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!challenge) {
      throw new AppError('INTERNAL_ERROR', 'Failed to generate unique challenge code.', 500);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      challengeId: challenge.id,
      gameId: game.id,
      publicCode: challenge.publicCode,
      shareUrl: `${baseUrl}/challenge/${challenge.publicCode}`,
      targetMovieTitle: `${movie.primaryTitle} (${movie.releaseYear})`,
      expiresAt: expiresAt?.toISOString() || null,
    };
  }

  async getChallengeSession(
    publicCode: string,
    playerIdentifier?: { anonymousPlayerId?: string; playerId?: string }
  ): Promise<ClientSessionState> {
    const cleanCode = (publicCode || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new AppError('VALIDATION_ERROR', 'Challenge code is required.', 400);
    }

    const challenge = await prisma.challenge.findUnique({
      where: { publicCode: cleanCode },
      include: { game: true },
    });

    if (!challenge) {
      throw new AppError('CHALLENGE_NOT_FOUND', 'Challenge puzzle not found.', 404);
    }

    if (challenge.status === 'DISABLED') {
      throw new AppError('CHALLENGE_DISABLED', 'This challenge has been disabled.', 400);
    }

    if (
      challenge.status === 'EXPIRED' ||
      (challenge.expiresAt && new Date() > challenge.expiresAt)
    ) {
      throw new AppError('CHALLENGE_EXPIRED', 'This challenge link has expired.', 400);
    }

    // Get or create session for this player on this challenge game
    const session = await gameRepository.getOrCreateSession(
      challenge.gameId,
      playerIdentifier
    );

    return gameEngine.getSessionState(session.id);
  }

  async getChallengeMeta(publicCode: string) {
    const cleanCode = (publicCode || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new AppError('VALIDATION_ERROR', 'Challenge code is required.', 400);
    }

    const challenge = await prisma.challenge.findUnique({
      where: { publicCode: cleanCode },
      include: {
        game: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!challenge) {
      throw new AppError('CHALLENGE_NOT_FOUND', 'Challenge puzzle not found.', 404);
    }

    return {
      publicCode: challenge.publicCode,
      creator: challenge.creator,
      status: challenge.status,
      expiresAt: challenge.expiresAt?.toISOString() || null,
      totalPlays: challenge.game.sessions.length,
      // Target is NEVER returned here!
    };
  }
}

export const challengeService = new ChallengeService();
