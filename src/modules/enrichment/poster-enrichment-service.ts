import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter, TmdbMovieDetails } from '@/infrastructure/external-sources/tmdb-adapter';
import { resolvePosterUrl } from '@/lib/poster-utils';

export interface PosterEnrichmentOptions {
  dryRun?: boolean;
  limit?: number;
  movieId?: string;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  onProgress?: (progress: {
    processed: number;
    total: number;
    successfullyEnriched: number;
    noPosterAvailable: number;
    lookupFailures: number;
    currentMovieTitle: string;
  }) => void;
}

export interface PosterEnrichmentResult {
  movieId: string;
  tmdbId: number;
  title: string;
  releaseYear: number;
  status: 'ENRICHED' | 'ALREADY_HAD_POSTER' | 'NO_POSTER_AVAILABLE' | 'FAILED' | 'SKIPPED';
  previousPosterAsset: string | null;
  newPosterAsset: string | null;
  rawPosterPath?: string | null;
  error?: string;
}

export interface PosterEnrichmentSummaryReport {
  totalActiveMovies: number;
  totalCandidates: number;
  totalProcessed: number;
  alreadyHadPoster: number;
  successfullyEnriched: number;
  noPosterAvailable: number;
  lookupFailures: number;
  rateLimitedFailures: number;
  remainingCandidates: number;
  results: PosterEnrichmentResult[];
}

export class PosterEnrichmentService {
  private defaultConcurrency = 5;
  private defaultMaxRetries = 2;
  private defaultRetryDelayMs = 250;

  /**
   * Fetches TMDB movie details with exponential backoff for transient failures
   */
  async fetchTmdbDetailsWithRetry(
    tmdbId: number,
    maxRetries = this.defaultMaxRetries,
    baseDelayMs = this.defaultRetryDelayMs
  ): Promise<TmdbMovieDetails> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const details = await tmdbAdapter.getMovieDetails(String(tmdbId));
        if (details) return details;
        throw new Error(`Empty TMDB response for ID ${tmdbId}`);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isRateLimit = errMsg.includes('429');
        const is5xx = /5\d{2}/.test(errMsg);
        const isNetwork = errMsg.includes('fetch') || errMsg.includes('timeout') || errMsg.includes('ECONN');

