import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { resolvePosterUrl } from '@/lib/poster-utils';
import { mediaIdentityValidator } from './media-identity-validator';

export interface PersonEnrichmentOptions {
  dryRun?: boolean;
  limit?: number;
  skip?: number;
  personId?: string;
  targetOnly?: boolean;
  roles?: ('DIRECTOR' | 'LEAD')[];
  concurrency?: number;
  recoverIdentity?: boolean;
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
  playerVisibleTotal: number;
  playerVisibleWithImage: number;
  playerVisibleWithoutImage: number;
  playerVisibleManualReview: number;
  withImage: number;
  withoutImage: number;
  withTmdbId: number;
  withoutTmdbId: number;
  leadCastCount: number;
  leadCastWithImage: number;
  directorsCount: number;
  directorsWithImage: number;
  supportingCastCount: number;
  supportingCastWithImage: number;
  enrichmentCandidates: number;
}

export class PersonEnrichmentService {
  private defaultConcurrency = 5;

  /**
   * Enriches a single person's profile image safely and idempotently with identity recovery
   */
  async enrichPersonImage(
    personId: string,
    options: { dryRun?: boolean; recoverIdentity?: boolean } = {}
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

    // 1. If person has no TMDB ID and identity recovery is not enabled, return SKIPPED
    if (!person.tmdbId && !options.recoverIdentity) {
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

    let directProfileChecked = false;

    // 2. Direct TMDB ID lookup if present
    if (person.tmdbId) {
      try {
        const details = tmdbAdapter.getPersonDetails
          ? await tmdbAdapter.getPersonDetails(person.tmdbId)
          : null;

        if (details) {
          directProfileChecked = true;
          const rawProfilePath = details.profile_path?.trim() || null;
          const normalizedUrl = resolvePosterUrl(rawProfilePath, 'w185');
          const urlCheck = mediaIdentityValidator.validateImageUrl(normalizedUrl);

          if (rawProfilePath && normalizedUrl && urlCheck.isValid) {
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
              error: urlCheck.reason || 'No profile image available on TMDB',
            };
          }
        }
      } catch {
        // Fall through to identity recovery if allowed
      }
    }

    // 3. Identity Recovery via TMDB search if person has no TMDB ID or lookup was unresolvable
    if (!directProfileChecked && options.recoverIdentity) {
      try {
        const personData = await prisma.person.findUnique({
          where: { id: personId },
          select: {
            movies: {
              select: {
                roleType: true,
                movie: {
                  select: {
                    primaryTitle: true,
                    releaseYear: true,
                    originalTitle: true,
                  },
                },
              },
            },
          },
        });

        const knownMovies = (personData?.movies || []).map((m) => ({
          title: m.movie.primaryTitle,
          year: m.movie.releaseYear,
          originalTitle: m.movie.originalTitle,
          roleType: m.roleType,
        }));

        const searchRes = await tmdbAdapter.searchPerson(person.canonicalName);
        const candidates = searchRes?.results || [];

        let matchedCandidate: any = null;
        let matchCount = 0;

        for (const cand of candidates) {
          const candContext = [
            cand.name,
            cand.known_for_department,
            ...(cand.known_for || []).map((k: any) => `${k.title || k.name || ''} ${k.original_title || ''}`),
          ]
            .join(' ')
            .toLowerCase();

          const hasFilmOverlap = knownMovies.some((km) => {
            const t = km.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const ot = (km.originalTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const candNorm = candContext.replace(/[^a-z0-9]/g, '');
            return (t.length > 3 && candNorm.includes(t)) || (ot.length > 3 && candNorm.includes(ot));
          });

          const isSoloExact =
            candidates.length === 1 &&
            cand.name.toLowerCase().trim() === person.canonicalName.toLowerCase().trim();

          if (hasFilmOverlap || isSoloExact) {
            matchedCandidate = cand;
            matchCount++;
          }
        }

        // Anti-collision guard: reject ambiguous multiple matches
        if (matchCount === 1 && matchedCandidate) {
          const rawProfilePath = matchedCandidate.profile_path?.trim() || null;
          const normalizedUrl = resolvePosterUrl(rawProfilePath, 'w185');
          const urlCheck = mediaIdentityValidator.validateImageUrl(normalizedUrl);

          if (!options.dryRun) {
            // Check if another person record holds this tmdbId to avoid Prisma unique conflict
            const collision = await prisma.person.findUnique({
              where: { tmdbId: matchedCandidate.id },
              select: { id: true },
            });

            const updateData: any = {};
            if (!collision || collision.id === person.id) {
              updateData.tmdbId = matchedCandidate.id;
            }
            if (rawProfilePath && normalizedUrl && urlCheck.isValid) {
              updateData.image = normalizedUrl;
            }

            if (Object.keys(updateData).length > 0) {
              try {
                await prisma.person.update({
                  where: { id: person.id },
                  data: updateData,
                });
              } catch {
                if (updateData.image) {
                  try {
                    await prisma.person.update({
                      where: { id: person.id },
                      data: { image: updateData.image },
                    });
                  } catch {
                    // Ignore secondary update error
                  }
                }
              }
            }
          }

          if (rawProfilePath && normalizedUrl && urlCheck.isValid) {
            return {
              personId: person.id,
              tmdbId: matchedCandidate.id,
              name: person.canonicalName,
              status: 'ENRICHED',
              previousImage,
              newImage: normalizedUrl,
              rawProfilePath,
            };
          } else {
            return {
              personId: person.id,
              tmdbId: matchedCandidate.id,
              name: person.canonicalName,
              status: 'NO_IMAGE_AVAILABLE',
              previousImage,
              newImage: null,
              rawProfilePath,
              error: 'Identity recovered but TMDB profile has no image',
            };
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err || 'Unknown error');
        return {
          personId: person.id,
          tmdbId: person.tmdbId ?? 0,
          name: person.canonicalName,
          status: 'FAILED',
          previousImage,
          newImage: null,
          error: errMsg.slice(0, 100),
        };
      }
    }

    return {
      personId: person.id,
      tmdbId: person.tmdbId ?? 0,
      name: person.canonicalName,
      status: 'NO_IMAGE_AVAILABLE',
      previousImage: null,
      newImage: null,
      error: 'No verified profile image found on TMDB',
    };
  }

  /**
   * Executes bounded concurrent person image enrichment
   */
  async enrichAllMissingPersonImages(
    options: PersonEnrichmentOptions = {}
  ): Promise<PersonEnrichmentSummaryReport> {
    const totalPersons = await prisma.person.count();

    const candidateWhere: any = {
      OR: [
        { image: null },
        { image: '' },
        { image: 'null' },
        { image: 'undefined' },
      ],
    };

    if (options.recoverIdentity === false) {
      candidateWhere.tmdbId = { not: null };
    }

    if (options.personId) {
      candidateWhere.id = options.personId;
    }

    if (options.roles && options.roles.length > 0) {
      candidateWhere.movies = {
        some: {
          roleType: { in: options.roles },
          ...(options.targetOnly
            ? {
                movie: {
                  lifecycleStatus: 'ACTIVE',
                  eligibility: { playableAsTarget: true },
                },
              }
            : {}),
        },
      };
    } else if (options.targetOnly) {
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
      skip: options.skip,
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
            recoverIdentity: options.recoverIdentity,
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

    // Supporting Cast counts (visible in CastTile)
    const supportingCastCount = await prisma.person.count({
      where: {
        movies: {
          some: {
            roleType: 'SUPPORTING',
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    const supportingCastWithImage = await prisma.person.count({
      where: {
        image: { not: null },
        NOT: [{ image: '' }, { image: 'null' }, { image: 'undefined' }],
        movies: {
          some: {
            roleType: 'SUPPORTING',
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    // Player-Visible Person Total (LEAD, DIRECTOR, SUPPORTING in Target-Playable Movies)
    const playerVisibleTotal = await prisma.person.count({
      where: {
        movies: {
          some: {
            roleType: { in: ['LEAD', 'DIRECTOR', 'SUPPORTING'] },
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    const playerVisibleWithImage = await prisma.person.count({
      where: {
        image: { not: null },
        NOT: [{ image: '' }, { image: 'null' }, { image: 'undefined' }],
        movies: {
          some: {
            roleType: { in: ['LEAD', 'DIRECTOR', 'SUPPORTING'] },
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    const playerVisibleWithoutImage = playerVisibleTotal - playerVisibleWithImage;

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
      playerVisibleTotal,
      playerVisibleWithImage,
      playerVisibleWithoutImage,
      playerVisibleManualReview: playerVisibleWithoutImage,
      withImage,
      withoutImage: totalPersons - withImage,
      withTmdbId,
      withoutTmdbId: totalPersons - withTmdbId,
      leadCastCount,
      leadCastWithImage,
      directorsCount,
      directorsWithImage,
      supportingCastCount,
      supportingCastWithImage,
      enrichmentCandidates,
    };
  }
}

export const personEnrichmentService = new PersonEnrichmentService();
