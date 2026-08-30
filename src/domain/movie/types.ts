import {
  MovieLanguage,
  MovieIndustry,
  BoxOfficeStatus,
  LifecycleStatus,
  RelationType,
  RoleType,
  ProductionHouseRole,
  MovieRelationshipType,
  ReviewStatus,
} from '@prisma/client';

export {
  MovieLanguage,
  MovieIndustry,
  BoxOfficeStatus,
  LifecycleStatus,
  RelationType,
  RoleType,
  ProductionHouseRole,
  MovieRelationshipType,
  ReviewStatus,
};

export interface NormalizedPerson {
  id: string;
  canonicalName: string;
  alternateNames: string[];
  tmdbId?: number | null;
  imdbId?: string | null;
  image?: string | null;
  roleType: RoleType;
  relationType: RelationType;
  characterName?: string | null;
  billingOrder?: number | null;
}

export interface NormalizedProductionHouse {
  id: string;
  canonicalName: string;
  alternateNames: string[];
  parentCompanyId?: string | null;
  relationshipType: ProductionHouseRole;
}

export interface NormalizedGenre {
  id: string;
  canonicalName: string;
  slug: string;
}

export interface NormalizedMovie {
  id: string;
  slug: string;
  primaryTitle: string;
  originalTitle: string;
  alternativeTitles: string[];
  supportedLanguages: MovieLanguage[];
  industries: MovieIndustry[];
  countries: string[];
  releaseDate: Date | null;
  releaseYear: number;
  canonicalIndiaReleaseDate: Date | null;
  certification?: string | null;
  budget?: number | null;
  budgetCurrency?: string | null;
  boxOffice?: number | null;
  boxOfficeCurrency?: string | null;
  boxOfficeStatus: BoxOfficeStatus;
  boxOfficeSource?: string | null;
  boxOfficeVerifiedAt?: Date | null;
  rating?: number | null;
  ratingVoteCount?: number | null;
  ratingSource?: string | null;
  ratingUpdatedAt?: Date | null;
  posterAsset?: string | null;
  backdropAsset?: string | null;
  franchise?: string | null;
  lifecycleStatus: LifecycleStatus;
  tmdbId?: number | null;
  imdbId?: string | null;
  wikidataId?: string | null;
  
  // Normalized relationships for Clue and Search evaluation
  directors: NormalizedPerson[];
  musicDirectors: NormalizedPerson[];
  leadActors: NormalizedPerson[];
  leadActresses: NormalizedPerson[];
  supportingCast: NormalizedPerson[];
  crew: NormalizedPerson[];
  productionHouses: NormalizedProductionHouse[];
  genres: NormalizedGenre[];
  
  playableAsGuess: boolean;
  playableAsTarget: boolean;
}

export interface MovieSearchResult {
  id: string;
  primaryTitle: string;
  originalTitle: string;
  releaseYear: number;
  supportedLanguages: MovieLanguage[];
  industries: MovieIndustry[];
  posterAsset?: string | null;
  directorNames: string[];
  leadCastNames: string[];
  playableAsGuess: boolean;
  playableAsTarget: boolean;
}
