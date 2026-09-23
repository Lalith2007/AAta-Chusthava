import { prisma } from '@/infrastructure/db/client';
import { recordPosterProvenance } from '@/lib/poster-provenance';
import { mediaIdentityValidator, IdentityConfidence, PosterCandidate, PosterValidationResult } from './media-identity-validator';
import { posterDiscoveryProvider } from './poster-discovery-provider';

export interface PosterReviewItem {
  id: string;
  title: string;
  releaseYear: number;
  tmdbId: number | null;
  imdbId: string | null;
  languages: string[];
  currentPosterAsset: string | null;
  candidatePosterUrl: string | null;
  candidateSource: string | null;
  googleSearchUrl: string;
  confidence?: IdentityConfidence;
  matchEvidence?: {
    titleMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH';
    yearMatch: 'EXACT' | 'NEAR' | 'MISMATCH' | 'UNKNOWN';
    sourceTrust: 'TRUSTED' | 'MODERATE' | 'UNVERIFIED';
    contextCorroboration: boolean;
  };
  directors: string[];
  leadCast: string[];
}

export interface PosterReviewQueueResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PosterReviewItem[];
}

export class PosterReviewService {
  /**
   * Retrieves paginated movies requiring manual poster review with exact Google search links
   */
  async getPosterReviewQueue(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    targetOnly?: boolean;
  } = {}): Promise<PosterReviewQueueResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(100, options.pageSize || 20));

    const where: any = {
      lifecycleStatus: 'ACTIVE',
      OR: [
        { posterAsset: null },
        { posterAsset: '' },
        { posterAsset: 'null' },
        { posterAsset: 'undefined' },
      ],
    };

    if (options.search) {
      where.primaryTitle = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options.targetOnly) {
      where.eligibility = { playableAsTarget: true };
    }

    const total = await prisma.movie.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const movies = await prisma.movie.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ releaseYear: 'desc' }, { primaryTitle: 'asc' }],
      select: {
        id: true,
        primaryTitle: true,
        releaseYear: true,
        tmdbId: true,
        imdbId: true,
        supportedLanguages: true,
        posterAsset: true,
        people: {
          where: {
            roleType: { in: ['DIRECTOR', 'LEAD'] },
          },
          select: {
            roleType: true,
            person: {
              select: {
                canonicalName: true,
              },
            },
          },
        },
      },
    });

    const items: PosterReviewItem[] = movies.map((m) => {
      const directors = m.people
        .filter((p) => p.roleType === 'DIRECTOR')
        .map((p) => p.person.canonicalName);
      const leadCast = m.people
        .filter((p) => p.roleType === 'LEAD')
        .map((p) => p.person.canonicalName);

      const googleSearchUrl = mediaIdentityValidator.buildMovieGoogleSearchUrl(
        m.primaryTitle,
        m.releaseYear
      );

      return {
        id: m.id,
        title: m.primaryTitle,
        releaseYear: m.releaseYear,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
        languages: m.supportedLanguages,
        currentPosterAsset: m.posterAsset,
        candidatePosterUrl: null,
        candidateSource: m.tmdbId ? 'TMDB_PENDING_REVIEW' : 'GOOGLE_SEARCH_PENDING',
        googleSearchUrl,
        confidence: m.tmdbId ? 'MEDIUM' : 'LOW',
        directors,
        leadCast,
      };
    });

    return {
      total,
      page,
      pageSize,
      totalPages,
      items,
    };
  }

  /**
   * Approves a candidate poster and updates the movie with strict URL health check & provenance
   */
  async approvePosterCandidate(
    movieId: string,
    posterUrl: string,
    adminId: string,
    source: 'ADMIN_MANUAL_VERIFIED' | 'TMDB_ID_MATCH' | 'TMDB_TITLE_YEAR_MATCH' | 'GOOGLE_TITLE_YEAR_VERIFIED' = 'ADMIN_MANUAL_VERIFIED'
  ): Promise<{ success: boolean; normalizedUrl: string }> {
    const check = mediaIdentityValidator.validateImageUrl(posterUrl);
    if (!check.isValid || !check.normalizedUrl) {
      throw new Error(`Invalid poster candidate URL: ${check.reason || 'Failed validation'}`);
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, posterAsset: true, primaryTitle: true, releaseYear: true },
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found.`);
    }

    await prisma.movie.update({
      where: { id: movieId },
      data: { posterAsset: check.normalizedUrl },
    });

    await recordPosterProvenance(movieId, movie.posterAsset, check.normalizedUrl, {
      source: source as any,
      verificationMethod: 'ADMIN_APPROVAL',
      verifiedAt: new Date().toISOString(),
      adminId,
      notes: `Approved for ${movie.primaryTitle} (${movie.releaseYear})`,
    });

    return { success: true, normalizedUrl: check.normalizedUrl };
  }

  /**
   * Rejects candidate poster and logs audit record
   */
  async rejectPosterCandidate(
    movieId: string,
    adminId: string,
    reason = 'Admin rejected candidate poster'
  ): Promise<{ success: boolean }> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, posterAsset: true },
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found.`);
    }

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'POSTER_REJECTED',
        entityType: 'Movie',
        entityId: movieId,
        before: { posterAsset: movie.posterAsset },
        after: { posterAsset: null, status: 'EXPLICITLY_UNRESOLVED' },
        reason,
      },
    });

    return { success: true };
  }

  /**
   * Manually enters and validates a poster URL for a movie
   */
  async submitManualPosterUrl(
    movieId: string,
    url: string,
    adminId: string
  ): Promise<{ success: boolean; normalizedUrl: string }> {
    return this.approvePosterCandidate(movieId, url, adminId, 'ADMIN_MANUAL_VERIFIED');
  }

  /**
   * Runs multi-source discovery for a single movie candidate
   */
  async discoverCandidate(movieId: string) {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        primaryTitle: true,
        releaseYear: true,
        tmdbId: true,
        originalTitle: true,
      },
    });

    if (!movie) throw new Error(`Movie with ID ${movieId} not found.`);

    return posterDiscoveryProvider.discoverPoster({
      id: movie.id,
      title: movie.primaryTitle,
      releaseYear: movie.releaseYear,
      tmdbId: movie.tmdbId,
      originalTitle: movie.originalTitle,
    });
  }
}

export const posterReviewService = new PosterReviewService();
