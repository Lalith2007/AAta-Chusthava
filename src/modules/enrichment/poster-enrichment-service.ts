import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter, TmdbMovieDetails } from '@/infrastructure/external-sources/tmdb-adapter';
import { resolvePosterUrl } from '@/lib/poster-utils';
import { recordPosterProvenance } from '@/lib/poster-provenance';
import { posterDiscoveryProvider } from './poster-discovery-provider';
import { mediaIdentityValidator } from './media-identity-validator';

export type PosterFailureCategory =
  | 'CONFIG_MISSING'
  | 'AUTH_ERROR'
  | 'NOT_FOUND_404'
  | 'RATE_LIMITED_429'
  | 'SERVER_ERROR_5XX'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+([A-Za-z0-9\-._~+/]+=*)/gi, 'Bearer [REDACTED]')
    .replace(/(api_key|token|access_token|key|secret|password)=([^&\s]+)/gi, '$1=[REDACTED]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgresql://[REDACTED]')
    .replace(/Authorization:\s*[^\n\r]+/gi, 'Authorization: [REDACTED]');
}

export function classifyPosterError(error: unknown): {
  category: PosterFailureCategory;
  safeReason: string;
} {
  const rawMsg = sanitizeErrorMessage(error instanceof Error ? error.message : String(error || ''));

  if (
    rawMsg.includes('configuration missing') ||
    rawMsg.includes('not set') ||
    rawMsg.includes('not configured')
  ) {
    return {
      category: 'CONFIG_MISSING',
      safeReason: 'TMDB configuration missing (API key/token not set)',
    };
  }

  if (
    rawMsg.includes('authentication') ||
    rawMsg.includes('unauthorized') ||
    rawMsg.includes('401') ||
    rawMsg.includes('403')
  ) {
    return {
      category: 'AUTH_ERROR',
      safeReason: 'TMDB authentication failed (invalid or unauthorized credentials)',
    };
  }

  if (
    rawMsg.includes('404') ||
    rawMsg.includes('not found on TMDB') ||
    rawMsg.includes('not found in historical catalog')
  ) {
    return {
      category: 'NOT_FOUND_404',
      safeReason: 'TMDB 404 (Movie not found)',
    };
  }

  if (rawMsg.includes('429') || rawMsg.includes('Rate limit')) {
    return {
      category: 'RATE_LIMITED_429',
      safeReason: 'TMDB 429 (Rate limit exceeded)',
    };
  }

  if (/5\d{2}/.test(rawMsg) || rawMsg.includes('Server error')) {
    return {
      category: 'SERVER_ERROR_5XX',
      safeReason: 'TMDB 5xx (Server error)',
    };
  }

  if (
    rawMsg.includes('fetch') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('ECONN') ||
    rawMsg.includes('network') ||
    rawMsg.includes('AbortError')
  ) {
    return {
      category: 'NETWORK_ERROR',
      safeReason: 'Network timeout / connection error',
    };
  }

  return {
    category: 'UNKNOWN_ERROR',
    safeReason: rawMsg.slice(0, 100) || 'Unknown lookup error',
  };
}

export interface PosterEnrichmentOptions {
  dryRun?: boolean;
  limit?: number;
  skip?: number;
  movieId?: string;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  source?: 'tmdb' | 'google' | 'all';
  targetOnly?: boolean;
  nonTargetOnly?: boolean;
  missingOnly?: boolean;
  manualOnly?: boolean;
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
  status: 'ENRICHED' | 'ALREADY_HAD_POSTER' | 'NO_POSTER_AVAILABLE' | 'FAILED' | 'SKIPPED' | 'MANUAL_REVIEW_REQUIRED';
  previousPosterAsset: string | null;
  newPosterAsset: string | null;
  rawPosterPath?: string | null;
  source?: string;
  failureCategory?: PosterFailureCategory;
  safeErrorReason?: string;
  error?: string;
}

