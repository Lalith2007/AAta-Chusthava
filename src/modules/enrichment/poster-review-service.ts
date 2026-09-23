import { prisma } from '@/infrastructure/db/client';
import { resolvePosterUrl } from '@/lib/poster-utils';
import { recordPosterProvenance } from '@/lib/poster-provenance';

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
   * Retrieves paginated movies requiring manual poster review
   */
  async getPosterReviewQueue(options: {
    page?: number;
    pageSize?: number;
    search?: string;
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

      return {
        id: m.id,
        title: m.primaryTitle,
        releaseYear: m.releaseYear,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
        languages: m.supportedLanguages,
        currentPosterAsset: m.posterAsset,
        candidatePosterUrl: null,
        candidateSource: m.tmdbId ? 'TMDB_PENDING_REVIEW' : 'NONE',
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
   * Approves a candidate poster and updates the movie
   */
  async approvePosterCandidate(
    movieId: string,
    posterUrl: string,
    adminId: string
  ): Promise<{ success: boolean; normalizedUrl: string }> {
    const normalizedUrl = resolvePosterUrl(posterUrl);
    if (!normalizedUrl) {
      throw new Error('Invalid poster URL candidate provided.');
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, posterAsset: true },
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found.`);
    }

    await prisma.movie.update({
      where: { id: movieId },
      data: { posterAsset: normalizedUrl },
    });

    await recordPosterProvenance(movieId, movie.posterAsset, normalizedUrl, {
      source: 'MANUAL_ADMIN',
      verificationMethod: 'ADMIN_APPROVAL',
      verifiedAt: new Date().toISOString(),
      adminId,
    });

    return { success: true, normalizedUrl };
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
    return this.approvePosterCandidate(movieId, url, adminId);
  }
}

export const posterReviewService = new PosterReviewService();
