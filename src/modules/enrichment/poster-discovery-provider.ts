import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { mediaIdentityValidator, PosterCandidate, PosterValidationResult } from './media-identity-validator';
import { resolvePosterUrl } from '@/lib/poster-utils';

export interface PosterDiscoveryResult {
  status: 'VERIFIED' | 'MANUAL_REVIEW_REQUIRED' | 'REJECTED_CANDIDATE' | 'NO_CANDIDATE_FOUND';
  posterUrl: string | null;
  source: 'TMDB_ID_MATCH' | 'TMDB_TITLE_YEAR_MATCH' | 'GOOGLE_TITLE_YEAR_VERIFIED' | 'ADMIN_MANUAL_VERIFIED' | 'NONE';
  googleSearchUrl: string;
  candidate?: PosterCandidate;
  validation?: PosterValidationResult;
  notes?: string;
}

export class PosterDiscoveryProvider {
  /**
   * Attempts to discover a verified poster for a movie across multiple sources in strict priority order
   */
  async discoverPoster(movie: {
    id: string;
    title: string;
    releaseYear: number;
    tmdbId?: number | null;
    originalTitle?: string | null;
  }): Promise<PosterDiscoveryResult> {
    const googleSearchUrl = mediaIdentityValidator.buildMovieGoogleSearchUrl(
      movie.title,
      movie.releaseYear
    );

    // 1. Check exact TMDB ID match if available
    if (movie.tmdbId) {
      try {
        const details = await tmdbAdapter.getMovieDetails(String(movie.tmdbId));
        if (details?.poster_path) {
          const candidate: PosterCandidate = {
            imageUrl: details.poster_path,
            source: 'TMDB',
            candidateTitle: details.title || movie.title,
            candidateYear: details.release_date
              ? parseInt(details.release_date.split('-')[0], 10)
              : movie.releaseYear,
            tmdbId: details.id,
          };

          const validation = mediaIdentityValidator.scorePosterCandidate(
            {
              title: movie.title,
              releaseYear: movie.releaseYear,
              tmdbId: movie.tmdbId,
            },
            candidate
          );

          if (validation.isAcceptableForAutoEnrich) {
            return {
              status: 'VERIFIED',
              posterUrl: resolvePosterUrl(details.poster_path),
              source: 'TMDB_ID_MATCH',
              googleSearchUrl,
              candidate,
              validation,
              notes: 'Verified via exact TMDB ID lookup',
            };
          }
        }
      } catch (err) {
        // TMDB ID failed or returned 404, fall through to title+year search
      }
    }

    // 2. TMDB Title + Exact Year Search
    if (tmdbAdapter.searchMovies) {
      try {
        const searchRes = await tmdbAdapter.searchMovies(movie.title, {
          year: movie.releaseYear,
        });

        if (searchRes.results && searchRes.results.length > 0) {
          // Find the best candidate that matches exact title + year
          for (const item of searchRes.results) {
            if (!item.poster_path) continue;

            const itemYear = item.release_date
              ? parseInt(item.release_date.split('-')[0], 10)
              : undefined;

            const candidate: PosterCandidate = {
              imageUrl: item.poster_path,
              source: 'TMDB',
              candidateTitle: item.title,
              candidateYear: itemYear,
              tmdbId: item.id,
              sourceDomain: 'themoviedb.org',
            };

            const validation = mediaIdentityValidator.scorePosterCandidate(
              {
                title: movie.title,
                releaseYear: movie.releaseYear,
                originalTitle: movie.originalTitle,
                tmdbId: movie.tmdbId,
              },
              candidate
            );

            if (validation.isAcceptableForAutoEnrich) {
              return {
                status: 'VERIFIED',
                posterUrl: resolvePosterUrl(item.poster_path),
                source: 'TMDB_TITLE_YEAR_MATCH',
                googleSearchUrl,
                candidate,
                validation,
                notes: `Verified via TMDB exact title+year search (tmdbId: ${item.id})`,
              };
            }
          }
        }
      } catch (err) {
        // Search error, fall through
      }
    }

    // 3. Google Candidate Provider / Fallback
    // When automated search is not directly wired or returns ambiguous candidates:
    // Generate the exact search URL and route to MANUAL_REVIEW_REQUIRED.
    return {
      status: 'MANUAL_REVIEW_REQUIRED',
      posterUrl: null,
      source: 'NONE',
      googleSearchUrl,
      notes: 'No automated high-confidence candidate found. Routed to manual review with exact Google search URL.',
    };
  }
}

export const posterDiscoveryProvider = new PosterDiscoveryProvider();
