import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter, MovieDataSource, TmdbMovieDetails, TmdbCredits } from '@/infrastructure/external-sources/tmdb-adapter';
import { wikidataDiscoveryAdapter, WikidataMovieRecord } from '@/infrastructure/external-sources/wikidata-adapter';
import { DiscoverySourceRegistry } from '@/infrastructure/external-sources/discovery-source';
import { MovieLanguage, MovieIndustry, RoleType, RelationType, ProductionHouseRole } from '@/domain/movie/types';
import { queueService } from '@/infrastructure/queue/queue-service';

export interface IngestionResult {
  candidateId: string;
  movieId?: string;
  status: 'PROCESSED' | 'REVIEW_REQUIRED' | 'SKIPPED' | 'FAILED';
  title: string;
  reason?: string;
  isNewCanonicalMovie?: boolean;
  isDuplicate?: boolean;
}

export interface HistoricalExpansionOptions {
  startYear?: number;
  endYear?: number;
  sources?: string[];
  languages?: Array<'te' | 'hi'>;
  resume?: boolean;
  onProgress?: (progress: {
    year: number;
    source: string;
    language: string;
    stage: 'DISCOVERING' | 'INGESTING' | 'CHECKPOINT';
    discovered: number;
    processed: number;
    newMoviesCreated: number;
    duplicatesMerged: number;
    message?: string;
  }) => void;
}

export interface YearLanguageSourceStat {
  year: number;
  source: string;
  language: string;
  discovered: number;
  alreadyKnown: number;
  newCandidates: number;
  duplicates: number;
  enrichedSuccess: number;
  enrichedFailed: number;
  validationPass: number;
  validationReview: number;
  validationRejected: number;
  newCanonicalMovies: number;
}

export interface HistoricalExpansionReport {
  startYear: number;
  endYear: number;
  sources: string[];
  languages: string[];
  previousCanonicalCount: number;
  newCanonicalMoviesAdded: number;
  currentCanonicalCount: number;
  totalDiscovered: number;
  totalProcessed: number;
  totalDuplicatesMerged: number;
  totalReviewRequired: number;
  totalFailed: number;
  stats: YearLanguageSourceStat[];
  checkpointsSaved: number;
  durationMs: number;
}

export class IngestionService {
  constructor(private sourceAdapter: MovieDataSource = tmdbAdapter) {}

  private mapLanguage(code: string): MovieLanguage {
    switch (code?.toLowerCase()) {
      case 'te':
        return 'TELUGU';
      case 'hi':
        return 'HINDI';
      case 'ta':
        return 'TAMIL';
      case 'ml':
        return 'MALAYALAM';
      case 'kn':
        return 'KANNADA';
      default:
        return 'OTHER';
    }
  }

  private mapIndustry(lang: MovieLanguage): MovieIndustry {
    switch (lang) {
      case 'TELUGU':
        return 'TOLLYWOOD';
      case 'HINDI':
        return 'BOLLYWOOD';
      case 'TAMIL':
        return 'KOLLYWOOD';
      case 'MALAYALAM':
        return 'MOLLYWOOD';
      case 'KANNADA':
        return 'SANDALWOOD';
      default:
        return 'OTHER';
    }
  }

  private slugify(title: string, year: number): string {
    const clean = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');
    return `${clean}-${year}`;
  }

  async discoverYear(
    languageCode: 'te' | 'hi',
    year: number,
    page = 1
  ): Promise<{ discovered: number; totalPages: number }> {
    const res = await this.sourceAdapter.discoverMovies(languageCode, year, page);

    let discoveredCount = 0;
    for (const item of res.results) {
      const candidate = await prisma.ingestionCandidate.upsert({
        where: {
          source_sourceMovieId: {
            source: 'TMDB',
            sourceMovieId: item.sourceMovieId,
          },
        },
        create: {
          source: 'TMDB',
          sourceMovieId: item.sourceMovieId,
          discoveryReason: `Discovery ${languageCode.toUpperCase()} ${year} p${page}`,
          status: 'DISCOVERED',
        },
        update: {},
      });
      if (candidate.status === 'DISCOVERED') {
        discoveredCount++;
      }
    }

    return { discovered: discoveredCount, totalPages: res.totalPages };
  }

  async discoverSecondaryYear(
    source = 'WIKIDATA',
    languageCode: 'te' | 'hi',
    year: number,
    page = 1
  ): Promise<{ discovered: number; totalPages: number }> {
    const registry = DiscoverySourceRegistry.getInstance();
    const sourceAdapter = registry.getSource(source);

    if (!sourceAdapter || !sourceAdapter.isImplemented) {
      return { discovered: 0, totalPages: 0 };
    }

    const res = await sourceAdapter.discover({ language: languageCode, year, page });
    let discoveredCount = 0;

    for (const item of res.results) {
      const candidate = await prisma.ingestionCandidate.upsert({
        where: {
          source_sourceMovieId: {
            source: source.toUpperCase(),
            sourceMovieId: item.sourceMovieId,
          },
        },
        create: {
          source: source.toUpperCase(),
          sourceMovieId: item.sourceMovieId,
          discoveryReason: `Secondary ${source.toUpperCase()} Discovery ${languageCode.toUpperCase()} ${year} p${page}`,
          status: 'DISCOVERED',
        },
        update: {},
      });
      if (candidate.status === 'DISCOVERED') {
        discoveredCount++;
      }
    }

    return { discovered: discoveredCount, totalPages: res.totalPages };
  }

