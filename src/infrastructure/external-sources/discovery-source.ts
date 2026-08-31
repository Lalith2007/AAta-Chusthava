import { DiscoveredMovieSummary, TmdbAdapter } from './tmdb-adapter';
export type { DiscoveredMovieSummary };

export interface CandidateIdentity {
  source: string;
  sourceMovieId: string;
  title: string;
  originalTitle: string;
  releaseYear: number;
  primaryLanguage: string;
}

export interface MovieSourceMetadata {
  overview: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  voteAverage?: number;
  voteCount?: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres: Array<{ id?: number; name: string }>;
  productionCompanies: Array<{ id?: number; name: string; country?: string }>;
}

export interface MovieSourceCredits {
  cast: Array<{
    id?: number;
    name: string;
    originalName?: string;
    character?: string;
    order: number;
    profileUrl?: string | null;
    gender?: number;
  }>;
  directors: Array<{
    id?: number;
    name: string;
    profileUrl?: string | null;
  }>;
  musicDirectors: Array<{
    id?: number;
    name: string;
    profileUrl?: string | null;
  }>;
  crew: Array<{
    id?: number;
    name: string;
    job: string;
    department: string;
    profileUrl?: string | null;
  }>;
}

export interface MovieReleaseData {
  releaseDate?: string;
  countries: string[];
  certification?: string | null;
  alternativeTitles: string[];
}

export interface DiscoveryOptions {
  language: string; // e.g. 'te' | 'hi'
  year: number;
  page?: number;
  limit?: number;
  cursor?: string;
  query?: string;
}

export type DiscoverySourceStatus = 'ACTIVE' | 'SOURCE_CANDIDATE' | 'NOT_IMPLEMENTED' | 'NOT_APPROVED' | 'DISABLED';

export interface DiscoverySourceInfo {
  name: string;
  code: string;
  isImplemented: boolean;
  status: DiscoverySourceStatus;
  description: string;
  capabilities: {
    discovery: boolean;
    credits: boolean;
    boxOffice: boolean;
    reviews: boolean;
  };
}

export interface MovieDiscoverySource {
  readonly sourceName: string;
  readonly isImplemented: boolean;
  readonly status: DiscoverySourceStatus;

  discover(options: DiscoveryOptions): Promise<{
    results: DiscoveredMovieSummary[];
    totalPages: number;
    totalResults: number;
  }>;

  getCandidateIdentity(sourceMovieId: string): Promise<CandidateIdentity>;
  getMetadata(sourceMovieId: string): Promise<MovieSourceMetadata>;
  getCredits(sourceMovieId: string): Promise<MovieSourceCredits>;
  getReleaseData(sourceMovieId: string): Promise<MovieReleaseData>;
}

export class TmdbDiscoverySource implements MovieDiscoverySource {
  readonly sourceName = 'TMDB';
  readonly isImplemented = true;
  readonly status: DiscoverySourceStatus = 'ACTIVE';

  private adapter: TmdbAdapter;

  constructor(adapter?: TmdbAdapter) {
    this.adapter = adapter || new TmdbAdapter();
  }

  async discover(options: DiscoveryOptions): Promise<{
    results: DiscoveredMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    return this.adapter.discoverMovies(options.language, options.year, options.page || 1);
  }

  async getCandidateIdentity(sourceMovieId: string): Promise<CandidateIdentity> {
    const details = await this.adapter.getMovieDetails(sourceMovieId);
    const releaseYear = details.release_date
      ? parseInt(details.release_date.split('-')[0], 10)
      : new Date().getFullYear();

    return {
      source: this.sourceName,
      sourceMovieId: String(details.id),
      title: details.title,
      originalTitle: details.original_title,
      releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
      primaryLanguage: details.original_language,
    };
  }

  async getMetadata(sourceMovieId: string): Promise<MovieSourceMetadata> {
    const details = await this.adapter.getMovieDetails(sourceMovieId);
    return {
      overview: details.overview,
      runtime: details.runtime,
      budget: details.budget,
      revenue: details.revenue,
      voteAverage: details.vote_average,
      voteCount: details.vote_count,
      posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
      genres: details.genres || [],
      productionCompanies: (details.production_companies || []).map((c) => ({
        id: c.id,
        name: c.name,
        country: c.origin_country,
      })),
    };
  }

