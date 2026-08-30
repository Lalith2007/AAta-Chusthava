import { GameMode, SessionStatus, DailyPuzzleStatus, ChallengeStatus } from '@prisma/client';
import { ClueRulesetConfig, GuessEvaluation } from '../clue/types';

export { GameMode, SessionStatus, DailyPuzzleStatus, ChallengeStatus };

export interface GameRulesetDomain {
  id: string;
  name: string;
  maxAttempts: number;
  clueConfig: ClueRulesetConfig;
  hintConfig: {
    firstHintUnlockAttempt: number; // default 5
    secondHintUnlockAttempt: number; // default 8
  };
  duplicateGuessPolicy: 'REJECT_NO_PENALTY' | 'COUNT_ATTEMPT';
  targetEligibilityPolicy: string;
}

export interface SessionGuessSummary {
  id: string;
  attemptNumber: number;
  movieId: string;
  isCorrect: boolean;
  evaluation: GuessEvaluation;
  createdAt: string;
}

export interface SessionHintSummary {
  id: string;
  hintType: string;
  hintContent: Record<string, unknown>;
  unlockedAt: string;
  revealedAt?: string | null;
}

export interface RevealedTargetSummary {
  id: string;
  title: string;
  originalTitle: string;
  releaseYear: number;
  languages: string[];
  industries: string[];
  posterAsset?: string | null;
  backdropAsset?: string | null;
  directors: string[];
  musicDirectors: string[];
  leadActors: string[];
  leadActresses: string[];
  genres: string[];
  boxOfficeDisplay?: string;
  ratingDisplay?: string;
}

export interface ClientSessionState {
  sessionId: string;
  gameId: string;
  mode: GameMode;
  status: SessionStatus;
  maxAttempts: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  guesses: SessionGuessSummary[];
  hints: SessionHintSummary[];
  isCompleted: boolean;
  isWon: boolean;
  revealedTarget?: RevealedTargetSummary | null;
  puzzleDate?: string | null;
  challengeCode?: string | null;
}

export interface SubmitGuessRequest {
  movieId: string;
  clientRequestId?: string;
}

export interface SubmitGuessResponse {
  sessionId: string;
  attemptNumber: number;
  isCorrect: boolean;
  status: SessionStatus;
  attemptsUsed: number;
  attemptsRemaining: number;
  evaluation: GuessEvaluation;
  revealedTarget?: RevealedTargetSummary | null;
  unlockedHint?: SessionHintSummary | null;
}
