import { prisma } from '@/infrastructure/db/client';
import { queueService } from '@/infrastructure/queue/queue-service';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { movieRepository } from '@/modules/movies/movie-repository';
import { getIndianCalendarDate } from '@/lib/date-utils';
import { AppError } from '@/domain/errors';
import { catalogReviewService, ReviewQueueFilterOptions } from './catalog-review-service';

export class AdminService {
  async logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    before?: any,
    after?: any,
    reason?: string,
    actorRole = 'SUPER_ADMIN'
  ) {
    return catalogReviewService.logAudit({
      actorId,
      action,
      entityType,
      entityId,
      before,
      after,
      reason,
      actorRole,
    });
  }

  async getReviewQueue(optionsOrLimit: number | ReviewQueueFilterOptions = 50) {
    if (typeof optionsOrLimit === 'number') {
      const candidates = await prisma.ingestionCandidate.findMany({
        where: {
          status: { in: ['DISCOVERED', 'PROCESSING', 'FAILED', 'DUPLICATE'] },
        },
        orderBy: { discoveredAt: 'desc' },
        take: optionsOrLimit,
      });

      const paginatedResult = await catalogReviewService.getReviewQueue({
        limit: optionsOrLimit,
      });

      return {
        candidates,
        pendingEligibility: paginatedResult.items,
        total: paginatedResult.total,
        page: paginatedResult.page,
        limit: paginatedResult.limit,
        totalPages: paginatedResult.totalPages,
      };
    }

    const paginatedResult = await catalogReviewService.getReviewQueue(optionsOrLimit);
    const candidates = await prisma.ingestionCandidate.findMany({
      where: {
        status: { in: ['DISCOVERED', 'PROCESSING', 'FAILED', 'DUPLICATE'] },
      },
      orderBy: { discoveredAt: 'desc' },
      take: optionsOrLimit.limit || 20,
    });

    return {
      candidates,
      pendingEligibility: paginatedResult.items,
      total: paginatedResult.total,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      totalPages: paginatedResult.totalPages,
    };
  }

  async getReviewDetail(movieId: string) {
    return catalogReviewService.getReviewDetail(movieId);
  }

  async getReviewStats() {
    return catalogReviewService.getReviewStats();
  }

  async approveMovie(movieId: string, actorId = 'admin', reason?: string) {
    return catalogReviewService.approveMovie(movieId, actorId, reason);
  }

  async rejectMovie(movieId: string, reason?: string, actorId = 'admin') {
    return catalogReviewService.rejectMovie(movieId, reason, actorId);
  }

  async returnMovieToReview(movieId: string, reason?: string, actorId = 'admin') {
    return catalogReviewService.returnMovieToReview(movieId, reason, actorId);
  }

  async enrichSingleMovie(movieId: string, optionsOrActorId?: string | { dryRun?: boolean; actorId?: string }) {
    return catalogReviewService.enrichSingleMovie(movieId, optionsOrActorId);
  }

  async resolveTmdbIdentity(movieId: string, options?: { dryRun?: boolean; actorId?: string }) {
    return catalogReviewService.resolveTmdbIdentity(movieId, options);
  }

  async scanArtifacts(options?: { dryRun?: boolean; limit?: number; actorId?: string }) {
    return catalogReviewService.scanArtifacts(options);
  }

  async scanDuplicates(options?: { dryRun?: boolean; limit?: number; actorId?: string }) {
    return catalogReviewService.scanDuplicates(options);
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
    return catalogReviewService.mergeDuplicateMovie(primaryMovieId, duplicateMovieId, actorId, reason);
  }

  async getScheduledPuzzles(limit = 14) {
    const todayStr = getIndianCalendarDate(new Date());
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
    const totalMovies = await prisma.movie.count();
    const activeMovies = await prisma.movie.count({ where: { lifecycleStatus: 'ACTIVE' } });
    
    const playableGuesses = await prisma.movie.count({
      where: {
        lifecycleStatus: 'ACTIVE',
        eligibility: { playableAsGuess: true },
      },
    });

    const playableTargets = await prisma.movie.count({
      where: {
        lifecycleStatus: 'ACTIVE',
        eligibility: { playableAsTarget: true },
      },
    });

    const playableBoth = await prisma.movie.count({
      where: {
        lifecycleStatus: 'ACTIVE',
        eligibility: {
          playableAsGuess: true,
          playableAsTarget: true,
        },
      },
    });

    const blockedGuesses = await prisma.movie.count({
      where: {
        OR: [
          { lifecycleStatus: { not: 'ACTIVE' } },
          { eligibility: { playableAsGuess: false } },
        ],
      },
    });

    const blockedTargets = await prisma.movie.count({
      where: {
        OR: [
          { lifecycleStatus: { not: 'ACTIVE' } },
          { eligibility: { playableAsTarget: false } },
        ],
      },
    });

    const needsReview = await prisma.gameEligibility.count({
      where: { reviewStatus: 'PENDING' },
    });

    const approvedCount = await prisma.gameEligibility.count({
      where: { reviewStatus: 'APPROVED' },
    });

    const rejectedCount = await prisma.gameEligibility.count({
      where: { reviewStatus: 'REJECTED' },
    });

    const disabledCount = await prisma.movie.count({
      where: { lifecycleStatus: 'DISABLED' },
    });

    const gamesPlayed = await prisma.gameSession.count();
    const gamesWon = await prisma.gameSession.count({ where: { status: 'WON' } });
    const queueStats = queueService.getQueueStats();
    const candidateCount = await prisma.ingestionCandidate.count();

    const upcomingPuzzlesCount = await prisma.dailyPuzzle.count({
      where: {
        puzzleDate: { gte: getIndianCalendarDate(new Date()) },
      },
    });

    const tmdbEnrichedCount = await prisma.movie.count({
      where: { tmdbId: { not: null } },
    });
    const wikidataEnrichedCount = await prisma.movie.count({
      where: { wikidataId: { not: null } },
    });
    const bothEnrichedCount = await prisma.movie.count({
      where: { tmdbId: { not: null }, wikidataId: { not: null } },
    });

    return {
      totalMovies,
      activeMovies,
      playableGuesses,
      playableTargets,
      playableBoth,
      blockedGuesses,
      blockedTargets,
      needsReview,
      approvedCount,
      rejectedCount,
      disabledCount,
      tmdbEnrichedCount,
      wikidataEnrichedCount,
      bothEnrichedCount,
      coverageStatus: 'PARTIAL (Baseline 2002–2026 Ingested)',
      gamesPlayed,
      gamesWon,
      winRate: gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) + '%' : '0%',
      queueStats,
      candidateCount,
      upcomingPuzzlesCount,
      puzzleSafetyStatus: upcomingPuzzlesCount >= 3 ? 'HEALTHY' : 'WARNING',
    };
  }
}

export const adminService = new AdminService();
