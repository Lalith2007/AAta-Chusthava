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

export interface TmdbDiscoveryOptions {
  language: string; // 'te' | 'hi'
  year?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  sortBy?: string;
  page?: number;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  release_date: string;
  overview?: string;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

export interface MovieDataSource {
  discoverMovies(
    language: string,
    year: number,
    page?: number
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }>;
  discover?(
    options: TmdbDiscoveryOptions
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }>;
  searchMovies?(
    query: string,
    options?: { year?: number; language?: string; page?: number }
  ): Promise<{ results: TmdbSearchResult[]; totalPages: number; totalResults: number }>;
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

  private async fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, { headers: this.getHeaders() });
        if (res.status === 429) {
          if (attempt < maxRetries) {
            const retryAfter = res.headers.get('Retry-After');
            const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 5000)));
            continue;
          }
        }
        if (res.status >= 500 && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
          continue;
        }
        return res;
      } catch (err: unknown) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    throw lastError || new Error(`Failed to fetch from TMDB: ${url}`);
  }

  async discover(
    options: TmdbDiscoveryOptions
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }> {
    const { language, year, startDate, endDate, sortBy = 'popularity.desc', page = 1 } = options;

    if (!this.isConfigured()) {
      // Return matching movies from canonical historical catalog
      const pageSize = 20;
      const matches = HISTORICAL_CATALOG.filter((m) => {
        if (m.details.original_language !== language) return false;
        const movieYear = parseInt(m.details.release_date.split('-')[0], 10);
        if (year && movieYear !== year) return false;
        if (startDate && m.details.release_date < startDate) return false;
        if (endDate && m.details.release_date > endDate) return false;
        return true;
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

    const queryParams: Record<string, string | number> = {
      with_original_language: language,
      sort_by: sortBy,
      page,
    };

    if (year) {
      queryParams['primary_release_year'] = year;
    }
    if (startDate) {
      queryParams['primary_release_date.gte'] = startDate;
    }
    if (endDate) {
      queryParams['primary_release_date.lte'] = endDate;
    }

    const url = this.getUrl('/discover/movie', queryParams);
    const res = await this.fetchWithRetry(url);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`TMDB authentication error (${res.status}): Invalid or unauthorized API credentials`);
      }
      if (res.status === 404) {
        throw new Error(`TMDB 404: Discover endpoint returned not found`);
      }
      if (res.status === 429) {
        throw new Error(`TMDB 429: Rate limit exceeded`);
      }
      if (res.status >= 500) {
        throw new Error(`TMDB 5xx (${res.status}): Server error ${res.statusText}`);
      }
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
  }

  async searchMovies(
    query: string,
    options?: { year?: number; language?: string; page?: number }
  ): Promise<{ results: TmdbSearchResult[]; totalPages: number; totalResults: number }> {
    const { year, language, page = 1 } = options || {};

    if (!this.isConfigured()) {
      const qLower = query.toLowerCase().trim();
      const pageSize = 20;
      const matches = HISTORICAL_CATALOG.filter((m) => {
        if (language && m.details.original_language !== language) return false;
        const movieYear = parseInt(m.details.release_date.split('-')[0], 10);
        if (year && movieYear !== year) return false;
        const titleMatch =
          m.details.title.toLowerCase().includes(qLower) ||
          m.details.original_title.toLowerCase().includes(qLower);
        return titleMatch;
      });

      const totalResults = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
      const startIdx = (page - 1) * pageSize;
      const pageMatches = matches.slice(startIdx, startIdx + pageSize);

      const results: TmdbSearchResult[] = pageMatches.map((m) => ({
        id: m.details.id,
        title: m.details.title,
        original_title: m.details.original_title,
        original_language: m.details.original_language,
        release_date: m.details.release_date,
        overview: m.details.overview,
        popularity: (m.details.vote_count || 0) / 100,
        vote_average: m.details.vote_average,
        vote_count: m.details.vote_count,
        poster_path: m.details.poster_path,
        backdrop_path: m.details.backdrop_path,
      }));

      return {
        results,
        totalPages,
        totalResults,
      };
    }

    const queryParams: Record<string, string | number> = {
      query,
      page,
    };
    if (year) {
      queryParams['primary_release_year'] = year;
    }
    if (language) {
      queryParams['language'] = language;
    }

    const url = this.getUrl('/search/movie', queryParams);
    const res = await this.fetchWithRetry(url);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`TMDB authentication error (${res.status}): Invalid or unauthorized API credentials`);
      }
      if (res.status === 404) {
        return { results: [], totalPages: 1, totalResults: 0 };
      }
      if (res.status === 429) {
        throw new Error(`TMDB 429: Rate limit exceeded`);
      }
      if (res.status >= 500) {
        throw new Error(`TMDB 5xx (${res.status}): Server error ${res.statusText}`);
      }
      throw new Error(`TMDB searchMovies error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const results: TmdbSearchResult[] = (data.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      original_title: item.original_title,
      original_language: item.original_language,
      release_date: item.release_date || '',
      overview: item.overview,
      popularity: item.popularity,
      vote_average: item.vote_average,
      vote_count: item.vote_count,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
    }));

    return {
      results,
      totalPages: data.total_pages || 1,
      totalResults: data.total_results || results.length,
    };
  }

  async discoverMovies(
    language: string, // 'te' or 'hi'
    year: number,
    page = 1
  ): Promise<{ results: DiscoveredMovieSummary[]; totalPages: number; totalResults: number }> {
    return this.discover({ language, year, page });
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