  async getCredits(sourceMovieId: string): Promise<MovieSourceCredits> {
    const credits = await this.adapter.getCredits(sourceMovieId);
    const directors = credits.crew
      .filter((c) => c.job === 'Director')
      .map((c) => ({
        id: c.id,
        name: c.name,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

    const musicDirectors = credits.crew
      .filter((c) => c.job === 'Original Music Composer' || c.job === 'Music' || c.department === 'Sound')
      .map((c) => ({
        id: c.id,
        name: c.name,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

    return {
      cast: credits.cast.map((c) => ({
        id: c.id,
        name: c.name,
        originalName: c.original_name,
        character: c.character,
        order: c.order,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
        gender: c.gender,
      })),
      directors,
      musicDirectors,
      crew: credits.crew.map((c) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        department: c.department,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      })),
    };
  }

  async getReleaseData(sourceMovieId: string): Promise<MovieReleaseData> {
    const details = await this.adapter.getMovieDetails(sourceMovieId);
    const alternativeTitles = await this.adapter.getAlternativeTitles(sourceMovieId);
    return {
      releaseDate: details.release_date,
      countries: ['IN'],
      certification: 'U/A',
      alternativeTitles,
    };
  }
}

export class ImdbDiscoverySource implements MovieDiscoverySource {
  readonly sourceName = 'IMDb';
  readonly isImplemented = false;
  readonly status: DiscoverySourceStatus = 'NOT_IMPLEMENTED';

  async discover(): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }> {
    throw new Error('IMDb discovery source adapter is not implemented.');
  }

  async getCandidateIdentity(): Promise<CandidateIdentity> {
    throw new Error('IMDb source adapter is not implemented.');
  }

  async getMetadata(): Promise<MovieSourceMetadata> {
    throw new Error('IMDb source adapter is not implemented.');
  }

  async getCredits(): Promise<MovieSourceCredits> {
    throw new Error('IMDb source adapter is not implemented.');
  }

  async getReleaseData(): Promise<MovieReleaseData> {
    throw new Error('IMDb source adapter is not implemented.');
  }
}

export class WikidataDiscoverySource implements MovieDiscoverySource {
  readonly sourceName = 'Wikidata';
  readonly isImplemented = false;
  readonly status: DiscoverySourceStatus = 'NOT_IMPLEMENTED';

  async discover(): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }> {
    throw new Error('Wikidata discovery source adapter is not implemented.');
  }

  async getCandidateIdentity(): Promise<CandidateIdentity> {
    throw new Error('Wikidata source adapter is not implemented.');
  }

  async getMetadata(): Promise<MovieSourceMetadata> {
    throw new Error('Wikidata source adapter is not implemented.');
  }

  async getCredits(): Promise<MovieSourceCredits> {
    throw new Error('Wikidata source adapter is not implemented.');
  }

  async getReleaseData(): Promise<MovieReleaseData> {
    throw new Error('Wikidata source adapter is not implemented.');
  }
}

import { wikidataDiscoveryAdapter } from './wikidata-adapter';

export class DiscoverySourceRegistry {
  private static instance: DiscoverySourceRegistry;
  private sources: Map<string, MovieDiscoverySource> = new Map();

  private constructor() {
    this.register(new TmdbDiscoverySource());
    this.register(new ImdbDiscoverySource());
    this.register(wikidataDiscoveryAdapter);
  }

  static getInstance(): DiscoverySourceRegistry {
    if (!DiscoverySourceRegistry.instance) {
      DiscoverySourceRegistry.instance = new DiscoverySourceRegistry();
    }
    return DiscoverySourceRegistry.instance;
  }

  register(source: MovieDiscoverySource): void {
    this.sources.set(source.sourceName.toUpperCase(), source);
  }

  getSource(name: string): MovieDiscoverySource | undefined {
    return this.sources.get(name.toUpperCase());
  }

  getRegisteredSources(): DiscoverySourceInfo[] {
    return [
      {
        name: 'The Movie Database (TMDB)',
        code: 'TMDB',
        isImplemented: true,
        status: 'ACTIVE',
        description: 'Primary discovery and metadata provider with credits, alternative titles, and rich cast/crew relations.',
        capabilities: {
          discovery: true,
          credits: true,
          boxOffice: true,
          reviews: false,
        },
      },
      {
        name: 'Wikidata / Open Knowledge Graph',
        code: 'WIKIDATA',
        isImplemented: true,
        status: 'ACTIVE',
        description: 'Secondary CC0 open knowledge discovery source for cross-lingual aliases, overlooked historical titles, and award records.',
        capabilities: {
          discovery: true,
          credits: true,
          boxOffice: true,
          reviews: false,
        },
      },
      {
        name: 'Internet Movie Database (IMDb)',
        code: 'IMDB',
        isImplemented: false,
        status: 'NOT_IMPLEMENTED',
        description: 'Secondary reference source for box office verification and industry ratings (connector awaiting commercial API licensing).',
        capabilities: {
          discovery: false,
          credits: false,
          boxOffice: false,
          reviews: false,
        },
      },
      {
        name: 'Open Movie Database (OMDb)',
        code: 'OMDB',
        isImplemented: false,
        status: 'SOURCE_CANDIDATE',
        description: 'RESTful lookup interface for title-based enrichment and cross-referencing IMDb identifiers.',
        capabilities: {
          discovery: false,
          credits: true,
          boxOffice: true,
          reviews: true,
        },
      },
      {
        name: 'Indiancine.ma Open Archive',
        code: 'INDIANCINEMA_MA',
        isImplemented: false,
        status: 'NOT_APPROVED',
        description: 'Film research archive; evaluated but not approved due to anti-bot WAF restrictions and robots: NONE policy.',
        capabilities: {
          discovery: false,
          credits: false,
          boxOffice: false,
          reviews: false,
        },
      },
      {
        name: 'National Film Development Corporation (NFDC / CBFC)',
        code: 'NFDC_CBFC',
        isImplemented: false,
        status: 'NOT_IMPLEMENTED',
        description: 'Official Indian cinema regulatory records; currently lacks public REST/JSON API or structured open dataset feed.',
        capabilities: {
          discovery: false,
          credits: false,
          boxOffice: false,
          reviews: false,
        },
      },
    ];
  }
}
