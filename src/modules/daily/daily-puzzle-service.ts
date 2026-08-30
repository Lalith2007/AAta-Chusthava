import { prisma } from '@/infrastructure/db/client';
import { movieRepository } from '@/modules/movies/movie-repository';
import { gameRepository } from '@/modules/games/game-repository';
import { gameEngine } from '@/modules/games/game-engine';
import { AppError } from '@/domain/errors';
import { ClientSessionState } from '@/domain/game/types';

export class DailyPuzzleService {
  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  async getOrCreatePuzzleForDate(dateStr?: string): Promise<string> {
    const puzzleDate = dateStr || this.formatDate(new Date());

    let dailyPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate },
      include: { game: true },
    });

    if (!dailyPuzzle) {
      // Pick a random target-eligible movie
      const targetMovie = await movieRepository.findRandomTargetEligible();
      if (!targetMovie) {
        throw new AppError(
          'INTERNAL_ERROR',
          'No target-eligible movies available in database to create daily puzzle.',
          500
        );
      }

      const defaultRuleset = await gameRepository.getOrCreateDefaultRuleset();

      // Create Game
      const game = await gameRepository.createGame({
        mode: 'DAILY',
        targetMovieId: targetMovie.id,
        rulesetId: defaultRuleset.id,
        maxAttempts: defaultRuleset.maxAttempts,
      });

      // Create DailyPuzzle
      dailyPuzzle = await prisma.dailyPuzzle.create({
        data: {
          puzzleDate,
          gameId: game.id,
          targetMovieId: targetMovie.id,
          rulesetId: defaultRuleset.id,
          selectionMethod: 'RANDOM',
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
        include: { game: true },
      });
    }

    return dailyPuzzle.gameId;
  }

  async getDailySession(
    dateStr?: string,
    playerIdentifier?: { anonymousPlayerId?: string; playerId?: string }
  ): Promise<ClientSessionState> {
    const gameId = await this.getOrCreatePuzzleForDate(dateStr);
    const session = await gameRepository.getOrCreateSession(gameId, playerIdentifier);
    return gameEngine.getSessionState(session.id);
  }

  async ensureUpcomingPuzzlesScheduled(daysAhead = 7): Promise<number> {
    let scheduledCount = 0;
    const today = new Date();

    for (let i = 0; i <= daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = this.formatDate(targetDate);

      const existing = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: dateStr },
      });

      if (!existing) {
        await this.getOrCreatePuzzleForDate(dateStr);
        scheduledCount++;
      }
    }

    return scheduledCount;
  }

  async getArchivePuzzles(limit = 30) {
    const puzzles = await prisma.dailyPuzzle.findMany({
      where: {
        status: { in: ['ACTIVE', 'ARCHIVED'] },
      },
      include: {
        targetMovie: {
          select: {
            id: true,
            primaryTitle: true,
            releaseYear: true,
            posterAsset: true,
            supportedLanguages: true,
          },
        },
        game: {
          include: {
            sessions: true,
          },
        },
      },
      orderBy: { puzzleDate: 'desc' },
      take: limit,
    });

    return puzzles.map((p) => ({
      id: p.id,
      puzzleDate: p.puzzleDate,
      gameId: p.gameId,
      status: p.status,
      totalPlays: p.game.sessions.length,
    }));
  }
}

export const dailyPuzzleService = new DailyPuzzleService();
