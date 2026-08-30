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

export class TmdbAdapter implements MovieDataSource {
  private apiKey: string;
  private token: string;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    this.token = process.env.TMDB_API_READ_ACCESS_TOKEN || '';
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
      // Return empty if credentials not configured
      return { results: [], totalPages: 0, totalResults: 0 };
    }

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
  }

  async getMovieDetails(sourceMovieId: string): Promise<TmdbMovieDetails> {
    const url = this.getUrl(`/movie/${sourceMovieId}`);
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`TMDB getMovieDetails error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getCredits(sourceMovieId: string): Promise<TmdbCredits> {
    const url = this.getUrl(`/movie/${sourceMovieId}/credits`);
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`TMDB getCredits error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getAlternativeTitles(sourceMovieId: string): Promise<string[]> {
    const url = this.getUrl(`/movie/${sourceMovieId}/alternative_titles`);
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.titles || []).map((t: any) => t.title);
  }
}

export const tmdbAdapter = new TmdbAdapter();