  async processCandidate(candidateId: string): Promise<IngestionResult> {
    const candidate = await prisma.ingestionCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return { candidateId, status: 'FAILED', title: '', reason: 'Candidate not found' };
    }

    try {
      await prisma.ingestionCandidate.update({
        where: { id: candidateId },
        data: { status: 'PROCESSING', lastAttemptAt: new Date() },
      });

      if (candidate.source.toUpperCase() === 'WIKIDATA') {
        return this.processWikidataCandidate(candidate);
      }

      // --- TMDB / Standard Ingestion Flow ---
      const details = await this.sourceAdapter.getMovieDetails(candidate.sourceMovieId);
      const credits = await this.sourceAdapter.getCredits(candidate.sourceMovieId);
      const altTitles = await this.sourceAdapter.getAlternativeTitles(candidate.sourceMovieId);

      const rawRecord = await prisma.rawSourceRecord.upsert({
        where: {
          source_sourceRecordId: {
            source: 'TMDB',
            sourceRecordId: candidate.sourceMovieId,
          },
        },
        create: {
          source: 'TMDB',
          sourceRecordId: candidate.sourceMovieId,
          payload: { details, credits, altTitles } as any,
        },
        update: {
          payload: { details, credits, altTitles } as any,
          fetchedAt: new Date(),
        },
      });

      const releaseYear = details.release_date
        ? parseInt(details.release_date.split('-')[0], 10)
        : 0;

      if (!releaseYear || releaseYear < 2002) {
        await prisma.ingestionCandidate.update({
          where: { id: candidateId },
          data: {
            status: 'REJECTED',
            error: 'Release year prior to 2002 or invalid',
            processedAt: new Date(),
            resolutionReason: 'REJECTED_YEAR_BEFORE_2002',
          },
        });
        return {
          candidateId,
          status: 'SKIPPED',
          title: details.title,
          reason: 'Year before 2002',
        };
      }

      const primaryLang = this.mapLanguage(details.original_language);
      const industry = this.mapIndustry(primaryLang);
      const slug = this.slugify(details.title, releaseYear);

      let movie = await prisma.movie.findUnique({
        where: { tmdbId: details.id },
      });

      let isNewMovie = false;
      let isDuplicate = false;

      if (!movie) {
        const existingBySlug = await prisma.movie.findUnique({
          where: { slug },
        });

        const existingByTitleYear = await prisma.movie.findFirst({
          where: {
            primaryTitle: { equals: details.title, mode: 'insensitive' },
            releaseYear,
          },
        });

        movie = existingBySlug || existingByTitleYear;

        if (movie) {
          isDuplicate = true;
          if (!movie.tmdbId) {
            movie = await prisma.movie.update({
              where: { id: movie.id },
              data: { tmdbId: details.id },
            });
          }
        }
      }

      const posterAsset = details.poster_path
        ? details.poster_path.startsWith('http')
          ? details.poster_path
          : `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null;
      const backdropAsset = details.backdrop_path
        ? details.backdrop_path.startsWith('http')
          ? details.backdrop_path
          : `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null;

      const boxOffice = details.revenue && details.revenue > 0 ? details.revenue : null;
      const boxOfficeStatus = boxOffice ? 'REPORTED' : 'UNKNOWN';

      if (!movie) {
        isNewMovie = true;
        movie = await prisma.movie.create({
          data: {
            slug,
            primaryTitle: details.title,
            originalTitle: details.original_title,
            alternativeTitles: altTitles,
            supportedLanguages: [primaryLang],
            industries: [industry],
            countries: ['IN'],
            releaseDate: details.release_date ? new Date(details.release_date) : null,
            releaseYear,
            canonicalIndiaReleaseDate: details.release_date
              ? new Date(details.release_date)
              : null,
            budget: details.budget && details.budget > 0 ? details.budget : null,
            boxOffice,
            boxOfficeStatus,
            rating: details.vote_average || null,
            ratingVoteCount: details.vote_count || 0,
            posterAsset,
            backdropAsset,
            tmdbId: details.id,
            lifecycleStatus: 'ACTIVE',
          },
        });
      }

      // Genres
      for (const g of details.genres) {
        const gSlug = g.name.toLowerCase().replace(/[^\w]/g, '-');
        let genreRecord = g.id ? await prisma.genre.findUnique({ where: { tmdbId: g.id } }) : null;
        if (!genreRecord) {
          genreRecord = await prisma.genre.findUnique({ where: { slug: gSlug } });
          if (genreRecord) {
            if (g.id && !genreRecord.tmdbId) {
              genreRecord = await prisma.genre.update({
                where: { id: genreRecord.id },
                data: { tmdbId: g.id, canonicalName: g.name },
              });
            }
          } else {
            genreRecord = await prisma.genre.create({
              data: {
                tmdbId: g.id,
                canonicalName: g.name,
                slug: gSlug,
              },
            });
          }
        }

        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: genreRecord.id,
            },
          },
          create: {
            movieId: movie.id,
            genreId: genreRecord.id,
          },
          update: {},
        });
      }

      // Production Companies
      for (const comp of details.production_companies || []) {
        let phRecord = comp.id ? await prisma.productionHouse.findUnique({ where: { tmdbId: comp.id } }) : null;
        if (!phRecord) {
          phRecord = await prisma.productionHouse.findFirst({
            where: { canonicalName: { equals: comp.name, mode: 'insensitive' } },
          });
          if (phRecord) {
            if (comp.id && !phRecord.tmdbId) {
              phRecord = await prisma.productionHouse.update({
                where: { id: phRecord.id },
                data: { tmdbId: comp.id },
              });
            }
          } else {
            phRecord = await prisma.productionHouse.create({
              data: {
                tmdbId: comp.id,
                canonicalName: comp.name,
              },
            });
          }
        }

        await prisma.movieProductionHouse.upsert({
          where: {
            movieId_productionHouseId_relationshipType: {
              movieId: movie.id,
              productionHouseId: phRecord.id,
              relationshipType: 'PRODUCTION',
            },
          },
          create: {
            movieId: movie.id,
            productionHouseId: phRecord.id,
            relationshipType: 'PRODUCTION',
          },
          update: {},
        });
      }

      // Directors
      const directors = credits.crew.filter((c) => c.job === 'Director');
      for (const d of directors) {
        const image = d.profile_path
          ? d.profile_path.startsWith('http')
            ? d.profile_path
            : `https://image.tmdb.org/t/p/w300${d.profile_path}`
          : null;

        let person = d.id ? await prisma.person.findUnique({ where: { tmdbId: d.id } }) : null;
        if (!person) {
          person = await prisma.person.findFirst({
            where: { canonicalName: { equals: d.name, mode: 'insensitive' } },
          });
          if (person) {
            if (d.id && !person.tmdbId) {
              person = await prisma.person.update({
                where: { id: person.id },
                data: { tmdbId: d.id, image: image || person.image },
              });
            }
          } else {
            person = await prisma.person.create({
              data: {
                tmdbId: d.id,
                canonicalName: d.name,
                image,
              },
            });
          }
        }

        await prisma.moviePerson.upsert({
          where: {
            movieId_personId_roleType_relationType: {
              movieId: movie.id,
              personId: person.id,
              roleType: 'DIRECTOR',
              relationType: 'CREW',
            },
          },
          create: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'DIRECTOR',
            relationType: 'CREW',
            job: 'Director',
            department: 'Directing',
          },
          update: {},
        });
      }

      // Music Directors
      const musicComposers = credits.crew.filter(
        (c) => c.job === 'Original Music Composer' || c.job === 'Music'
      );
      for (const m of musicComposers) {
        const image = m.profile_path
          ? m.profile_path.startsWith('http')
            ? m.profile_path
            : `https://image.tmdb.org/t/p/w300${m.profile_path}`
          : null;

        let person = m.id ? await prisma.person.findUnique({ where: { tmdbId: m.id } }) : null;
        if (!person) {
          person = await prisma.person.findFirst({
            where: { canonicalName: { equals: m.name, mode: 'insensitive' } },
          });
          if (person) {
            if (m.id && !person.tmdbId) {
              person = await prisma.person.update({
                where: { id: person.id },
                data: { tmdbId: m.id, image: image || person.image },
              });
            }
          } else {
            person = await prisma.person.create({
              data: {
                tmdbId: m.id,
                canonicalName: m.name,
                image,
              },
            });
          }
        }

        await prisma.moviePerson.upsert({
          where: {
            movieId_personId_roleType_relationType: {
              movieId: movie.id,
              personId: person.id,
              roleType: 'MUSIC_DIRECTOR',
              relationType: 'CREW',
            },
          },
          create: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'MUSIC_DIRECTOR',
            relationType: 'CREW',
            job: 'Music Director',
            department: 'Sound',
          },
          update: {},
        });
      }

      // Cast
      const topCast = credits.cast.slice(0, 10);
      for (let i = 0; i < topCast.length; i++) {
        const c = topCast[i];
        const image = c.profile_path
          ? c.profile_path.startsWith('http')
            ? c.profile_path
            : `https://image.tmdb.org/t/p/w300${c.profile_path}`
          : null;

        let person = c.id ? await prisma.person.findUnique({ where: { tmdbId: c.id } }) : null;
        if (!person) {
          person = await prisma.person.findFirst({
            where: { canonicalName: { equals: c.name, mode: 'insensitive' } },
          });
          if (person) {
            if (c.id && !person.tmdbId) {
              person = await prisma.person.update({
                where: { id: person.id },
                data: { tmdbId: c.id, image: image || person.image },
              });
            }
          } else {
            person = await prisma.person.create({
              data: {
                tmdbId: c.id,
                canonicalName: c.name,
                image,
              },
            });
          }
        }

        const roleType: RoleType = i < 2 ? 'LEAD' : 'SUPPORTING';
        await prisma.moviePerson.upsert({
          where: {
            movieId_personId_roleType_relationType: {
              movieId: movie.id,
              personId: person.id,
              roleType,
              relationType: 'CAST',
            },
          },
          create: {
            movieId: movie.id,
            personId: person.id,
            roleType,
            relationType: 'CAST',
            characterName: c.character || 'Lead',
            billingOrder: i,
          },
          update: {
            characterName: c.character || 'Lead',
            billingOrder: i,
          },
        });
      }

      const hasDirector = directors.length > 0;
      const hasCast = topCast.length >= 2;
      const isTargetPlayable = hasDirector && hasCast && !!movie.releaseYear;

      await prisma.gameEligibility.upsert({
        where: { movieId: movie.id },
        create: {
          movieId: movie.id,
          playableAsGuess: true,
          playableAsTarget: isTargetPlayable,
          minimumMetadataComplete: hasDirector && hasCast,
          reviewStatus: isTargetPlayable ? 'APPROVED' : 'PENDING',
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: true,
          playableAsTarget: isTargetPlayable,
          minimumMetadataComplete: hasDirector && hasCast,
          updatedAt: new Date(),
        },
      });

      const finalStatus = isDuplicate ? 'DUPLICATE' : 'VALIDATED';
      const resolutionReason = isDuplicate
        ? 'DUPLICATE_CANONICAL_MATCH'
        : isTargetPlayable
        ? 'ACCEPTED_APPROVED'
        : 'ACCEPTED_NEEDS_REVIEW';

      await prisma.ingestionCandidate.update({
        where: { id: candidateId },
        data: {
          status: finalStatus,
          rawSourceRecordId: rawRecord.id,
          processedAt: new Date(),
          resolutionReason,
          duplicateOfMovieId: isDuplicate ? movie.id : null,
        },
      });

      return {
        candidateId,
        movieId: movie.id,
        status: isTargetPlayable ? 'PROCESSED' : 'REVIEW_REQUIRED',
        title: movie.primaryTitle,
        isNewCanonicalMovie: isNewMovie,
        isDuplicate,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.ingestionCandidate.update({
        where: { id: candidateId },
        data: {
          status: 'FAILED',
          error: errorMsg,
          processedAt: new Date(),
          resolutionReason: 'PROCESSING_ERROR',
        },
      });
      return { candidateId, status: 'FAILED', title: '', reason: errorMsg };
    }
  }

  private async processWikidataCandidate(candidate: {
    id: string;
    source: string;
    sourceMovieId: string;
  }): Promise<IngestionResult> {
    const record = wikidataDiscoveryAdapter.getRecordById(candidate.sourceMovieId);
    if (!record) {
      throw new Error(`Wikidata record ${candidate.sourceMovieId} not found in catalog.`);
    }

    // 1. Raw record storage
    const rawRecord = await prisma.rawSourceRecord.upsert({
      where: {
        source_sourceRecordId: {
          source: 'WIKIDATA',
          sourceRecordId: candidate.sourceMovieId,
        },
      },
      create: {
        source: 'WIKIDATA',
        sourceRecordId: candidate.sourceMovieId,
        payload: record as any,
      },
      update: {
        payload: record as any,
        fetchedAt: new Date(),
      },
    });

    const releaseYear = record.releaseYear;
    if (!releaseYear || releaseYear < 2002) {
      await prisma.ingestionCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'REJECTED',
          error: 'Release year prior to 2002 or invalid',
          processedAt: new Date(),
          resolutionReason: 'REJECTED_YEAR_BEFORE_2002',
        },
      });
      return {
        candidateId: candidate.id,
        status: 'SKIPPED',
        title: record.title,
        reason: 'Year before 2002',
      };
    }

    const primaryLang = this.mapLanguage(record.originalLanguage);
    const industry = this.mapIndustry(primaryLang);
    const slug = this.slugify(record.title, releaseYear);

    // 2. DEDUPLICATION ENGINE
    let matchedMovie = null;

    // Check 1: By wikidataId
    matchedMovie = await prisma.movie.findFirst({
      where: { wikidataId: record.id },
    });

    // Check 2: By TMDB ID if cross-referenced
    if (!matchedMovie && record.tmdbId) {
      matchedMovie = await prisma.movie.findUnique({
        where: { tmdbId: record.tmdbId },
      });
    }

    // Check 3: By IMDB ID if cross-referenced
    if (!matchedMovie && record.imdbId) {
      matchedMovie = await prisma.movie.findFirst({
        where: { imdbId: record.imdbId },
      });
    }

    // Check 4: By slug or exact primaryTitle + releaseYear
    if (!matchedMovie) {
      const existingBySlug = await prisma.movie.findUnique({ where: { slug } });
      const existingByTitle = await prisma.movie.findFirst({
        where: {
          primaryTitle: { equals: record.title, mode: 'insensitive' },
          releaseYear,
        },
      });
      matchedMovie = existingBySlug || existingByTitle;
    }

    // Check 5: By alternative titles match
    if (!matchedMovie) {
      matchedMovie = await prisma.movie.findFirst({
        where: {
          releaseYear,
          alternativeTitles: { hasSome: [record.title, ...record.alternativeTitles] },
        },
      });
    }

    let isNewMovie = false;
    let isDuplicate = false;

    if (matchedMovie) {
      isDuplicate = true;
      // Reconcile metadata: link wikidataId and imdbId if missing
      if (!matchedMovie.wikidataId || (!matchedMovie.imdbId && record.imdbId)) {
        matchedMovie = await prisma.movie.update({
          where: { id: matchedMovie.id },
          data: {
            wikidataId: record.id,
            imdbId: matchedMovie.imdbId || record.imdbId || null,
          },
        });
      }

      // Guarantee GameEligibility is present for the matched canonical movie
      const hasDirector = record.directors.length > 0;
      const hasCast = record.cast.length >= 2;
      const isTargetPlayable = hasDirector && hasCast && !!matchedMovie.releaseYear;

      await prisma.gameEligibility.upsert({
        where: { movieId: matchedMovie.id },
        create: {
          movieId: matchedMovie.id,
          playableAsGuess: true,
          playableAsTarget: isTargetPlayable,
          minimumMetadataComplete: hasDirector && hasCast,
          reviewStatus: isTargetPlayable ? 'APPROVED' : 'PENDING',
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: true,
          playableAsTarget: isTargetPlayable,
          minimumMetadataComplete: hasDirector && hasCast,
          updatedAt: new Date(),
        },
      });

      await prisma.ingestionCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'DUPLICATE',
          rawSourceRecordId: rawRecord.id,
          processedAt: new Date(),
          resolutionReason: 'DUPLICATE_CANONICAL_MATCH',
          duplicateOfMovieId: matchedMovie.id,
        },
      });

      return {
        candidateId: candidate.id,
        movieId: matchedMovie.id,
        status: 'PROCESSED',
        title: matchedMovie.primaryTitle,
        isNewCanonicalMovie: false,
        isDuplicate: true,
        reason: 'Duplicate matched and reconciled with existing canonical movie',
      };
    }

    // 3. NEW CANONICAL MOVIE CREATION (from secondary source)
    const existingMovieFinal = await prisma.movie.findUnique({ where: { slug } });
    if (existingMovieFinal) {
      await prisma.ingestionCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'DUPLICATE',
          rawSourceRecordId: rawRecord.id,
          processedAt: new Date(),
          resolutionReason: 'DUPLICATE_CANONICAL_MATCH',
          duplicateOfMovieId: existingMovieFinal.id,
        },
      });
      return {
        candidateId: candidate.id,
        movieId: existingMovieFinal.id,
        status: 'PROCESSED',
        title: existingMovieFinal.primaryTitle,
        isNewCanonicalMovie: false,
        isDuplicate: true,
        reason: 'Duplicate matched concurrently',
      };
    }

    isNewMovie = true;
    const boxOffice = record.revenue && record.revenue > 0 ? record.revenue : null;
    const boxOfficeStatus = boxOffice ? 'REPORTED' : 'UNKNOWN';

    let movie;
    try {
      movie = await prisma.movie.create({
        data: {
          slug,
          primaryTitle: record.title,
          originalTitle: record.originalTitle,
          alternativeTitles: record.alternativeTitles,
          supportedLanguages: [primaryLang],
          industries: [industry],
          countries: ['IN'],
          releaseDate: record.releaseDate ? new Date(record.releaseDate) : null,
          releaseYear,
          canonicalIndiaReleaseDate: record.releaseDate ? new Date(record.releaseDate) : null,
          budget: record.budget && record.budget > 0 ? record.budget : null,
          boxOffice,
          boxOfficeStatus,
          rating: record.rating || null,
          ratingVoteCount: record.voteCount || 0,
          ratingSource: 'WIKIDATA',
          posterAsset: record.posterUrl || null,
          backdropAsset: record.backdropUrl || null,
          tmdbId: record.tmdbId || null,
          imdbId: record.imdbId || null,
          wikidataId: record.id,
          lifecycleStatus: 'ACTIVE',
        },
      });
    } catch (createErr: any) {
      if (createErr.code === 'P2002' || createErr.message?.includes('Unique constraint')) {
        const raceMatched = await prisma.movie.findUnique({ where: { slug } });
        if (raceMatched) {
          await prisma.ingestionCandidate.update({
            where: { id: candidate.id },
            data: {
              status: 'DUPLICATE',
              rawSourceRecordId: rawRecord.id,
              processedAt: new Date(),
              resolutionReason: 'DUPLICATE_CANONICAL_MATCH',
              duplicateOfMovieId: raceMatched.id,
            },
          });
          return {
            candidateId: candidate.id,
            movieId: raceMatched.id,
            status: 'PROCESSED',
            title: raceMatched.primaryTitle,
            isNewCanonicalMovie: false,
            isDuplicate: true,
            reason: 'Duplicate reconciled during concurrent creation',
          };
        }
      }
      throw createErr;
    }

    // Ingest Genres
    for (const g of record.genres) {
      const gSlug = g.name.toLowerCase().replace(/[^\w]/g, '-');
      let genreRecord = await prisma.genre.findUnique({ where: { slug: gSlug } });
      if (!genreRecord) {
        genreRecord = await prisma.genre.create({
          data: {
            canonicalName: g.name,
            slug: gSlug,
          },
        });
      }

      await prisma.movieGenre.upsert({
        where: {
          movieId_genreId: {
            movieId: movie.id,
            genreId: genreRecord.id,
          },
        },
        create: {
          movieId: movie.id,
          genreId: genreRecord.id,
        },
        update: {},
      });
    }

    // Ingest Production Companies
    for (const comp of record.productionCompanies || []) {
      let phRecord = await prisma.productionHouse.findFirst({
        where: { canonicalName: { equals: comp.name, mode: 'insensitive' } },
      });
      if (!phRecord) {
        phRecord = await prisma.productionHouse.create({
          data: {
            canonicalName: comp.name,
          },
        });
      }

      await prisma.movieProductionHouse.upsert({
        where: {
          movieId_productionHouseId_relationshipType: {
            movieId: movie.id,
            productionHouseId: phRecord.id,
            relationshipType: 'PRODUCTION',
          },
        },
        create: {
          movieId: movie.id,
          productionHouseId: phRecord.id,
          relationshipType: 'PRODUCTION',
        },
        update: {},
      });
    }

    // Ingest Directors
    for (const d of record.directors) {
      let person = await prisma.person.findFirst({
        where: { canonicalName: { equals: d.name, mode: 'insensitive' } },
      });
      if (!person) {
        person = await prisma.person.create({
          data: {
            canonicalName: d.name,
            image: d.profileUrl || null,
          },
        });
      }

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'DIRECTOR',
            relationType: 'CREW',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'DIRECTOR',
          relationType: 'CREW',
          job: 'Director',
          department: 'Directing',
        },
        update: {},
      });
    }

    // Ingest Music Directors
    for (const m of record.musicDirectors) {
      let person = await prisma.person.findFirst({
        where: { canonicalName: { equals: m.name, mode: 'insensitive' } },
      });
      if (!person) {
        person = await prisma.person.create({
          data: {
            canonicalName: m.name,
            image: m.profileUrl || null,
          },
        });
      }

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'MUSIC_DIRECTOR',
            relationType: 'CREW',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'MUSIC_DIRECTOR',
          relationType: 'CREW',
          job: 'Music Director',
          department: 'Sound',
        },
        update: {},
      });
    }

    // Ingest Cast
    for (let i = 0; i < record.cast.length; i++) {
      const c = record.cast[i];
      let person = await prisma.person.findFirst({
        where: { canonicalName: { equals: c.name, mode: 'insensitive' } },
      });
      if (!person) {
        person = await prisma.person.create({
          data: {
            canonicalName: c.name,
            image: c.profileUrl || null,
          },
        });
      }

      const roleType: RoleType = i < 2 ? 'LEAD' : 'SUPPORTING';
      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType,
            relationType: 'CAST',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType,
          relationType: 'CAST',
          characterName: c.character || 'Lead',
          billingOrder: i,
        },
        update: {
          characterName: c.character || 'Lead',
          billingOrder: i,
        },
      });
    }

    const hasDirector = record.directors.length > 0;
    const hasCast = record.cast.length >= 2;
    const isTargetPlayable = hasDirector && hasCast && !!movie.releaseYear;

    await prisma.gameEligibility.upsert({
      where: { movieId: movie.id },
      create: {
        movieId: movie.id,
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: hasDirector && hasCast,
        reviewStatus: isTargetPlayable ? 'APPROVED' : 'PENDING',
        updatedAt: new Date(),
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: hasDirector && hasCast,
        updatedAt: new Date(),
      },
    });

    await prisma.ingestionCandidate.update({
      where: { id: candidate.id },
      data: {
        status: 'VALIDATED',
        rawSourceRecordId: rawRecord.id,
        processedAt: new Date(),
        resolutionReason: 'ACCEPTED_NEW_CANONICAL',
      },
    });

    return {
      candidateId: candidate.id,
      movieId: movie.id,
      status: 'PROCESSED',
      title: movie.primaryTitle,
      isNewCanonicalMovie: true,
      isDuplicate: false,
      reason: 'New unique movie created from secondary Wikidata discovery',
    };
  }

  async discoverAndIngestMissingCandidate(
    source: string,
    sourceMovieId: string,
    reason = 'Manual / Targeted Missing Candidate Discovery'
  ): Promise<IngestionResult> {
    let candidate = await prisma.ingestionCandidate.findUnique({
      where: {
        source_sourceMovieId: {
          source: source.toUpperCase(),
          sourceMovieId,
        },
      },
    });

    if (!candidate) {
      candidate = await prisma.ingestionCandidate.create({
        data: {
          source: source.toUpperCase(),
          sourceMovieId,
          discoveryReason: reason,
          status: 'DISCOVERED',
        },
      });
    }

    return this.processCandidate(candidate.id);
  }

  async runFullHistoricalIngestion(
    startYear = 2002,
    endYear = 2026,
    onProgress?: (info: { year: number; lang: string; discovered: number; processed: number; total: number }) => void
  ) {
    let totalDiscovered = 0;
    const languages: Array<'te' | 'hi'> = ['te', 'hi'];

    for (let y = startYear; y <= endYear; y++) {
      for (const lang of languages) {
        const { discovered } = await this.discoverYear(lang, y, 1);
        totalDiscovered += discovered;
        if (onProgress) {
          onProgress({ year: y, lang, discovered, processed: 0, total: totalDiscovered });
        }
      }
    }

    const candidates = await prisma.ingestionCandidate.findMany({
      where: {
        status: { in: ['DISCOVERED', 'FAILED'] },
      },
      orderBy: { discoveredAt: 'asc' },
    });

    const results: IngestionResult[] = [];
    let processedCount = 0;

    for (const candidate of candidates) {
      const res = await this.processCandidate(candidate.id);
      results.push(res);
      processedCount++;
      if (onProgress) {
        onProgress({
          year: 0,
          lang: '',
          discovered: totalDiscovered,
          processed: processedCount,
          total: candidates.length,
        });
      }
    }

    return {
      totalDiscovered,
      totalProcessed: processedCount,
      results,
    };
  }

  async runSecondaryHistoricalIngestion(
    source = 'WIKIDATA',
    startYear = 2002,
    endYear = 2026
  ) {
    let totalDiscovered = 0;
    const languages: Array<'te' | 'hi'> = ['te', 'hi'];

    for (let y = startYear; y <= endYear; y++) {
      for (const lang of languages) {
        const { discovered } = await this.discoverSecondaryYear(source, lang, y);
        totalDiscovered += discovered;
      }
    }

    const candidates = await prisma.ingestionCandidate.findMany({
      where: {
        source: source.toUpperCase(),
        status: { in: ['DISCOVERED', 'FAILED'] },
      },
      orderBy: { discoveredAt: 'asc' },
    });

    const results: IngestionResult[] = [];
    let processedCount = 0;
    let newMoviesCreated = 0;
    let duplicatesMerged = 0;

    for (const candidate of candidates) {
      const res = await this.processCandidate(candidate.id);
      results.push(res);
      processedCount++;
      if (res.isNewCanonicalMovie) newMoviesCreated++;
      if (res.isDuplicate) duplicatesMerged++;
    }

    return {
      source: source.toUpperCase(),
      totalDiscovered,
      totalProcessed: processedCount,
      newMoviesCreated,
      duplicatesMerged,
      results,
    };
  }

  async runHistoricalCatalogExpansion(options: HistoricalExpansionOptions = {}): Promise<HistoricalExpansionReport> {
    const startTime = Date.now();
    const startYear = options.startYear || 2002;
    const currentYear = new Date().getFullYear();
    const endYear = options.endYear || (currentYear >= 2026 ? currentYear : 2026);
    const sources = options.sources && options.sources.length > 0 ? options.sources : ['TMDB', 'WIKIDATA'];
    const languages: Array<'te' | 'hi'> = options.languages && options.languages.length > 0 ? options.languages : ['te', 'hi'];
    const resume = options.resume !== false;

    const previousCanonicalCount = await prisma.movie.count();
    const stats: YearLanguageSourceStat[] = [];

    let totalDiscovered = 0;
    let totalProcessed = 0;
    let totalNewCanonicalMovies = 0;
    let totalDuplicatesMerged = 0;
    let totalReviewRequired = 0;
    let totalFailed = 0;
    let checkpointsSaved = 0;

    for (let year = startYear; year <= endYear; year++) {
      for (const source of sources) {
        const srcUpper = source.toUpperCase();
        for (const lang of languages) {
          // Checkpoint checking for resumability
          let existingCheckpoint = null;
          if (resume) {
            existingCheckpoint = await prisma.discoveryCheckpoint.findUnique({
              where: {
                source_language_year: {
                  source: srcUpper,
                  language: lang.toLowerCase(),
                  year,
                },
              },
            });
          }

          // If year checkpoint was already completed and resume is enabled, skip re-discovery
          const isCheckpointAlreadyCompleted = resume && existingCheckpoint?.status === 'COMPLETED';

          let discoveredThisBatch = 0;
          let newCandidatesThisBatch = 0;
          let duplicatesThisBatch = 0;
          let newMoviesThisBatch = 0;
          let enrichedSuccess = 0;
          let enrichedFailed = 0;
          let validationPass = 0;
          let validationReview = 0;
          let validationRejected = 0;
          let totalPagesForBatch = existingCheckpoint?.totalPages || 1;
          let lastProcessedPage = existingCheckpoint?.page || 1;

          if (options.onProgress) {
            options.onProgress({
              year,
              source: srcUpper,
              language: lang,
              stage: 'DISCOVERING',
              discovered: totalDiscovered,
              processed: totalProcessed,
              newMoviesCreated: totalNewCanonicalMovies,
              duplicatesMerged: totalDuplicatesMerged,
              message: `Discovering ${srcUpper} ${lang.toUpperCase()} for ${year}...`,
            });
          }

          // 1. DISCOVERY STAGE (Exhaustive paginated discovery)
          if (!isCheckpointAlreadyCompleted) {
            try {
              let page = resume && existingCheckpoint?.status === 'IN_PROGRESS' ? existingCheckpoint.page : 1;
              let totalPages = 1;

              do {
                let res = { discovered: 0, totalPages: 1 };
                if (srcUpper === 'TMDB') {
                  res = await this.discoverYear(lang, year, page);
                } else if (srcUpper === 'WIKIDATA') {
                  res = await this.discoverSecondaryYear(srcUpper, lang, year, page);
                }

                discoveredThisBatch += res.discovered;
                totalPages = Math.max(1, res.totalPages);
                totalPagesForBatch = totalPages;
                lastProcessedPage = page;

                // Update in-progress checkpoint state
                await prisma.discoveryCheckpoint.upsert({
                  where: {
                    source_language_year: {
                      source: srcUpper,
                      language: lang.toLowerCase(),
                      year,
                    },
                  },
                  create: {
                    source: srcUpper,
                    language: lang.toLowerCase(),
                    year,
                    page,
                    totalPages,
                    status: page >= totalPages ? 'COMPLETED' : 'IN_PROGRESS',
                    candidatesFound: discoveredThisBatch,
                    candidatesSaved: 0,
                    lastRunAt: new Date(),
                  },
                  update: {
                    page,
                    totalPages,
                    status: page >= totalPages ? 'COMPLETED' : 'IN_PROGRESS',
                    candidatesFound: { increment: res.discovered },
                    lastRunAt: new Date(),
                  },
                });

                page++;
              } while (page <= totalPages);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error(`Discovery error for ${srcUpper} ${lang} ${year}:`, msg);
            }
          }

          totalDiscovered += discoveredThisBatch;

          // 2. INGESTION & PROCESSING STAGE
          if (options.onProgress) {
            options.onProgress({
              year,
              source: srcUpper,
              language: lang,
              stage: 'INGESTING',
              discovered: totalDiscovered,
              processed: totalProcessed,
              newMoviesCreated: totalNewCanonicalMovies,
              duplicatesMerged: totalDuplicatesMerged,
              message: `Processing candidates for ${srcUpper} ${lang.toUpperCase()} ${year}...`,
            });
          }

          const candidatesToProcess = await prisma.ingestionCandidate.findMany({
            where: {
              source: srcUpper,
              discoveryReason: { contains: `${year}` },
              status: { in: ['DISCOVERED', 'FAILED'] },
            },
          });

          for (const candidate of candidatesToProcess) {
            try {
              const res = await this.processCandidate(candidate.id);
              totalProcessed++;

              if (res.status === 'PROCESSED') {
                enrichedSuccess++;
                validationPass++;
              } else if (res.status === 'REVIEW_REQUIRED') {
                enrichedSuccess++;
                validationReview++;
                totalReviewRequired++;
              } else if (res.status === 'SKIPPED') {
                validationRejected++;
              } else {
                enrichedFailed++;
                totalFailed++;
              }

              if (res.isNewCanonicalMovie) {
                newMoviesThisBatch++;
                totalNewCanonicalMovies++;
              }
              if (res.isDuplicate) {
                duplicatesThisBatch++;
                totalDuplicatesMerged++;
              }
            } catch (err: unknown) {
              enrichedFailed++;
              totalFailed++;
              console.error(`Candidate processing error [${candidate.id}]:`, err);
            }
          }

          // 3. CHECKPOINT PERSISTENCE (Mark year exhausted and completed)
          try {
            await prisma.discoveryCheckpoint.upsert({
              where: {
                source_language_year: {
                  source: srcUpper,
                  language: lang.toLowerCase(),
                  year,
                },
              },
              create: {
                source: srcUpper,
                language: lang.toLowerCase(),
                year,
                page: lastProcessedPage,
                totalPages: totalPagesForBatch,
                status: 'COMPLETED',
                candidatesFound: discoveredThisBatch,
                candidatesSaved: newMoviesThisBatch,
                lastRunAt: new Date(),
                updatedAt: new Date(),
              },
              update: {
                page: lastProcessedPage,
                totalPages: totalPagesForBatch,
                status: 'COMPLETED',
                candidatesFound: discoveredThisBatch > 0 ? discoveredThisBatch : undefined,
                candidatesSaved: newMoviesThisBatch > 0 ? newMoviesThisBatch : undefined,
                lastRunAt: new Date(),
                updatedAt: new Date(),
              },
            });
            checkpointsSaved++;
          } catch (err) {
            console.error(`Checkpoint save error for ${srcUpper} ${lang} ${year}:`, err);
          }

          stats.push({
            year,
            source: srcUpper,
            language: lang.toUpperCase(),
            discovered: discoveredThisBatch,
            alreadyKnown: existingCheckpoint ? existingCheckpoint.candidatesFound : 0,
            newCandidates: discoveredThisBatch,
            duplicates: duplicatesThisBatch,
            enrichedSuccess,
            enrichedFailed,
            validationPass,
            validationReview,
            validationRejected,
            newCanonicalMovies: newMoviesThisBatch,
          });
        }
      }
    }

    // Final cleanup pass for any un-categorized pending candidates
    const remainingCandidates = await prisma.ingestionCandidate.findMany({
      where: {
        status: { in: ['DISCOVERED', 'FAILED'] },
      },
    });

    for (const candidate of remainingCandidates) {
      try {
        const res = await this.processCandidate(candidate.id);
        totalProcessed++;
        if (res.isNewCanonicalMovie) totalNewCanonicalMovies++;
        if (res.isDuplicate) totalDuplicatesMerged++;
      } catch (err: unknown) {
        totalFailed++;
        console.error(`Cleanup candidate processing error [${candidate.id}]:`, err);
      }
    }

    const currentCanonicalCount = await prisma.movie.count();
    const durationMs = Date.now() - startTime;

    return {
      startYear,
      endYear,
      sources,
      languages: languages.map((l) => l.toUpperCase()),
      previousCanonicalCount,
      newCanonicalMoviesAdded: currentCanonicalCount - previousCanonicalCount,
      currentCanonicalCount,
      totalDiscovered,
      totalProcessed,
      totalDuplicatesMerged,
      totalReviewRequired,
      totalFailed,
      stats,
      checkpointsSaved,
      durationMs,
    };
  }

  async runHistoricalBatch(startYear = 2002, endYear = 2026) {
    const job = await queueService.enqueue('DISCOVER_RELEASES', { startYear, endYear });
    return job;
  }
}

export const ingestionService = new IngestionService();

