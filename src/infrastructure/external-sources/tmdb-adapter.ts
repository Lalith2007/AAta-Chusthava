export interface DiscoveredMovieSummary {
  source: string;
  sourceMovieId: string;
  title: string;
  originalTitle: string;
  releaseDate?: string;
  originalLanguage: string;
  popularity?: number;
  voteAverage?: number;
  voteCount?: number;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  release_date: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path?: string | null;
    origin_country?: string;
  }>;
}

export interface TmdbCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    original_name: string;
    character?: string;
    order: number;
    profile_path?: string | null;
    gender?: number; // 1 = female, 2 = male
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path?: string | null;
  }>;
}

export interface MovieDataSource {
  discoverMovies(
    language: string,
    year: number,
    page?: number
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }>;
  getMovieDetails(sourceMovieId: string): Promise<TmdbMovieDetails>;
  getCredits(sourceMovieId: string): Promise<TmdbCredits>;
  getAlternativeTitles(sourceMovieId: string): Promise<string[]>;
}

import { HISTORICAL_CATALOG, HistoricalMovieRecord } from './historical-catalog-data';

export class TmdbAdapter implements MovieDataSource {
  private baseUrl = 'https://api.themoviedb.org/3';

  private get apiKey(): string {
    return process.env.TMDB_API_KEY?.trim() || '';
  }

  private get token(): string {
    return process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey || this.token);
  }

  private getHeaders(): HeadersInit {
    if (this.token) {
      return {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  private getUrl(path: string, params: Record<string, string | number> = {}): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (this.apiKey && !this.token) {
      url.searchParams.set('api_key', this.apiKey);
    }
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  async discoverMovies(
    language: string, // 'te' or 'hi'
    year: number,
    page = 1
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }> {
    if (!this.apiKey && !this.token) {
      // Return matching movies from canonical historical catalog
      const pageSize = 20;
      const matches = HISTORICAL_CATALOG.filter((m) => {
        const movieYear = parseInt(m.details.release_date.split('-')[0], 10);
        return m.details.original_language === language && movieYear === year;
      });

      const totalResults = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
      const startIdx = (page - 1) * pageSize;
      const pageMatches = matches.slice(startIdx, startIdx + pageSize);

      const results: DiscoveredMovieSummary[] = pageMatches.map((m) => ({
        source: 'TMDB',
        sourceMovieId: String(m.details.id),
        title: m.details.title,
        originalTitle: m.details.original_title,
        releaseDate: m.details.release_date,
        originalLanguage: m.details.original_language,
        popularity: (m.details.vote_count || 0) / 100,
        voteAverage: m.details.vote_average,
        voteCount: m.details.vote_count,
      }));

      return {
        results,
        totalPages,
        totalResults,
      };
    }

    try {
      const url = this.getUrl('/discover/movie', {
        with_original_language: language,
        primary_release_year: year,
        sort_by: 'popularity.desc',
        page,
      });

      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`TMDB Discover error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const results: DiscoveredMovieSummary[] = (data.results || []).map((item: any) => ({
        source: 'TMDB',
        sourceMovieId: String(item.id),
        title: item.title,
        originalTitle: item.original_title,
        releaseDate: item.release_date,
        originalLanguage: item.original_language,
        popularity: item.popularity,
        voteAverage: item.vote_average,
        voteCount: item.vote_count,
      }));

      return {
        results,
        totalPages: data.total_pages || 1,
        totalResults: data.total_results || results.length,
      };
    } catch {
      // Graceful fallback to historical catalog
      const pageSize = 20;
      const matches = HISTORICAL_CATALOG.filter((m) => {
        const movieYear = parseInt(m.details.release_date.split('-')[0], 10);
        return m.details.original_language === language && movieYear === year;
      });

      const totalResults = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
      const startIdx = (page - 1) * pageSize;
      const pageMatches = matches.slice(startIdx, startIdx + pageSize);

      const results: DiscoveredMovieSummary[] = pageMatches.map((m) => ({
        source: 'TMDB',
        sourceMovieId: String(m.details.id),
        title: m.details.title,
        originalTitle: m.details.original_title,
        releaseDate: m.details.release_date,
        originalLanguage: m.details.original_language,
        popularity: (m.details.vote_count || 0) / 100,
        voteAverage: m.details.vote_average,
        voteCount: m.details.vote_count,
      }));

      return {
        results,
        totalPages,
        totalResults,
      };
    }
  }

  async getMovieDetails(sourceMovieId: string): Promise<TmdbMovieDetails> {
    const historicalRecord = HISTORICAL_CATALOG.find((m) => String(m.details.id) === sourceMovieId);
    if (historicalRecord) return historicalRecord.details;

    if (!this.apiKey && !this.token) {
      throw new Error(
        `TMDB configuration missing: TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN is not set in environment, and movie ID ${sourceMovieId} was not found in historical catalog`
      );
    }

    try {
      const url = this.getUrl(`/movie/${sourceMovieId}`);
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(`TMDB authentication error (${res.status}): Invalid or unauthorized API credentials`);
        }
        if (res.status === 404) {
          throw new Error(`TMDB 404: Movie with ID ${sourceMovieId} not found on TMDB`);
        }
        if (res.status === 429) {
          throw new Error(`TMDB 429: Rate limit exceeded`);
        }
        if (res.status >= 500) {
          throw new Error(`TMDB 5xx (${res.status}): Server error ${res.statusText}`);
        }
        throw new Error(`TMDB getMovieDetails error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    } catch (err: any) {
      throw err;
    }
  }

  async getCredits(sourceMovieId: string): Promise<TmdbCredits> {
    const historicalRecord = HISTORICAL_CATALOG.find((m) => String(m.details.id) === sourceMovieId);
    if (historicalRecord) return historicalRecord.credits;

    if (!this.apiKey && !this.token) {
      throw new Error(
        `TMDB configuration missing: TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN is not set in environment, and credits for movie ID ${sourceMovieId} were not found in historical catalog`
      );
    }

    try {
      const url = this.getUrl(`/movie/${sourceMovieId}/credits`);
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(`TMDB authentication error (${res.status}): Invalid or unauthorized API credentials`);
        }
        if (res.status === 404) {
          throw new Error(`TMDB 404: Credits for movie ID ${sourceMovieId} not found on TMDB`);
        }
        if (res.status === 429) {
          throw new Error(`TMDB 429: Rate limit exceeded`);
        }
        if (res.status >= 500) {
          throw new Error(`TMDB 5xx (${res.status}): Server error ${res.statusText}`);
        }
        throw new Error(`TMDB getCredits error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    } catch (err: any) {
      throw err;
    }
  }

  async getAlternativeTitles(sourceMovieId: string): Promise<string[]> {
    const historicalRecord = HISTORICAL_CATALOG.find((m) => String(m.details.id) === sourceMovieId);
    if (historicalRecord) {
      return historicalRecord.alternativeTitles || [];
    }

    if (!this.apiKey && !this.token) {
      return [];
    }

    try {
      const url = this.getUrl(`/movie/${sourceMovieId}/alternative_titles`);
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.titles || []).map((t: any) => t.title);
    } catch {
      return [];
    }
  }
}

export const tmdbAdapter = new TmdbAdapter();
