export type QualityTier = 'TIER_1_RICH' | 'TIER_2_MEDIUM';

export type FallbackLevel =
  | 'LEVEL_1_STANDARD'
  | 'LEVEL_2_EITHER_LANGUAGE'
  | 'LEVEL_3_ANY_TIER'
  | 'LEVEL_4_ANY_LANGUAGE_ANY_TIER'
  | 'LEVEL_5_COOLDOWN_RELAXED';

export interface TargetQualityProfile {
  movieId: string;
  primaryTitle: string;
  releaseYear: number;
  languages: ('TELUGU' | 'HINDI')[];
  directorsCount: number;
  castCount: number;
  hasPrimaryLead: boolean;
  hasSecondaryLead: boolean;
  hasSupportingCast: boolean;
  hasMusicDirector: boolean;
  hasStudio: boolean;
  hasRating: boolean;
  ratingValue?: number;
  voteCount?: number;
  hasBoxOffice: boolean;
  boxOfficeValue?: number;
  hasGenres: boolean;
  genresCount: number;
  availableCluesCount: number;
  qualityScore: number;
  qualityTier: QualityTier;
}

export interface SelectionMetadata {
  algorithmVersion: 'DAILY_SELECTION_V1';
  puzzleDate: string;
  selectedMovieId: string;
  selectedTitle: string;
  language: 'TELUGU' | 'HINDI' | 'MULTILINGUAL';
  preferredLanguage: 'TELUGU' | 'HINDI';
  qualityTier: QualityTier;
  qualityScore: number;
  availableCluesCount: number;
  deterministicPriority: number;
  jitter: number;
  fallbackLevel: FallbackLevel;
  fallbackReason?: string;
  recentTeluguCount: number;
  recentHindiCount: number;
  cooldownDays: number;
  cooldownExcludedCount: number;
  candidatePoolSize: number;
  evaluatedCandidatesCount: number;
  selectionDurationMs: number;
  isOverridden: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}

export interface DailyPuzzlePreview {
  puzzleDate: string;
  movie: {
    id: string;
    primaryTitle: string;
    originalTitle: string;
    releaseYear: number;
    supportedLanguages: string[];
    posterAsset: string | null;
  };
  selectionMethod: 'WEIGHTED_RANDOM' | 'ADMIN_SELECTED' | 'CURATED' | 'RANDOM';
  selectionMetadata: SelectionMetadata;
  isAlreadyPersisted: boolean;
  existingGameId?: string;
}

export interface DailyPuzzleOverrideRequest {
  puzzleDate: string;
  movieId: string;
  overrideReason: string;
  adminId?: string;
}
