import { prisma } from '@/infrastructure/db/client';
import { queueService } from '@/infrastructure/queue/queue-service';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { movieRepository } from '@/modules/movies/movie-repository';
import { AppError } from '@/domain/errors';

export class AdminService {
  async logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    before?: any,
    after?: any,
    reason?: string
  ) {
    return prisma.auditLog.create({
      data: {
        actorId,
        actorRole: 'SUPER_ADMIN',
        action,
        entityType,
        entityId,
        before,
        after,
        reason,
      },
    });
  }

  async getReviewQueue(limit = 50) {
    const candidates = await prisma.ingestionCandidate.findMany({
      where: {
        status: { in: ['DISCOVERED', 'PROCESSING', 'FAILED'] },
      },
      orderBy: { discoveredAt: 'desc' },
      take: limit,
    });

    const pendingEligibility = await prisma.gameEligibility.findMany({
      where: {
        reviewStatus: 'PENDING',
      },
      include: {
        movie: {
          select: {
            id: true,
            primaryTitle: true,
            releaseYear: true,
            supportedLanguages: true,
            posterAsset: true,
            rating: true,
          },
        },
      },
      take: limit,
    });

    return {
      candidates,
      pendingEligibility,
    };
  }

  async approveCandidate(candidateId: string, actorId = 'admin') {
    const res = await ingestionService.processCandidate(candidateId);
    await this.logAudit(actorId, 'APPROVE_CANDIDATE', 'IngestionCandidate', candidateId, null, res);
    return res;
  }

  async rejectCandidate(candidateId: string, reason: string, actorId = 'admin') {
    const candidate = await prisma.ingestionCandidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED', error: reason },
    });
    await this.logAudit(actorId, 'REJECT_CANDIDATE', 'IngestionCandidate', candidateId, null, candidate, reason);
    return candidate;
  }

  async updateMovieEligibility(
    movieId: string,
    data: { playableAsGuess?: boolean; playableAsTarget?: boolean; disabledReason?: string },
    actorId = 'admin'
  ) {
    const before = await prisma.gameEligibility.findUnique({ where: { movieId } });
    const after = await prisma.gameEligibility.upsert({
      where: { movieId },
      create: {
        movieId,
        playableAsGuess: data.playableAsGuess ?? true,
        playableAsTarget: data.playableAsTarget ?? true,
        disabledReason: data.disabledReason,
        updatedAt: new Date(),
      },
      update: {
        playableAsGuess: data.playableAsGuess,
        playableAsTarget: data.playableAsTarget,
        disabledReason: data.disabledReason,
        updatedAt: new Date(),
      },
    });

    await this.logAudit(actorId, 'UPDATE_ELIGIBILITY', 'Movie', movieId, before, after);
    return after;
  }

  async mergeMovies(
    primaryMovieId: string,
    duplicateMovieId: string,
    actorId = 'admin',
    reason = 'Duplicate entry merge'
  ) {
    const primary = await prisma.movie.findUnique({ where: { id: primaryMovieId } });
    const duplicate = await prisma.movie.findUnique({ where: { id: duplicateMovieId } });

    if (!primary || !duplicate) {
      throw new AppError('MOVIE_NOT_FOUND', 'One or both movies not found for merge.', 404);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Re-link Guesses
      await tx.gameGuess.updateMany({
        where: { movieId: duplicateMovieId },
        data: { movieId: primaryMovieId },
      });

      // 2. Mark duplicate as MERGED / DISABLED
      await tx.movie.update({
        where: { id: duplicateMovieId },
        data: { lifecycleStatus: 'MERGED' },
      });

      await tx.gameEligibility.update({
        where: { movieId: duplicateMovieId },
        data: {
          playableAsGuess: false,
          playableAsTarget: false,
          disabledReason: `Merged into ${primary.primaryTitle} (${primaryMovieId})`,
        },
      });

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          actorId,
          actorRole: 'SUPER_ADMIN',
          action: 'MERGE_MOVIES',
          entityType: 'Movie',
          entityId: primaryMovieId,
          before: { duplicateMovieId, title: duplicate.primaryTitle },
          after: { primaryMovieId, title: primary.primaryTitle },
          reason,
        },
      });

      return { success: true, primaryMovieId, duplicateMovieId };
    });
  }

  async getScheduledPuzzles(limit = 14) {
    const todayStr = new Date().toISOString().split('T')[0];
    return prisma.dailyPuzzle.findMany({
      where: {
        puzzleDate: { gte: todayStr },
      },
      include: {
        targetMovie: {
          select: {
            id: true,
            primaryTitle: true,
            releaseYear: true,
            supportedLanguages: true,
            posterAsset: true,
          },
        },
      },
      orderBy: { puzzleDate: 'asc' },
      take: limit,
    });
  }

  async getSystemOverview() {
    const movieCount = await prisma.movie.count({ where: { lifecycleStatus: 'ACTIVE' } });
    const gamesPlayed = await prisma.gameSession.count();
    const gamesWon = await prisma.gameSession.count({ where: { status: 'WON' } });
    const queueStats = queueService.getQueueStats();
    const candidateCount = await prisma.ingestionCandidate.count();
    const pendingReviewCount = await prisma.gameEligibility.count({
      where: { reviewStatus: 'PENDING' },
    });

    const upcomingPuzzlesCount = await prisma.dailyPuzzle.count({
      where: {
        puzzleDate: { gte: new Date().toISOString().split('T')[0] },
      },
    });

    return {
      movieCount,
      gamesPlayed,
      gamesWon,
      winRate: gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) + '%' : '0%',
      queueStats,
      candidateCount,
      pendingReviewCount,
      upcomingPuzzlesCount,
      puzzleSafetyStatus: upcomingPuzzlesCount >= 3 ? 'HEALTHY' : 'WARNING',
    };
  }
}

export const adminService = new AdminService();
