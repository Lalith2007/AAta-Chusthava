import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { resolvePosterUrl } from '@/lib/poster-utils';

export interface PersonEnrichmentOptions {
  dryRun?: boolean;
  limit?: number;
  personId?: string;
  targetOnly?: boolean;
  concurrency?: number;
  onProgress?: (progress: {
    processed: number;
    total: number;
    successfullyEnriched: number;
    noImageAvailable: number;
    failures: number;
    currentPersonName: string;
  }) => void;
}

export interface PersonEnrichmentResult {
  personId: string;
  tmdbId: number;
  name: string;
  status: 'ENRICHED' | 'ALREADY_HAD_IMAGE' | 'NO_IMAGE_AVAILABLE' | 'FAILED' | 'SKIPPED';
  previousImage: string | null;
  newImage: string | null;
  rawProfilePath?: string | null;
  error?: string;
}

export interface PersonEnrichmentSummaryReport {
  totalPersons: number;
  totalCandidates: number;
  totalProcessed: number;
  alreadyHadImage: number;
  successfullyEnriched: number;
  noImageAvailable: number;
  lookupFailures: number;
  remainingCandidates: number;
  results: PersonEnrichmentResult[];
}

export interface PersonAuditStats {
  totalPersons: number;
  personsInActiveMovies: number;
  personsInTargetPlayable: number;
  withImage: number;
  withoutImage: number;
  withTmdbId: number;
  withoutTmdbId: number;
  leadCastCount: number;
  leadCastWithImage: number;
  directorsCount: number;
  directorsWithImage: number;
  enrichmentCandidates: number;
}

export class PersonEnrichmentService {
  private defaultConcurrency = 5;