        // Only retry transient errors
        if ((isRateLimit || is5xx || isNetwork) && attempt < maxRetries) {
          const delay = isRateLimit
            ? baseDelayMs * Math.pow(2, attempt) + 500
            : baseDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // For non-retryable errors (e.g. 404), break immediately
        break;
      }
    }

    throw lastError;
  }

  /**
   * Enriches a single movie's poster from TMDB safely and idempotently
   */
  async enrichMoviePoster(
    movieId: string,
    options: { dryRun?: boolean; maxRetries?: number } = {}
  ): Promise<PosterEnrichmentResult> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        tmdbId: true,
        primaryTitle: true,
        releaseYear: true,
        posterAsset: true,
        lifecycleStatus: true,
      },
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found.`);
    }

    const previousPosterAsset = movie.posterAsset?.trim() || null;

    // Idempotency: Do NOT overwrite an already valid posterAsset
    if (previousPosterAsset && resolvePosterUrl(previousPosterAsset)) {
      return {
        movieId: movie.id,
        tmdbId: movie.tmdbId ?? 0,
        title: movie.primaryTitle,
        releaseYear: movie.releaseYear,
        status: 'ALREADY_HAD_POSTER',
        previousPosterAsset,
        newPosterAsset: previousPosterAsset,
      };
    }

    if (!movie.tmdbId) {
      return {
        movieId: movie.id,
        tmdbId: 0,
        title: movie.primaryTitle,
        releaseYear: movie.releaseYear,
        status: 'SKIPPED',
        previousPosterAsset: null,
        newPosterAsset: null,
        error: 'Movie has no TMDB ID',
      };
    }

    try {
      const details = await this.fetchTmdbDetailsWithRetry(
        movie.tmdbId,
        options.maxRetries ?? this.defaultMaxRetries
      );

      const rawPosterPath = details.poster_path?.trim() || null;
      const normalizedUrl = resolvePosterUrl(rawPosterPath);

      if (rawPosterPath && normalizedUrl) {
        if (!options.dryRun) {
          // 1. Safe update: ONLY update posterAsset on Movie
          await prisma.movie.update({
            where: { id: movie.id },
            data: {
              posterAsset: normalizedUrl,
            },
          });

          // 2. Preserve Provenance: Upsert RawSourceRecord
          const existingRaw = await prisma.rawSourceRecord.findUnique({
            where: {
              source_sourceRecordId: {
                source: 'TMDB',
                sourceRecordId: String(movie.tmdbId),
              },
            },
          });

          if (existingRaw) {
            const currentPayload = (existingRaw.payload as Record<string, unknown>) || {};
            await prisma.rawSourceRecord.update({
              where: { id: existingRaw.id },
              data: {
                payload: {
                  ...currentPayload,
                  details,
                  posterEnrichedAt: new Date().toISOString(),
                } as any,
                fetchedAt: new Date(),
              },
            });
          } else {
            await prisma.rawSourceRecord.create({
              data: {
                source: 'TMDB',
                sourceRecordId: String(movie.tmdbId),
                payload: {
                  details,
                  posterEnrichedAt: new Date().toISOString(),
                } as any,
                fetchedAt: new Date(),
              },
            });
          }
        }

        return {
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.primaryTitle,
          releaseYear: movie.releaseYear,
          status: 'ENRICHED',
          previousPosterAsset,
          newPosterAsset: normalizedUrl,
          rawPosterPath,
        };
      } else {
        return {
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.primaryTitle,
          releaseYear: movie.releaseYear,
          status: 'NO_POSTER_AVAILABLE',
          previousPosterAsset,
          newPosterAsset: null,
          rawPosterPath,
        };
      }
    } catch (err: any) {
      return {
        movieId: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.primaryTitle,
        releaseYear: movie.releaseYear,
        status: 'FAILED',
        previousPosterAsset,
        newPosterAsset: null,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Executes bounded concurrent poster enrichment across candidate movies
   */
  async enrichAllMissingPosters(
    options: PosterEnrichmentOptions = {}
  ): Promise<PosterEnrichmentSummaryReport> {
    const totalActiveMovies = await prisma.movie.count({
      where: { lifecycleStatus: 'ACTIVE' },
    });

    const candidateWhere: any = {
      lifecycleStatus: 'ACTIVE',
      tmdbId: { not: null },
      OR: [
        { posterAsset: null },
        { posterAsset: '' },
        { posterAsset: 'null' },
        { posterAsset: 'undefined' },
      ],
    };

    if (options.movieId) {
      candidateWhere.id = options.movieId;
    }

    const candidates = await prisma.movie.findMany({
      where: candidateWhere,
      take: options.limit,
      orderBy: [{ releaseYear: 'desc' }, { primaryTitle: 'asc' }],
      select: { id: true, primaryTitle: true, releaseYear: true, tmdbId: true },
    });

    const totalCandidates = candidates.length;
    const concurrency = Math.max(1, options.concurrency ?? this.defaultConcurrency);
    const results: PosterEnrichmentResult[] = [];

    let processed = 0;
    let successfullyEnriched = 0;
    let noPosterAvailable = 0;
    let lookupFailures = 0;
    let rateLimitedFailures = 0;
    let alreadyHadPoster = 0;

    // Process in chunks with bounded concurrency
    for (let i = 0; i < candidates.length; i += concurrency) {
      const chunk = candidates.slice(i, i + concurrency);

      const chunkResults = await Promise.all(
        chunk.map(async (cand) => {
          const res = await this.enrichMoviePoster(cand.id, {
            dryRun: options.dryRun,
            maxRetries: options.maxRetries,
          });

          processed++;
          if (res.status === 'ENRICHED') successfullyEnriched++;
          else if (res.status === 'NO_POSTER_AVAILABLE') noPosterAvailable++;
          else if (res.status === 'ALREADY_HAD_POSTER') alreadyHadPoster++;
          else if (res.status === 'FAILED') {
            lookupFailures++;
            if (res.error?.includes('429')) rateLimitedFailures++;
          }

          if (options.onProgress) {
            options.onProgress({
              processed,
              total: totalCandidates,
              successfullyEnriched,
              noPosterAvailable,
              lookupFailures,
              currentMovieTitle: cand.primaryTitle,
            });
          }

          return res;
        })
      );

      results.push(...chunkResults);

      // Brief yield between chunks to prevent aggressive rate throttling
      if (i + concurrency < candidates.length && !options.dryRun) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const remainingCandidates = totalCandidates - successfullyEnriched - alreadyHadPoster;

    return {
      totalActiveMovies,
      totalCandidates,
      totalProcessed: processed,
      alreadyHadPoster,
      successfullyEnriched,
      noPosterAvailable,
      lookupFailures,
      rateLimitedFailures,
      remainingCandidates: Math.max(0, remainingCandidates),
      results,
    };
  }
}

export const posterEnrichmentService = new PosterEnrichmentService();
