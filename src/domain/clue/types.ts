import { NormalizedMovie } from '../movie/types';

export type ClueStatus = 'EXACT' | 'CLOSE' | 'PARTIAL' | 'NONE' | 'UNAVAILABLE';
export type ClueDirection = 'UP' | 'DOWN' | 'NONE';

export type ClueType =
  | 'LANGUAGE'
  | 'DIRECTOR'
  | 'PRODUCTION_HOUSE'
  | 'RELEASE_YEAR'
  | 'BOX_OFFICE'
  | 'RATING'
  | 'LEAD_ACTOR'
  | 'LEAD_ACTRESS'
  | 'SUPPORTING_CAST'
  | 'MUSIC_DIRECTOR'
  | 'GENRES';

export interface ClueResult {
  clueType: ClueType;
  status: ClueStatus;
  direction: ClueDirection;
  matchedValues: string[];
  displayValue: string;
  metadata?: Record<string, unknown>;
}

export interface ClueRulesetConfig {
  yearCloseThreshold?: number; // e.g. 3 years
  boxOfficeCloseThresholdPercent?: number; // e.g. 25% or 100M absolute
  boxOfficeCloseThresholdAbsolute?: number; // e.g. 100000000
  ratingCloseThreshold?: number; // e.g. 0.5
  enabledClues?: ClueType[];
}

export interface GuessEvaluation {
  isCorrect: boolean;
  guessedMovieId: string;
  guessedMovieSummary: {
    id: string;
    title: string;
    releaseYear: number;
    posterAsset?: string | null;
    languages: string[];
  };
  clues: Record<ClueType, ClueResult>;
  evaluatedAt: string;
}

export interface ClueEvaluator {
  clueType: ClueType;
  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    config: ClueRulesetConfig
  ): ClueResult;
}