export interface PosterEnrichmentSummaryReport {
  totalActiveMovies: number;
  totalCandidates: number;
  totalProcessed: number;
  alreadyHadPoster: number;
  successfullyEnriched: number;
  noPosterAvailable: number;
  manualReviewRequired: number;
  lookupFailures: number;
  configMissingFailures: number;
  authFailures: number;
  notFoundFailures: number;
  rateLimitedFailures: number;
  serverErrorFailures: number;
  networkFailures: number;
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
    if (!tmdbAdapter.isConfigured()) {
      throw new Error(
        'TMDB configuration missing: TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN is not set in environment'
      );
    }

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

        // For non-retryable errors (e.g. 404, auth error, config missing), break immediately
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
    options: { dryRun?: boolean; maxRetries?: number; source?: 'tmdb' | 'google' | 'all' } = {}
  ): Promise<PosterEnrichmentResult> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        tmdbId: true,
        primaryTitle: true,
        originalTitle: true,
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

    const sourceMode = options.source || 'all';

    // 1. If movie has tmdbId and source is 'tmdb' or 'all', use TMDB direct lookup
    if (movie.tmdbId && sourceMode !== 'google') {
      try {
        const details = await this.fetchTmdbDetailsWithRetry(
          movie.tmdbId,
          options.maxRetries ?? this.defaultMaxRetries
        );

        const rawPosterPath = details.poster_path?.trim() || null;
        const normalizedUrl = resolvePosterUrl(rawPosterPath);

        if (rawPosterPath && normalizedUrl) {
          // Strictly score candidate to guard against collisions (e.g. Kalki vs Dune)
          const validation = mediaIdentityValidator.scorePosterCandidate(
            {
              title: movie.primaryTitle,
              releaseYear: movie.releaseYear,
              tmdbId: movie.tmdbId,
              originalTitle: movie.originalTitle,
            },
            {
              imageUrl: normalizedUrl,
              source: 'TMDB',
              candidateTitle: details.title || movie.primaryTitle,
              candidateYear: details.release_date
                ? parseInt(details.release_date.split('-')[0], 10)
                : movie.releaseYear,
              tmdbId: details.id,
              sourceDomain: 'themoviedb.org',
            }
          );

          if (validation.isAcceptableForAutoEnrich) {
            if (!options.dryRun) {
              await prisma.movie.update({
                where: { id: movie.id },
                data: { posterAsset: normalizedUrl },
              });

              await recordPosterProvenance(movie.id, previousPosterAsset, normalizedUrl, {
                source: 'TMDB_ID_EXACT',
                verificationMethod: 'AUTOMATED_EXACT_MATCH',
                verifiedAt: new Date().toISOString(),
                notes: `Score: ${validation.score}`,
              });

              // Preserve Provenance: Upsert RawSourceRecord
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
              source: 'TMDB_ID_EXACT',
            };
          }
        }

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
      } catch (err: unknown) {
        const { category, safeReason } = classifyPosterError(err);
        return {
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.primaryTitle,
          releaseYear: movie.releaseYear,
          status: 'FAILED',
          previousPosterAsset,
          newPosterAsset: null,
          failureCategory: category,
          safeErrorReason: safeReason,
          error: safeReason,
        };
      }
    }

    // 2. TMDB Title+Year search & Multi-source discovery provider fallback
    if (sourceMode === 'all' || sourceMode === 'tmdb' || sourceMode === 'google') {
      try {
        const discovery = await posterDiscoveryProvider.discoverPoster({
          id: movie.id,
          title: movie.primaryTitle,
          releaseYear: movie.releaseYear,
          tmdbId: movie.tmdbId,
          originalTitle: movie.originalTitle,
        });

        if (discovery.status === 'VERIFIED' && discovery.posterUrl) {
          if (!options.dryRun) {
            const updateData: any = { posterAsset: discovery.posterUrl };
            if (!movie.tmdbId && discovery.candidate?.tmdbId) {
              try {
                const existing = await prisma.movie.findUnique({
                  where: { tmdbId: discovery.candidate.tmdbId },
                  select: { id: true },
                });
                if (!existing) {
                  updateData.tmdbId = discovery.candidate.tmdbId;
                }
              } catch {
                // Ignore unique check error
              }
            }

            await prisma.movie.update({
              where: { id: movie.id },
              data: updateData,
            });

            await recordPosterProvenance(movie.id, previousPosterAsset, discovery.posterUrl, {
              source: discovery.source as any,
              verificationMethod: 'DISCOVERY_PROVIDER_MATCH',
              verifiedAt: new Date().toISOString(),
              notes: discovery.notes,
            });
          }

          return {
            movieId: movie.id,
            tmdbId: movie.tmdbId ?? 0,
            title: movie.primaryTitle,
            releaseYear: movie.releaseYear,
            status: 'ENRICHED',
            previousPosterAsset,
            newPosterAsset: discovery.posterUrl,
            source: discovery.source,
          };
        }

        if (discovery.status === 'MANUAL_REVIEW_REQUIRED') {
          return {
            movieId: movie.id,
            tmdbId: movie.tmdbId ?? 0,
            title: movie.primaryTitle,
            releaseYear: movie.releaseYear,
            status: 'MANUAL_REVIEW_REQUIRED',
            previousPosterAsset,
            newPosterAsset: null,
            error: discovery.notes || 'Routed to manual review queue',
          };
        }
      } catch (err: any) {
        // Discovery error
      }
    }

    return {
      movieId: movie.id,
      tmdbId: movie.tmdbId ?? 0,
      title: movie.primaryTitle,
      releaseYear: movie.releaseYear,
      status: 'NO_POSTER_AVAILABLE',
      previousPosterAsset,
      newPosterAsset: null,
      error: 'No verified poster found across available sources',
    };
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
      OR: [
        { posterAsset: null },
        { posterAsset: '' },
        { posterAsset: 'null' },
        { posterAsset: 'undefined' },
      ],
    };

    if (options.targetOnly) {
      candidateWhere.eligibility = { playableAsTarget: true };
    } else if (options.nonTargetOnly) {
      candidateWhere.eligibility = { playableAsTarget: false };
    }

    if (options.movieId) {
      candidateWhere.id = options.movieId;
    }

    const candidates = await prisma.movie.findMany({
      where: candidateWhere,
      skip: options.skip,
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
    let manualReviewRequired = 0;
    let lookupFailures = 0;
    let configMissingFailures = 0;
    let authFailures = 0;
    let notFoundFailures = 0;
    let rateLimitedFailures = 0;
    let serverErrorFailures = 0;
    let networkFailures = 0;
    let alreadyHadPoster = 0;

    // Process in chunks with bounded concurrency
    for (let i = 0; i < candidates.length; i += concurrency) {
      const chunk = candidates.slice(i, i + concurrency);

      const chunkResults = await Promise.all(
        chunk.map(async (cand) => {
          const res = await this.enrichMoviePoster(cand.id, {
            dryRun: options.dryRun,
            maxRetries: options.maxRetries,
            source: options.source,
          });

          processed++;
          if (res.status === 'ENRICHED') successfullyEnriched++;
          else if (res.status === 'NO_POSTER_AVAILABLE') noPosterAvailable++;
          else if (res.status === 'MANUAL_REVIEW_REQUIRED') manualReviewRequired++;
          else if (res.status === 'ALREADY_HAD_POSTER') alreadyHadPoster++;
          else if (res.status === 'FAILED') {
            lookupFailures++;
            if (res.failureCategory === 'CONFIG_MISSING') configMissingFailures++;
            else if (res.failureCategory === 'AUTH_ERROR') authFailures++;
            else if (res.failureCategory === 'NOT_FOUND_404') notFoundFailures++;
            else if (res.failureCategory === 'RATE_LIMITED_429') rateLimitedFailures++;
            else if (res.failureCategory === 'SERVER_ERROR_5XX') serverErrorFailures++;
            else if (res.failureCategory === 'NETWORK_ERROR') networkFailures++;
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
      manualReviewRequired,
      lookupFailures,
      configMissingFailures,
      authFailures,
      notFoundFailures,
      rateLimitedFailures,
      serverErrorFailures,
      networkFailures,
      remainingCandidates: Math.max(0, remainingCandidates),
      results,
    };
  }
}

export const posterEnrichmentService = new PosterEnrichmentService();