  /**
   * Enriches a single person's profile image safely and idempotently
   */
  async enrichPersonImage(
    personId: string,
    options: { dryRun?: boolean } = {}
  ): Promise<PersonEnrichmentResult> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        id: true,
        canonicalName: true,
        tmdbId: true,
        image: true,
      },
    });

    if (!person) {
      throw new Error(`Person with ID ${personId} not found.`);
    }

    const previousImage = person.image?.trim() || null;

    // Idempotency: Do not overwrite an already valid image
    if (previousImage && resolvePosterUrl(previousImage)) {
      return {
        personId: person.id,
        tmdbId: person.tmdbId ?? 0,
        name: person.canonicalName,
        status: 'ALREADY_HAD_IMAGE',
        previousImage,
        newImage: previousImage,
      };
    }

    if (!person.tmdbId) {
      return {
        personId: person.id,
        tmdbId: 0,
        name: person.canonicalName,
        status: 'SKIPPED',
        previousImage: null,
        newImage: null,
        error: 'Person has no TMDB ID',
      };
    }

    try {
      const details = tmdbAdapter.getPersonDetails
        ? await tmdbAdapter.getPersonDetails(person.tmdbId)
        : null;

      const rawProfilePath = details?.profile_path?.trim() || null;
      const normalizedUrl = resolvePosterUrl(rawProfilePath, 'w185');

      if (rawProfilePath && normalizedUrl) {
        if (!options.dryRun) {
          await prisma.person.update({
            where: { id: person.id },
            data: { image: normalizedUrl },
          });
        }

        return {
          personId: person.id,
          tmdbId: person.tmdbId,
          name: person.canonicalName,
          status: 'ENRICHED',
          previousImage,
          newImage: normalizedUrl,
          rawProfilePath,
        };
      } else {
        return {
          personId: person.id,
          tmdbId: person.tmdbId,
          name: person.canonicalName,
          status: 'NO_IMAGE_AVAILABLE',
          previousImage,
          newImage: null,
          rawProfilePath,
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err || 'Unknown error');
      return {
        personId: person.id,
        tmdbId: person.tmdbId,
        name: person.canonicalName,
        status: 'FAILED',
        previousImage,
        newImage: null,
        error: errMsg.slice(0, 100),
      };
    }
  }

  /**
   * Executes bounded concurrent person image enrichment
   */
  async enrichAllMissingPersonImages(
    options: PersonEnrichmentOptions = {}
  ): Promise<PersonEnrichmentSummaryReport> {
    const totalPersons = await prisma.person.count();

    const candidateWhere: any = {
      tmdbId: { not: null },
      OR: [
        { image: null },
        { image: '' },
        { image: 'null' },
        { image: 'undefined' },
      ],
    };

    if (options.personId) {
      candidateWhere.id = options.personId;
    }

    if (options.targetOnly) {
      // Limit to persons referenced in target-eligible movies
      candidateWhere.movies = {
        some: {
          movie: {
            lifecycleStatus: 'ACTIVE',
            eligibility: { playableAsTarget: true },
          },
        },
      };
    }

    const candidates = await prisma.person.findMany({
      where: candidateWhere,
      take: options.limit,
      orderBy: { canonicalName: 'asc' },
      select: { id: true, canonicalName: true, tmdbId: true },
    });

    const totalCandidates = candidates.length;
    const concurrency = Math.max(1, options.concurrency ?? this.defaultConcurrency);
    const results: PersonEnrichmentResult[] = [];

    let processed = 0;
    let successfullyEnriched = 0;
    let noImageAvailable = 0;
    let lookupFailures = 0;
    let alreadyHadImage = 0;

    for (let i = 0; i < candidates.length; i += concurrency) {
      const chunk = candidates.slice(i, i + concurrency);

      const chunkResults = await Promise.all(
        chunk.map(async (cand) => {
          const res = await this.enrichPersonImage(cand.id, {
            dryRun: options.dryRun,
          });

          processed++;
          if (res.status === 'ENRICHED') successfullyEnriched++;
          else if (res.status === 'NO_IMAGE_AVAILABLE') noImageAvailable++;
          else if (res.status === 'ALREADY_HAD_IMAGE') alreadyHadImage++;
          else if (res.status === 'FAILED') lookupFailures++;

          if (options.onProgress) {
            options.onProgress({
              processed,
              total: totalCandidates,
              successfullyEnriched,
              noImageAvailable,
              failures: lookupFailures,
              currentPersonName: cand.canonicalName,
            });
          }

          return res;
        })
      );

      results.push(...chunkResults);

      if (i + concurrency < candidates.length && !options.dryRun) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const remainingCandidates = totalCandidates - successfullyEnriched - alreadyHadImage;

    return {
      totalPersons,
      totalCandidates,
      totalProcessed: processed,
      alreadyHadImage,
      successfullyEnriched,
      noImageAvailable,
      lookupFailures,
      remainingCandidates: Math.max(0, remainingCandidates),
      results,
    };
  }

  /**
   * Complete audit of Person records and coverage
   */
  async auditPersons(): Promise<PersonAuditStats> {
    const totalPersons = await prisma.person.count();

    const withImage = await prisma.person.count({
      where: {
        image: { not: null },
        NOT: [{ image: '' }, { image: 'null' }, { image: 'undefined' }],
      },
    });

    const withTmdbId = await prisma.person.count({
      where: { tmdbId: { not: null } },
    });

    // Persons in active movies
    const personsInActiveMovies = await prisma.person.count({
      where: {
        movies: {
          some: {
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    // Persons in target playable movies
    const personsInTargetPlayable = await prisma.person.count({
      where: {
        movies: {
          some: {
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    // Lead Cast counts
    const leadCastCount = await prisma.person.count({
      where: {
        movies: {
          some: {
            roleType: 'LEAD',
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    const leadCastWithImage = await prisma.person.count({
      where: {
        image: { not: null },
        NOT: [{ image: '' }, { image: 'null' }],
        movies: {
          some: {
            roleType: 'LEAD',
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    // Directors counts
    const directorsCount = await prisma.person.count({
      where: {
        movies: {
          some: {
            roleType: 'DIRECTOR',
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    const directorsWithImage = await prisma.person.count({
      where: {
        image: { not: null },
        NOT: [{ image: '' }, { image: 'null' }],
        movies: {
          some: {
            roleType: 'DIRECTOR',
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    // Enrichment candidates
    const enrichmentCandidates = await prisma.person.count({
      where: {
        tmdbId: { not: null },
        OR: [{ image: null }, { image: '' }],
        movies: {
          some: {
            movie: { lifecycleStatus: 'ACTIVE' },
          },
        },
      },
    });

    return {
      totalPersons,
      personsInActiveMovies,
      personsInTargetPlayable,
      withImage,
      withoutImage: totalPersons - withImage,
      withTmdbId,
      withoutTmdbId: totalPersons - withTmdbId,
      leadCastCount,
      leadCastWithImage,
      directorsCount,
      directorsWithImage,
      enrichmentCandidates,
    };
  }
}

export const personEnrichmentService = new PersonEnrichmentService();
