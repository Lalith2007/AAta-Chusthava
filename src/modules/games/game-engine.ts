import { AppError } from '@/domain/errors';
import { defaultClueEngine, ClueEngine } from '@/modules/clues/clue-engine';
import { movieRepository, MovieRepository } from '@/modules/movies/movie-repository';
import { gameRepository, GameRepository } from './game-repository';
import {
  ClientSessionState,
  SubmitGuessRequest,
  SubmitGuessResponse,
  RevealedTargetSummary,
  SessionGuessSummary,
  SessionHintSummary,
} from '@/domain/game/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class GameEngine {
  constructor(
    private movieRepo: MovieRepository = movieRepository,
    private gameRepo: GameRepository = gameRepository,
    private clueEng: ClueEngine = defaultClueEngine
  ) {}

  static formatRevealedTarget(movie: NormalizedMovie): RevealedTargetSummary {
    return {
      id: movie.id,
      title: movie.primaryTitle,
      originalTitle: movie.originalTitle,
      releaseYear: movie.releaseYear,
      languages: movie.supportedLanguages,
      industries: movie.industries,
      posterAsset: movie.posterAsset,
      backdropAsset: movie.backdropAsset,
      directors: movie.directors.map((d) => d.canonicalName),
      musicDirectors: movie.musicDirectors.map((m) => m.canonicalName),
      leadActors: movie.leadActors.map((a) => a.canonicalName),
      leadActresses: movie.leadActresses.map((a) => a.canonicalName),
      genres: movie.genres.map((g) => g.canonicalName),
      boxOfficeDisplay: movie.boxOffice
        ? `₹${(movie.boxOffice / 10000000).toFixed(1)} Cr`
        : undefined,
      ratingDisplay: movie.rating ? `${movie.rating.toFixed(1)} ★` : undefined,
    };
  }

  async submitGuess(
    sessionId: string,
    req: SubmitGuessRequest
  ): Promise<SubmitGuessResponse> {
    const session = await this.gameRepo.findSessionById(sessionId);
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Game session not found.', 404);
    }

    if (session.status === 'WON' || session.status === 'LOST' || session.status === 'EXPIRED') {
      throw new AppError('GAME_ALREADY_COMPLETED', 'This game session has already finished.', 400);
    }

    // Idempotency check: same clientRequestId returned immediately
    if (req.clientRequestId) {
      const existingReqGuess = session.guesses.find(
        (g) => g.clientRequestId === req.clientRequestId
      );
      if (existingReqGuess) {
        return {
          sessionId: session.id,
          attemptNumber: existingReqGuess.attemptNumber,
          isCorrect: existingReqGuess.isCorrect,
          status: session.status,
          attemptsUsed: session.attemptsUsed,
          attemptsRemaining: session.game.maxAttempts - session.attemptsUsed,
          evaluation: existingReqGuess.evaluation as any,
          revealedTarget: null,
        };
      }
    }

    // Check duplicate movie guess in this session
    const isDuplicate = session.guesses.some((g) => g.movieId === req.movieId);
    if (isDuplicate) {
      throw new AppError(
        'DUPLICATE_GUESS',
        'You have already guessed this movie. Please guess another movie.',
        400
      );
    }

    // Check attempt limit
    const attemptsUsed = session.attemptsUsed;
    const maxAttempts = session.game.maxAttempts;
    if (attemptsUsed >= maxAttempts) {
      throw new AppError(
        'ATTEMPT_LIMIT_REACHED',
        'You have used all attempts for this game.',
        400
      );
    }

    // Load guessed movie
    const guessedMovie = await this.movieRepo.findById(req.movieId);
    if (!guessedMovie) {
      throw new AppError('MOVIE_NOT_FOUND', 'Guessed movie was not found.', 404);
    }

    if (!guessedMovie.playableAsGuess) {
      throw new AppError('MOVIE_NOT_PLAYABLE', 'Selected movie is not eligible for guessing.', 400);
    }

    // Load target movie (strictly server-authoritative)
    const targetMovie = await this.movieRepo.findById(session.game.targetMovieId);
    if (!targetMovie) {
      throw new AppError('INTERNAL_ERROR', 'Target movie data could not be resolved.', 500);
    }

    // Clue evaluation
    const rulesetDomain = GameRepository.toDomainRuleset(session.game.ruleset);
    const evaluation = this.clueEng.evaluateGuess(
      targetMovie,
      guessedMovie,
      rulesetDomain.clueConfig
    );

    const isCorrect = evaluation.isCorrect;
    const attemptNumber = attemptsUsed + 1;
    const isWin = isCorrect;
    const isLoss = !isCorrect && attemptNumber >= maxAttempts;
    const newStatus = isWin ? 'WON' : isLoss ? 'LOST' : 'IN_PROGRESS';
    const completedAt = isWin || isLoss ? new Date() : undefined;

    // Transactional state update
    const { session: updatedSession } = await this.gameRepo.recordGuessTransaction(
      sessionId,
      {
        movieId: req.movieId,
        attemptNumber,
        evaluation,
        isCorrect,
        clientRequestId: req.clientRequestId,
        newSessionStatus: newStatus,
        completedAt,
      }
    );

    // Check hint unlock
    let unlockedHint: SessionHintSummary | null = null;
    if (
      attemptNumber === rulesetDomain.hintConfig.firstHintUnlockAttempt ||
      attemptNumber === rulesetDomain.hintConfig.secondHintUnlockAttempt
    ) {
      unlockedHint = await this.generateHintForSession(
        updatedSession.id,
        attemptNumber,
        targetMovie
      );
    }

    let revealedTarget: RevealedTargetSummary | null = null;
    if (newStatus === 'WON' || newStatus === 'LOST') {
      revealedTarget = GameEngine.formatRevealedTarget(targetMovie);
    }

    return {
      sessionId: updatedSession.id,
      attemptNumber,
      isCorrect,
      status: updatedSession.status,
      attemptsUsed: updatedSession.attemptsUsed,
      attemptsRemaining: maxAttempts - updatedSession.attemptsUsed,
      evaluation,
      revealedTarget,
      unlockedHint,
    };
  }

  async getSessionState(sessionId: string): Promise<ClientSessionState> {
    const session = await this.gameRepo.findSessionById(sessionId);
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Game session not found.', 404);
    }

    const isCompleted = session.status === 'WON' || session.status === 'LOST';
    let revealedTarget: RevealedTargetSummary | null = null;

    if (isCompleted) {
      const target = await this.movieRepo.findById(session.game.targetMovieId);
      if (target) revealedTarget = GameEngine.formatRevealedTarget(target);
    }

    const guesses: SessionGuessSummary[] = session.guesses.map((g) => ({
      id: g.id,
      attemptNumber: g.attemptNumber,
      movieId: g.movieId,
      isCorrect: g.isCorrect,
      evaluation: g.evaluation as any,
      createdAt: g.createdAt.toISOString(),
    }));

    const hints: SessionHintSummary[] = session.hintsUsed.map((h) => ({
      id: h.id,
      hintType: h.hintType,
      hintContent: h.hintContent as any,
      unlockedAt: h.unlockedAt.toISOString(),
      revealedAt: h.revealedAt?.toISOString(),
    }));

    return {
      sessionId: session.id,
      gameId: session.gameId,
      mode: session.game.mode,
      status: session.status,
      maxAttempts: session.game.maxAttempts,
      attemptsUsed: session.attemptsUsed,
      attemptsRemaining: session.game.maxAttempts - session.attemptsUsed,
      guesses,
      hints,
      isCompleted,
      isWon: session.status === 'WON',
      revealedTarget,
      puzzleDate: session.game.dailyPuzzle?.puzzleDate,
      challengeCode: session.game.challenge?.publicCode,
    };
  }

  private async generateHintForSession(
    sessionId: string,
    attemptNumber: number,
    target: NormalizedMovie
  ): Promise<SessionHintSummary> {
    let hintType = 'LEAD_CAST';
    let hintContent: Record<string, unknown> = {};

    if (attemptNumber === 5) {
      hintType = 'DIRECTOR_INITIAL';
      const dir = target.directors[0]?.canonicalName || 'A prominent filmmaker';
      hintContent = {
        label: 'Director Clue',
        hintText: `Directed by ${dir.split(' ').map((w) => w[0]).join('. ')}.`,
      };
    } else {
      hintType = 'GENRE_DECADE';
      const decade = Math.floor(target.releaseYear / 10) * 10;
      const genreNames = target.genres.map((g) => g.canonicalName).join(', ');
      hintContent = {
        label: 'Era & Genre Clue',
        hintText: `Released in the ${decade}s. Genres: ${genreNames || 'Drama'}.`,
      };
    }

    const hintRecord = await this.gameRepo.addHintToSession(sessionId, hintType, hintContent);
    return {
      id: hintRecord.id,
      hintType: hintRecord.hintType,
      hintContent: hintRecord.hintContent as any,
      unlockedAt: hintRecord.unlockedAt.toISOString(),
    };
  }
}

export const gameEngine = new GameEngine();
