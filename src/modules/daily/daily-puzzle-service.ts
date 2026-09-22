import { prisma } from '@/infrastructure/db/client';
import { movieRepository } from '@/modules/movies/movie-repository';
import { gameRepository } from '@/modules/games/game-repository';
import { gameEngine } from '@/modules/games/game-engine';
import { AppError } from '@/domain/errors';
import { ClientSessionState } from '@/domain/game/types';
import {
  getIndianCalendarDate,
  isValidPuzzleDate,
  addDaysToPuzzleDate,
} from '@/lib/date-utils';
import { dailyPuzzleSelector } from './daily-puzzle-selector';
import {
  DailyPuzzlePreview,
  DailyPuzzleOverrideRequest,
  SelectionMetadata,
} from './types';

export class DailyPuzzleService {
  /**
   * Resolves or formats an authoritative IST puzzle date (YYYY-MM-DD).
   */
  public resolvePuzzleDate(dateStr?: string): string {
    if (dateStr) {
      if (!isValidPuzzleDate(dateStr)) {
        throw new AppError('VALIDATION_ERROR', `Invalid puzzle date format: ${dateStr}. Expected YYYY-MM-DD.`, 400);
      }
      return dateStr;
    }
    return getIndianCalendarDate(new Date());
  }

  /**
   * Fetches an existing DailyPuzzle or deterministically selects, creates, and persists one.
   * Concurrency-safe against race conditions on unique puzzleDate.
   */
  async getOrCreatePuzzleForDate(dateStr?: string): Promise<string> {
    const puzzleDate = this.resolvePuzzleDate(dateStr);

    let dailyPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate },
      include: { game: true },
    });

    if (!dailyPuzzle) {
      // Deterministically select the target movie using the selection engine
      const { selectedMovieId, metadata } = await dailyPuzzleSelector.selectDailyTarget(puzzleDate);

      const targetMovie = await movieRepository.findById(selectedMovieId);
      if (!targetMovie) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Selected target movie ${selectedMovieId} could not be resolved from database.`,
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

      try {
        // Create DailyPuzzle
        dailyPuzzle = await prisma.dailyPuzzle.create({
          data: {
            puzzleDate,
            gameId: game.id,
            targetMovieId: targetMovie.id,
            rulesetId: defaultRuleset.id,
            selectionMethod: 'WEIGHTED_RANDOM',
            selectionMetadata: metadata as unknown as any,
            algorithmVersion: 'DAILY_SELECTION_V1',
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
          include: { game: true },
        });
      } catch (createErr: unknown) {
        // Concurrency race fallback: another request already created the puzzle
        try {
          await prisma.game.delete({ where: { id: game.id } });
        } catch {
          // Ignore deletion error if already removed
        }
        const existing = await prisma.dailyPuzzle.findUnique({
          where: { puzzleDate },
          include: { game: true },
        });
        if (existing) {
          return existing.gameId;
        }
        throw createErr;
      }
    }

    return dailyPuzzle.gameId;
  }

  /**
   * Returns client session state for playing the daily game.
   * Guarantees strict target secrecy (target details remain hidden until win/loss).
   */
  async getDailySession(
    dateStr?: string,
    playerIdentifier?: { anonymousPlayerId?: string; playerId?: string }
  ): Promise<ClientSessionState> {
    const gameId = await this.getOrCreatePuzzleForDate(dateStr);
    const session = await gameRepository.getOrCreateSession(gameId, playerIdentifier);
    return gameEngine.getSessionState(session.id);
  }

  /**
   * Resolves an existing, persisted historical Daily Puzzle strictly for Archive replay.
   * MUST NEVER create a puzzle, invoke DAILY_SELECTION_V1, or mutate the database.
   */
  async getExistingHistoricalPuzzleForDate(dateStr: string): Promise<string> {
    if (!dateStr || !isValidPuzzleDate(dateStr)) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Invalid historical puzzle date format: ${dateStr}. Expected YYYY-MM-DD.`,
        400
      );
    }

    const todayIST = getIndianCalendarDate(new Date());

    // Historical dates must be strictly before today's IST date
    if (dateStr >= todayIST) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Date ${dateStr} is not a past historical date. Daily archive only permits dates prior to today (${todayIST}).`,
        400
      );
    }

    const dailyPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate: dateStr },
      include: { game: true },
    });

    if (!dailyPuzzle) {
      throw new AppError(
        'ARCHIVE_NOT_FOUND',
        `No historical daily puzzle exists for date ${dateStr}.`,
        404
      );
    }

    if (dailyPuzzle.status === 'CANDIDATE') {
      throw new AppError(
        'ARCHIVE_NOT_FOUND',
        `Puzzle for ${dateStr} is not an active or archived historical puzzle.`,
        404
      );
    }

    return dailyPuzzle.gameId;
  }

  /**
   * Returns client session state for playing a historical Daily puzzle from the archive.
   * Uses strictly existing historical DailyPuzzle records without dynamic selection.
   */
  async getArchiveSession(
    dateStr: string,
    playerIdentifier?: { anonymousPlayerId?: string; playerId?: string }
  ): Promise<ClientSessionState> {
    const gameId = await this.getExistingHistoricalPuzzleForDate(dateStr);
    const session = await gameRepository.getOrCreateSession(gameId, playerIdentifier);
    return gameEngine.getSessionState(session.id);
  }

  /**
   * Previews the deterministic target movie and selection metadata for a date (Admin/Internal).
   */
  async previewDailyTarget(dateStr?: string): Promise<DailyPuzzlePreview> {
    const puzzleDate = this.resolvePuzzleDate(dateStr);

    const existing = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate },
      include: {
        targetMovie: true,
      },
    });

    if (existing) {
      const movie = existing.targetMovie;
      const metadata = (existing.selectionMetadata as unknown as SelectionMetadata) || {
        algorithmVersion: 'DAILY_SELECTION_V1',
        puzzleDate,
        selectedMovieId: movie.id,
        selectedTitle: movie.primaryTitle,
        language: movie.supportedLanguages.length > 1 ? 'MULTILINGUAL' : (movie.supportedLanguages[0] as any) || 'TELUGU',
        preferredLanguage: (movie.supportedLanguages[0] as any) || 'TELUGU',
        qualityTier: 'TIER_1_RICH',
        qualityScore: 100,
        availableCluesCount: 7,
        deterministicPriority: 100,
        jitter: 0.5,
        fallbackLevel: 'LEVEL_1_STANDARD',
        recentTeluguCount: 0,
        recentHindiCount: 0,
        cooldownDays: 60,
        cooldownExcludedCount: 0,
        candidatePoolSize: 1,
        evaluatedCandidatesCount: 1,
        selectionDurationMs: 0,
        isOverridden: existing.selectionMethod === 'ADMIN_SELECTED',
      };

      return {
        puzzleDate,
        movie: {
          id: movie.id,
          primaryTitle: movie.primaryTitle,
          originalTitle: movie.originalTitle,
          releaseYear: movie.releaseYear,
          supportedLanguages: movie.supportedLanguages,
          posterAsset: movie.posterAsset,
        },
        selectionMethod: existing.selectionMethod as any,
        selectionMetadata: metadata,
        isAlreadyPersisted: true,
        existingGameId: existing.gameId,
      };
    }

    // Evaluate preview on the fly without persisting
    const { selectedMovieId, metadata } = await dailyPuzzleSelector.selectDailyTarget(puzzleDate);
    const movie = await prisma.movie.findUnique({
      where: { id: selectedMovieId },
    });

    if (!movie) {
      throw new AppError('INTERNAL_ERROR', 'Target candidate could not be resolved.', 500);
    }

    return {
      puzzleDate,
      movie: {
        id: movie.id,
        primaryTitle: movie.primaryTitle,
        originalTitle: movie.originalTitle,
        releaseYear: movie.releaseYear,
        supportedLanguages: movie.supportedLanguages,
        posterAsset: movie.posterAsset,
      },
      selectionMethod: 'WEIGHTED_RANDOM',
      selectionMetadata: metadata,
      isAlreadyPersisted: false,
    };
  }

  /**
   * Manually overrides the target movie for a specific Daily Puzzle date (Admin action).
   */
  async overrideDailyTarget(req: DailyPuzzleOverrideRequest): Promise<DailyPuzzlePreview> {
    const puzzleDate = this.resolvePuzzleDate(req.puzzleDate);

    // 1. Verify target movie
    const movie = await prisma.movie.findUnique({
      where: { id: req.movieId },
      include: {
        eligibility: true,
        people: { include: { person: true } },
        productionHouses: { include: { productionHouse: true } },
        genres: { include: { genre: true } },
      },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${req.movieId} does not exist.`, 404);
    }

    if (movie.lifecycleStatus !== 'ACTIVE') {
      throw new AppError(
        'VALIDATION_ERROR',
        `Movie "${movie.primaryTitle}" is ${movie.lifecycleStatus} and cannot be selected as target.`,
        400
      );
    }

    if (!movie.eligibility?.playableAsTarget) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Movie "${movie.primaryTitle}" is not eligible as a target (minimum metadata incomplete).`,
        400
      );
    }

    const profile = dailyPuzzleSelector.computeTargetQualityProfile(movie);
    const defaultRuleset = await gameRepository.getOrCreateDefaultRuleset();

    const overrideMetadata: SelectionMetadata = {
      algorithmVersion: 'DAILY_SELECTION_V1',
      puzzleDate,
      selectedMovieId: movie.id,
      selectedTitle: movie.primaryTitle,
      language:
        movie.supportedLanguages.length > 1
          ? 'MULTILINGUAL'
          : (movie.supportedLanguages[0] as any) || 'TELUGU',
      preferredLanguage: (movie.supportedLanguages[0] as any) || 'TELUGU',
      qualityTier: profile.qualityTier,
      qualityScore: profile.qualityScore,
      availableCluesCount: profile.availableCluesCount,
      deterministicPriority: 999,
      jitter: 0,
      fallbackLevel: 'LEVEL_1_STANDARD',
      fallbackReason: `Admin override: ${req.overrideReason}`,
      recentTeluguCount: 0,
      recentHindiCount: 0,
      cooldownDays: 60,
      cooldownExcludedCount: 0,
      candidatePoolSize: 1,
      evaluatedCandidatesCount: 1,
      selectionDurationMs: 0,
      isOverridden: true,
      overriddenBy: req.adminId || 'admin',
      overrideReason: req.overrideReason,
    };

    const existing = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate },
      include: { game: true },
    });

    if (existing) {
      // Update existing DailyPuzzle and its Game
      await prisma.game.update({
        where: { id: existing.gameId },
        data: { targetMovieId: movie.id },
      });

      await prisma.dailyPuzzle.update({
        where: { id: existing.id },
        data: {
          targetMovieId: movie.id,
          selectionMethod: 'ADMIN_SELECTED',
          selectionMetadata: overrideMetadata as unknown as any,
          algorithmVersion: 'DAILY_SELECTION_V1',
        },
      });

      return {
        puzzleDate,
        movie: {
          id: movie.id,
          primaryTitle: movie.primaryTitle,
          originalTitle: movie.originalTitle,
          releaseYear: movie.releaseYear,
          supportedLanguages: movie.supportedLanguages,
          posterAsset: movie.posterAsset,
        },
        selectionMethod: 'ADMIN_SELECTED',
        selectionMetadata: overrideMetadata,
        isAlreadyPersisted: true,
        existingGameId: existing.gameId,
      };
    }

    // Create new Game and DailyPuzzle
    const game = await gameRepository.createGame({
      mode: 'DAILY',
      targetMovieId: movie.id,
      rulesetId: defaultRuleset.id,
      maxAttempts: defaultRuleset.maxAttempts,
    });

    const newPuzzle = await prisma.dailyPuzzle.create({
      data: {
        puzzleDate,
        gameId: game.id,
        targetMovieId: movie.id,
        rulesetId: defaultRuleset.id,
        selectionMethod: 'ADMIN_SELECTED',
        selectionMetadata: overrideMetadata as unknown as any,
        algorithmVersion: 'DAILY_SELECTION_V1',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    return {
      puzzleDate,
      movie: {
        id: movie.id,
        primaryTitle: movie.primaryTitle,
        originalTitle: movie.originalTitle,
        releaseYear: movie.releaseYear,
        supportedLanguages: movie.supportedLanguages,
        posterAsset: movie.posterAsset,
      },
      selectionMethod: 'ADMIN_SELECTED',
      selectionMetadata: overrideMetadata,
      isAlreadyPersisted: true,
      existingGameId: newPuzzle.gameId,
    };
  }

  /**
   * Idempotently schedules upcoming daily puzzles for N days ahead from today (or fromDate).
   */
  async ensureUpcomingPuzzlesScheduled(daysAhead = 7, fromDate?: string): Promise<number> {
    let scheduledCount = 0;
    const startIST = fromDate ? this.resolvePuzzleDate(fromDate) : getIndianCalendarDate(new Date());

    for (let i = 0; i < daysAhead; i++) {
      const dateStr = addDaysToPuzzleDate(startIST, i);

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

  /**
   * Returns list of scheduled and historical Daily Puzzles with admin metadata.
   */
  async getScheduledPuzzles(limit = 60) {
    const puzzles = await prisma.dailyPuzzle.findMany({
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
        game: {
          include: {
            sessions: true,
          },
        },
      },
      orderBy: { puzzleDate: 'desc' },
      take: limit,
    });

    return puzzles.map((p) => {
      const meta = p.selectionMetadata as unknown as SelectionMetadata | null;
      return {
        id: p.id,
        puzzleDate: p.puzzleDate,
        gameId: p.gameId,
        status: p.status,
        selectionMethod: p.selectionMethod,
        algorithmVersion: p.algorithmVersion || 'DAILY_SELECTION_V1',
        movie: {
          id: p.targetMovie.id,
          primaryTitle: p.targetMovie.primaryTitle,
          releaseYear: p.targetMovie.releaseYear,
          supportedLanguages: p.targetMovie.supportedLanguages,
          posterAsset: p.targetMovie.posterAsset,
        },
        qualityTier: meta?.qualityTier || 'TIER_1_RICH',
        qualityScore: meta?.qualityScore || 50,
        fallbackLevel: meta?.fallbackLevel || 'LEVEL_1_STANDARD',
        isOverridden: p.selectionMethod === 'ADMIN_SELECTED',
        totalPlays: p.game.sessions.length,
        createdAt: p.createdAt,
      };
    });
  }

  /**
   * Returns historical archive puzzles for public listing.
   * Only includes puzzles from strictly past calendar dates (prior to today IST).
   */
  async getArchivePuzzles(limit = 60) {
    const todayIST = getIndianCalendarDate(new Date());

    const puzzles = await prisma.dailyPuzzle.findMany({
      where: {
        puzzleDate: { lt: todayIST },
        status: { in: ['ACTIVE', 'ARCHIVED'] },
      },
      include: {
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
