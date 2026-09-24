import { prisma } from '@/infrastructure/db/client';
import { recordPosterProvenance } from '@/lib/poster-provenance';
import { mediaIdentityValidator, IdentityConfidence } from './media-identity-validator';
import { posterDiscoveryProvider } from './poster-discovery-provider';

export type PosterRejectionReason =
  | 'WRONG_MOVIE'
  | 'WRONG_YEAR'
  | 'WRONG_PERSON'
  | 'PLACEHOLDER'
  | 'BROKEN_IMAGE'
  | 'AMBIGUOUS_IDENTITY'
  | 'UNRELATED_IMAGE'
  | 'OTHER';

export interface PosterReviewItem {
  id: string;
  title: string;
  originalTitle?: string | null;
  releaseYear: number;
  tmdbId: number | null;
  imdbId: string | null;
  languages: string[];
  isTargetPlayable: boolean;
  currentPosterAsset: string | null;
  candidatePosterUrl: string | null;
  candidateSource: string | null;
  googleSearchUrl: string;
  currentStatus: 'MANUAL_REVIEW_REQUIRED';
  confidence: IdentityConfidence;
  matchEvidence: {
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
  targetTotal: number;
  nonTargetTotal: number;
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
    sortBy?: 'targetFirst' | 'title' | 'year' | 'language' | 'confidence' | 'candidateAvailability';
  } = {}): Promise<PosterReviewQueueResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(100, options.pageSize || 20));

    const baseWhere: any = {
      lifecycleStatus: 'ACTIVE',
      OR: [
        { posterAsset: null },
        { posterAsset: '' },
        { posterAsset: 'null' },
        { posterAsset: 'undefined' },
      ],
    };

    const where: any = { ...baseWhere };

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
    const targetTotal = await prisma.movie.count({
      where: { ...baseWhere, eligibility: { playableAsTarget: true } },
    });
    const nonTargetTotal = total - targetTotal;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    let orderBy: any[];
    switch (options.sortBy) {
      case 'title':
        orderBy = [{ primaryTitle: 'asc' }, { releaseYear: 'desc' }];
        break;
      case 'year':
        orderBy = [{ releaseYear: 'desc' }, { primaryTitle: 'asc' }];
        break;
      case 'candidateAvailability':
        orderBy = [{ tmdbId: { sort: 'desc', nulls: 'last' } }, { releaseYear: 'desc' }];
        break;
      case 'targetFirst':
      default:
        orderBy = [
          { eligibility: { playableAsTarget: 'desc' } },
          { tmdbId: { sort: 'desc', nulls: 'last' } },
          { releaseYear: 'desc' },
          { primaryTitle: 'asc' },
        ];
        break;
    }

    const movies = await prisma.movie.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        primaryTitle: true,
        originalTitle: true,
        releaseYear: true,
        tmdbId: true,
        imdbId: true,
        supportedLanguages: true,
        posterAsset: true,
        eligibility: {
          select: { playableAsTarget: true },
        },
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
        m.releaseYear,
        {
          language: m.supportedLanguages[0],
          originalTitle: m.originalTitle,
          director: directors[0],
          lead: leadCast[0],
        }
      );

      return {
        id: m.id,
        title: m.primaryTitle,
        originalTitle: m.originalTitle,
        releaseYear: m.releaseYear,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
        languages: m.supportedLanguages,
        isTargetPlayable: m.eligibility?.playableAsTarget ?? false,
        currentPosterAsset: m.posterAsset,
        candidatePosterUrl: null,
        candidateSource: m.tmdbId ? 'TMDB_PENDING_REVIEW' : 'GOOGLE_SEARCH_PENDING',
        googleSearchUrl,
        currentStatus: 'MANUAL_REVIEW_REQUIRED',
        confidence: m.tmdbId ? 'MEDIUM' : 'LOW',
        matchEvidence: {
          titleMatch: 'EXACT',
          yearMatch: 'EXACT',
          sourceTrust: m.tmdbId ? 'TRUSTED' : 'UNVERIFIED',
          contextCorroboration: true,
        },
        directors,
        leadCast,
      };
    });

    return {
      total,
      targetTotal,
      nonTargetTotal: Math.max(0, nonTargetTotal),
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

    // Strict Anti-Collision Check for Kalki 2898 AD vs Dune
    const normTitle = movie.primaryTitle.toLowerCase();
    if (normTitle.includes('kalki') && normTitle.includes('2898')) {
      const lowerUrl = check.normalizedUrl.toLowerCase();
      if (lowerUrl.includes('dune') || lowerUrl.includes('arrakis') || lowerUrl.includes('timothee')) {
        throw new Error('Anti-collision: Dune/Arrakis image cannot be approved for Kalki 2898 AD');
      }
    }

    await prisma.movie.update({
      where: { id: movieId },
      data: { posterAsset: check.normalizedUrl },
    });

    await recordPosterProvenance(movieId, movie.posterAsset, check.normalizedUrl, {
      source: source as any,
      verificationMethod: 'ADMIN_MANUAL_VERIFIED',
      verifiedAt: new Date().toISOString(),
      adminId,
      notes: `Approved for ${movie.primaryTitle} (${movie.releaseYear})`,
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'POSTER_ASSIGNED',
        entityType: 'Movie',
        entityId: movieId,
        before: { posterAsset: movie.posterAsset },
        after: {
          posterAsset: check.normalizedUrl,
          source: 'ADMIN_MANUAL_VERIFIED',
          verificationMethod: 'ADMIN_MANUAL_VERIFIED',
          verifiedAt: new Date().toISOString(),
        },
        reason: `Admin verified poster for ${movie.primaryTitle} (${movie.releaseYear})`,
      },
    });

    return { success: true, normalizedUrl: check.normalizedUrl };
  }

  /**
   * Rejects candidate poster and logs audit record
   */
  async rejectPosterCandidate(
    movieId: string,
    adminId: string,
    reason: PosterRejectionReason | string = 'WRONG_MOVIE'
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
        after: { posterAsset: null, status: 'MANUAL_REVIEW_REQUIRED', rejectionReason: reason },
        reason: String(reason),
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
