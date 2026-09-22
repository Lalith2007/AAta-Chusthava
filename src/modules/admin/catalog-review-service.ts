import { prisma } from '@/infrastructure/db/client';
import { AppError } from '@/domain/errors';
import { enrichmentService, EnrichmentResult } from '@/modules/enrichment/enrichment-service';
import { normalizeMovieTitle } from '@/modules/ingestion/ingestion-service';
import { MovieLanguage, ReviewStatus, LifecycleStatus } from '@prisma/client';

export type ClueDimensionStatus = 'PRESENT' | 'MISSING' | 'INCOMPLETE' | 'UNAVAILABLE';

export function normalizeMovieLanguage(lang?: string): MovieLanguage | null {
  if (!lang) return null;
  const upper = lang.trim().toUpperCase();
  const map: Record<string, MovieLanguage> = {
    TE: 'TELUGU',
    TELUGU: 'TELUGU',
    HI: 'HINDI',
    HINDI: 'HINDI',
    TA: 'TAMIL',
    TAMIL: 'TAMIL',
    ML: 'MALAYALAM',
    MALAYALAM: 'MALAYALAM',
    KN: 'KANNADA',
    KANNADA: 'KANNADA',
    EN: 'ENGLISH',
    ENGLISH: 'ENGLISH',
    BN: 'BENGALI',
    BENGALI: 'BENGALI',
    MR: 'MARATHI',
    MARATHI: 'MARATHI',
  };
  return map[upper] || (['TELUGU', 'HINDI', 'TAMIL', 'MALAYALAM', 'KANNADA', 'BENGALI', 'MARATHI', 'ENGLISH', 'OTHER'].includes(upper) ? (upper as MovieLanguage) : null);
}

export interface ClueDimensionSummary {
  dimension: string;
  label: string;
  status: ClueDimensionStatus;
  value?: string | number | null;
  details?: string;
}

export interface MovieClueCoverageAnalysis {
  dimensions: Record<string, ClueDimensionSummary>;
  missingClues: string[];
  reasons: string[];
  isTargetPlayable: boolean;
  isGuessPlayable: boolean;
  score: {
    present: number;
    total: number;
  };
}

export interface ReviewQueueFilterOptions {
  search?: string;
  language?: string; // 'TELUGU' | 'HINDI'
  year?: number;
  reason?: string;
  playableStatus?: 'TARGET' | 'GUESS' | 'BOTH' | 'NEITHER';
  hasPoster?: boolean;
  hasTmdbId?: boolean;
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'year_desc' | 'year_asc';
  page?: number;
  limit?: number;
}

export interface ReviewQueueItem {
  id: string;
  primaryTitle: string;
  originalTitle: string;
  releaseYear: number;
  supportedLanguages: MovieLanguage[];
  posterAsset: string | null;
  tmdbId: number | null;
  imdbId: string | null;
  wikidataId: string | null;
  reviewStatus: ReviewStatus;
  lifecycleStatus: LifecycleStatus;
  playableAsGuess: boolean;
  playableAsTarget: boolean;
  reasons: string[];
  missingClues: string[];
  clueScore: { present: number; total: number };
  directors: string[];
  leadActors: string[];
  genres: string[];
  hasPoster: boolean;
  hasTmdbId: boolean;
  updatedAt: string;
}

export interface SuspectedDuplicate {
  canonicalMovie: {
    id: string;
    primaryTitle: string;
    originalTitle: string;
    releaseYear: number;
    supportedLanguages: MovieLanguage[];
    posterAsset: string | null;
    tmdbId: number | null;
    directors: string[];
    leadActors: string[];
    genres: string[];
  };
  matchType: 'TMDB_ID' | 'NORMALIZED_TITLE_YEAR' | 'EXACT_TITLE_YEAR' | 'SLUG' | 'CANDIDATE_LINK';
  confidence: 'HIGH' | 'EXACT' | 'MEDIUM';
}

export interface ReviewDetailPayload {
  movie: {
    id: string;
    slug: string;
    primaryTitle: string;
    originalTitle: string;
    alternativeTitles: string[];
    supportedLanguages: MovieLanguage[];
    industries: string[];
    countries: string[];
    releaseDate: string | null;
    releaseYear: number;
    certification: string | null;
    budget: number | null;
    budgetCurrency: string | null;
    boxOffice: number | null;
    boxOfficeCurrency: string | null;
    boxOfficeStatus: string;
    rating: number | null;
    ratingVoteCount: number | null;
    posterAsset: string | null;
    backdropAsset: string | null;
    franchise: string | null;
    lifecycleStatus: LifecycleStatus;
    tmdbId: number | null;
    imdbId: string | null;
    wikidataId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  eligibility: {
    id: string;
    playableAsGuess: boolean;
    playableAsTarget: boolean;
    minimumMetadataComplete: boolean;
    reviewStatus: ReviewStatus;
    disabledReason: string | null;
    updatedAt: string;
  } | null;
  people: Array<{
    id: string;
    canonicalName: string;
    roleType: string;
    relationType: string;
    billingOrder: number | null;
    job: string | null;
    department: string | null;
  }>;
  genres: string[];
  productionHouses: string[];
  clueAnalysis: MovieClueCoverageAnalysis;
  targetReferences: {
    dailyPuzzles: number;
    challenges: number;
    games: number;
    isTarget: boolean;
  };
  suspectedDuplicates: SuspectedDuplicate[];
  candidateProvenance: {
    source?: string;
    sourceMovieId?: string;
    discoveredAt?: string;
    discoveryReason?: string;
    duplicateOfMovieId?: string | null;
  } | null;
}

export interface ReviewQueueStats {
  totalPending: number;
  byReason: Record<string, number>;
  byLanguage: {
    telugu: number;
    hindi: number;
  };
  byYearGroup: {
    '2002-2009': number;
    '2010-2019': number;
    '2020-2026': number;
  };
  playableAsGuess: number;
  playableAsTarget: number;
  playableBoth: number;
  missingPoster: number;
  missingTmdb: number;
  potentialDuplicates: number;
}

export class CatalogReviewService {
  /**
   * Evaluates all 11 clue dimensions for any movie record.
   */
  evaluateClueCoverage(movie: any): MovieClueCoverageAnalysis {
    const people = movie.people || [];
    const genres = movie.genres || [];
    const prodHouses = movie.productionHouses || [];

    // Extract key people
    const directors = people
      .filter((p: any) => p.roleType === 'DIRECTOR' || p.job === 'Director')
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Director')
      .filter(Boolean);

    const leadActors = people
      .filter((p: any) => p.roleType === 'LEAD_ACTOR' || (p.roleType === 'LEAD' && (p.billingOrder === 0 || p.billingOrder === null)))
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Lead Actor')
      .filter(Boolean);

    const leadActresses = people
      .filter((p: any) => p.roleType === 'LEAD_ACTRESS' || (p.roleType === 'LEAD' && p.billingOrder === 1))
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Lead Actress')
      .filter(Boolean);

    const supportingCast = people
      .filter((p: any) => p.roleType === 'SUPPORTING_CAST' || p.roleType === 'SUPPORTING' || (['CAST', 'LEAD'].includes(p.roleType) && (p.billingOrder ?? 0) >= 2))
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Supporting Cast')
      .filter(Boolean);

    const allCast = people
      .filter((p: any) => ['LEAD_ACTOR', 'LEAD_ACTRESS', 'SUPPORTING_CAST', 'LEAD', 'SUPPORTING', 'CAST'].includes(p.roleType))
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Cast Member')
      .filter(Boolean);

    const musicDirectors = people
      .filter((p: any) => p.roleType === 'MUSIC_DIRECTOR' || p.job === 'Original Music Composer' || p.job === 'Music')
      .map((p: any) => p.person?.canonicalName || p.canonicalName || p.personId || 'Music Director')
      .filter(Boolean);

    const genreNames = genres
      .map((g: any) => g.genre?.canonicalName || g.genre?.name || g.name || g.genreId || (typeof g === 'string' ? g : null))
      .filter(Boolean);

    const studioNames = prodHouses
      .map((ph: any) => ph.productionHouse?.canonicalName || ph.name || ph)
      .filter(Boolean);

    // 11 dimensions evaluation
    const dimensions: Record<string, ClueDimensionSummary> = {
      LANGUAGE: {
        dimension: 'LANGUAGE',
        label: 'Supported Language',
        status: movie.supportedLanguages && movie.supportedLanguages.length > 0 ? 'PRESENT' : 'MISSING',
        value: movie.supportedLanguages?.join(', ') || null,
      },
      DIRECTOR: {
        dimension: 'DIRECTOR',
        label: 'Director',
        status: directors.length > 0 ? 'PRESENT' : 'MISSING',
        value: directors.join(', ') || null,
      },
      PRODUCTION_HOUSE: {
        dimension: 'PRODUCTION_HOUSE',
        label: 'Production House (Studio)',
        status: studioNames.length > 0 ? 'PRESENT' : 'UNAVAILABLE',
        value: studioNames.join(', ') || null,
      },
      RELEASE_YEAR: {
        dimension: 'RELEASE_YEAR',
        label: 'Release Year',
        status: movie.releaseYear && movie.releaseYear >= 2002 ? 'PRESENT' : 'MISSING',
        value: movie.releaseYear || null,
      },
      BOX_OFFICE: {
        dimension: 'BOX_OFFICE',
        label: 'Box Office',
        status:
          movie.boxOffice !== null && movie.boxOffice > 0 && ['REPORTED', 'FINAL'].includes(movie.boxOfficeStatus)
            ? 'PRESENT'
            : 'UNAVAILABLE',
        value: movie.boxOffice !== null ? movie.boxOffice : null,
        details: movie.boxOfficeStatus || 'UNKNOWN',
      },
      RATING: {
        dimension: 'RATING',
        label: 'Rating',
        status: movie.rating !== null && movie.rating > 0 ? 'PRESENT' : 'UNAVAILABLE',
        value: movie.rating !== null ? movie.rating : null,
      },
      LEAD_ACTOR: {
        dimension: 'LEAD_ACTOR',
        label: 'Lead Actor (Primary Lead)',
        status: leadActors.length > 0 || allCast.length >= 1 ? 'PRESENT' : 'MISSING',
        value: leadActors.length > 0 ? leadActors.join(', ') : allCast[0] || null,
      },
      LEAD_ACTRESS: {
        dimension: 'LEAD_ACTRESS',
        label: 'Lead Actress (Co-Lead)',
        status: leadActresses.length > 0 || allCast.length >= 2 ? 'PRESENT' : 'INCOMPLETE',
        value: leadActresses.length > 0 ? leadActresses.join(', ') : allCast[1] || null,
      },
      SUPPORTING_CAST: {
        dimension: 'SUPPORTING_CAST',
        label: 'Supporting Cast',
        status: supportingCast.length > 0 || allCast.length >= 3 ? 'PRESENT' : 'INCOMPLETE',
        value: supportingCast.length > 0 ? supportingCast.slice(0, 3).join(', ') : allCast.slice(2, 5).join(', ') || null,
      },
      MUSIC_DIRECTOR: {
        dimension: 'MUSIC_DIRECTOR',
        label: 'Music Director',
        status: musicDirectors.length > 0 ? 'PRESENT' : 'UNAVAILABLE',
        value: musicDirectors.join(', ') || null,
      },
      GENRES: {
        dimension: 'GENRES',
        label: 'Genres',
        status: genreNames.length > 0 ? 'PRESENT' : 'MISSING',
        value: genreNames.join(', ') || null,
      },
    };

    // Calculate engine playability
    const hasDirector = directors.length > 0;
    const hasCast = allCast.length >= 2;
    const hasGenres = genreNames.length >= 1;
    const hasReleaseYear = !!movie.releaseYear && movie.releaseYear >= 2002;

    const isTargetPlayable = hasDirector && hasCast && hasGenres && hasReleaseYear;
    const isGuessPlayable = movie.lifecycleStatus === 'ACTIVE' && hasReleaseYear;

    const missingClues: string[] = [];
    if (!hasDirector) missingClues.push('Director');
    if (!hasCast) missingClues.push(allCast.length === 1 ? 'Co-Lead / Supporting Cast (Need >= 2 Cast)' : 'Cast (Need >= 2 Cast)');
    if (!hasGenres) missingClues.push('Genres');
    if (!movie.posterAsset) missingClues.push('Poster');
    if (!movie.tmdbId) missingClues.push('TMDB ID');

    // Review reason taxonomy
    const reasons: string[] = [];
    if (!hasDirector) reasons.push('MISSING_DIRECTOR');
    if (!hasCast) reasons.push('MISSING_CAST_DATA');
    if (!hasGenres) reasons.push('MISSING_GENRES');
    if (!movie.posterAsset) reasons.push('MISSING_POSTER');
    if (!movie.tmdbId) reasons.push('MISSING_EXTERNAL_ID');
    if (!isTargetPlayable) reasons.push('INSUFFICIENT_CLUE_COVERAGE');

    if (movie.eligibility?.disabledReason && !reasons.includes(movie.eligibility.disabledReason)) {
      reasons.push(movie.eligibility.disabledReason);
    }

    let presentCount = 0;
    for (const d of Object.values(dimensions)) {
      if (d.status === 'PRESENT') presentCount++;
    }

    return {
      dimensions,
      missingClues,
      reasons,
      isTargetPlayable,
      isGuessPlayable,
      score: {
        present: presentCount,
        total: 11,
      },
    };
  }

  /**
   * Log an audit event
   */
  async logAudit(params: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: any;
    after?: any;
    reason?: string;
    actorRole?: string;
  }) {
    const { actorId, action, entityType, entityId, before, after, reason, actorRole = 'SUPER_ADMIN' } = params;
    return prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        before: before ?? undefined,
        after: after ?? undefined,
        reason,
      },
    });
  }

  /**
   * Check target immutability. Throws if the movie is an active or historical game target.
   */
  async assertTargetImmutability(movieId: string, actionName: string): Promise<void> {
    const [dailyCount, challengeCount, gameCount] = await Promise.all([
      prisma.dailyPuzzle.count({ where: { targetMovieId: movieId } }),
      prisma.challenge.count({ where: { targetMovieId: movieId } }),
      prisma.game.count({ where: { targetMovieId: movieId } }),
    ]);

    if (dailyCount > 0 || challengeCount > 0 || gameCount > 0) {
      throw new AppError(
        'TARGET_IMMUTABILITY_VIOLATION',
        `Cannot execute ${actionName} on movie ${movieId}: Movie is referenced by ${dailyCount} DailyPuzzle(s), ${challengeCount} Challenge(s), and ${gameCount} Game(s). Targets are strictly immutable.`,
        409
      );
    }
  }

  /**
   * Get paginated review queue with rich filtering.
   */
  async getReviewQueue(options: ReviewQueueFilterOptions = {}): Promise<{
    items: ReviewQueueItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    // Base query: canonical movies pending review
    const where: any = {
      eligibility: {
        reviewStatus: 'PENDING',
      },
    };

    if (options.language) {
      const normLang = normalizeMovieLanguage(options.language);
      if (normLang) {
        where.supportedLanguages = { has: normLang };
      }
    }

    if (options.year) {
      where.releaseYear = options.year;
    }

    if (options.hasPoster !== undefined) {
      where.posterAsset = options.hasPoster ? { not: null } : null;
    }

    if (options.hasTmdbId !== undefined) {
      where.tmdbId = options.hasTmdbId ? { not: null } : null;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      const numQ = parseInt(q, 10);
      where.OR = [
        { primaryTitle: { contains: q, mode: 'insensitive' } },
        { originalTitle: { contains: q, mode: 'insensitive' } },
        ...(isNaN(numQ) ? [] : [{ tmdbId: numQ }]),
      ];
    }

    if (options.playableStatus) {
      if (options.playableStatus === 'TARGET') {
        where.eligibility.playableAsTarget = true;
      } else if (options.playableStatus === 'GUESS') {
        where.eligibility.playableAsGuess = true;
      } else if (options.playableStatus === 'BOTH') {
        where.eligibility.playableAsGuess = true;
        where.eligibility.playableAsTarget = true;
      } else if (options.playableStatus === 'NEITHER') {
        where.eligibility.playableAsGuess = false;
        where.eligibility.playableAsTarget = false;
      }
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' };
    if (options.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (options.sort === 'newest') orderBy = { createdAt: 'desc' };
    if (options.sort === 'title_asc') orderBy = { primaryTitle: 'asc' };
    if (options.sort === 'title_desc') orderBy = { primaryTitle: 'desc' };
    if (options.sort === 'year_desc') orderBy = { releaseYear: 'desc' };
    if (options.sort === 'year_asc') orderBy = { releaseYear: 'asc' };

    const [rawMovies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: {
          eligibility: true,
          people: {
            include: { person: { select: { canonicalName: true } } },
          },
          genres: {
            include: { genre: { select: { canonicalName: true } } },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.movie.count({ where }),
    ]);

    const items: ReviewQueueItem[] = rawMovies.map((m) => {
      const analysis = this.evaluateClueCoverage(m);

      const directors = (m.people || [])
        .filter((p) => p.roleType === 'DIRECTOR' || p.job === 'Director')
        .map((p) => p.person?.canonicalName)
        .filter(Boolean);

      const leadActors = (m.people || [])
        .filter((p) => ['LEAD_ACTOR', 'LEAD_ACTRESS', 'LEAD', 'CAST'].includes(p.roleType))
        .map((p) => p.person?.canonicalName)
        .filter(Boolean);

      const genres = (m.genres || [])
        .map((g) => g.genre?.canonicalName)
        .filter(Boolean);

      return {
        id: m.id,
        primaryTitle: m.primaryTitle,
        originalTitle: m.originalTitle,
        releaseYear: m.releaseYear,
        supportedLanguages: m.supportedLanguages,
        posterAsset: m.posterAsset,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
        wikidataId: m.wikidataId,
        reviewStatus: m.eligibility?.reviewStatus || 'PENDING',
        lifecycleStatus: m.lifecycleStatus,
        playableAsGuess: m.eligibility?.playableAsGuess ?? true,
        playableAsTarget: m.eligibility?.playableAsTarget ?? false,
        reasons: analysis.reasons,
        missingClues: analysis.missingClues,
        clueScore: analysis.score,
        directors,
        leadActors,
        genres,
        hasPoster: !!m.posterAsset,
        hasTmdbId: !!m.tmdbId,
        updatedAt: m.updatedAt.toISOString(),
      };
    });

    // If reason filter was provided, filter memory list if needed
    const filteredItems = options.reason
      ? items.filter((item) => item.reasons.includes(options.reason!))
      : items;

    return {
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get detailed review data for a single movie including 11-clue diagnostic and suspected duplicates.
   */
  async getReviewDetail(movieId: string): Promise<ReviewDetailPayload> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        eligibility: true,
        people: {
          include: { person: true },
          orderBy: { billingOrder: 'asc' },
        },
        genres: {
          include: { genre: true },
        },
        productionHouses: {
          include: { productionHouse: true },
        },
      },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${movieId} not found`, 404);
    }

    const clueAnalysis = this.evaluateClueCoverage(movie);

    // Target references check
    const [dailyPuzzles, challenges, games] = await Promise.all([
      prisma.dailyPuzzle.count({ where: { targetMovieId: movieId } }),
      prisma.challenge.count({ where: { targetMovieId: movieId } }),
      prisma.game.count({ where: { targetMovieId: movieId } }),
    ]);

    // Find suspected duplicates
    const suspectedDuplicates: SuspectedDuplicate[] = [];

    // 1. Same TMDB ID if present
    if (movie.tmdbId) {
      const tmdbMatches = await prisma.movie.findMany({
        where: { tmdbId: movie.tmdbId, id: { not: movie.id } },
        include: {
          people: { include: { person: true } },
          genres: { include: { genre: true } },
        },
      });
      for (const m of tmdbMatches) {
        suspectedDuplicates.push({
          canonicalMovie: {
            id: m.id,
            primaryTitle: m.primaryTitle,
            originalTitle: m.originalTitle,
            releaseYear: m.releaseYear,
            supportedLanguages: m.supportedLanguages,
            posterAsset: m.posterAsset,
            tmdbId: m.tmdbId,
            directors: m.people.filter((p) => p.roleType === 'DIRECTOR').map((p) => p.person.canonicalName),
            leadActors: m.people.filter((p) => ['LEAD_ACTOR', 'LEAD'].includes(p.roleType)).map((p) => p.person.canonicalName),
            genres: m.genres.map((g) => g.genre.canonicalName),
          },
          matchType: 'TMDB_ID',
          confidence: 'EXACT',
        });
      }
    }

    // 2. Exact Title and Release Year
    const exactTitleMatches = await prisma.movie.findMany({
      where: {
        primaryTitle: { equals: movie.primaryTitle.trim(), mode: 'insensitive' },
        releaseYear: movie.releaseYear,
        id: { not: movie.id },
      },
      include: {
        people: { include: { person: true } },
        genres: { include: { genre: true } },
      },
    });
    for (const m of exactTitleMatches) {
      if (!suspectedDuplicates.some((d) => d.canonicalMovie.id === m.id)) {
        suspectedDuplicates.push({
          canonicalMovie: {
            id: m.id,
            primaryTitle: m.primaryTitle,
            originalTitle: m.originalTitle,
            releaseYear: m.releaseYear,
            supportedLanguages: m.supportedLanguages,
            posterAsset: m.posterAsset,
            tmdbId: m.tmdbId,
            directors: m.people.filter((p) => p.roleType === 'DIRECTOR').map((p) => p.person.canonicalName),
            leadActors: m.people.filter((p) => ['LEAD_ACTOR', 'LEAD'].includes(p.roleType)).map((p) => p.person.canonicalName),
            genres: m.genres.map((g) => g.genre.canonicalName),
          },
          matchType: 'EXACT_TITLE_YEAR',
          confidence: 'HIGH',
        });
      }
    }

    // 3. Normalized Title within +/- 1 year
    const normTitle = normalizeMovieTitle(movie.primaryTitle);
    if (normTitle.length >= 3) {
      const yearRange = [movie.releaseYear - 1, movie.releaseYear, movie.releaseYear + 1];
      const normMatches = await prisma.movie.findMany({
        where: {
          releaseYear: { in: yearRange },
          id: { not: movie.id },
        },
        include: {
          people: { include: { person: true } },
          genres: { include: { genre: true } },
        },
        take: 10,
      });

      for (const m of normMatches) {
        if (normalizeMovieTitle(m.primaryTitle) === normTitle) {
          if (!suspectedDuplicates.some((d) => d.canonicalMovie.id === m.id)) {
            suspectedDuplicates.push({
              canonicalMovie: {
                id: m.id,
                primaryTitle: m.primaryTitle,
                originalTitle: m.originalTitle,
                releaseYear: m.releaseYear,
                supportedLanguages: m.supportedLanguages,
                posterAsset: m.posterAsset,
                tmdbId: m.tmdbId,
                directors: m.people.filter((p) => p.roleType === 'DIRECTOR').map((p) => p.person.canonicalName),
                leadActors: m.people.filter((p) => ['LEAD_ACTOR', 'LEAD'].includes(p.roleType)).map((p) => p.person.canonicalName),
                genres: m.genres.map((g) => g.genre.canonicalName),
              },
              matchType: 'NORMALIZED_TITLE_YEAR',
              confidence: 'MEDIUM',
            });
          }
        }
      }
    }

    // Provenance from IngestionCandidate if available
    const candidate = movie.tmdbId
      ? await prisma.ingestionCandidate.findFirst({
          where: { sourceMovieId: String(movie.tmdbId) },
        })
      : null;

    return {
      movie: {
        id: movie.id,
        slug: movie.slug,
        primaryTitle: movie.primaryTitle,
        originalTitle: movie.originalTitle,
        alternativeTitles: movie.alternativeTitles,
        supportedLanguages: movie.supportedLanguages,
        industries: movie.industries.map(String),
        countries: movie.countries,
        releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : null,
        releaseYear: movie.releaseYear,
        certification: movie.certification,
        budget: movie.budget,
        budgetCurrency: movie.budgetCurrency,
        boxOffice: movie.boxOffice,
        boxOfficeCurrency: movie.boxOfficeCurrency,
        boxOfficeStatus: movie.boxOfficeStatus,
        rating: movie.rating,
        ratingVoteCount: movie.ratingVoteCount,
        posterAsset: movie.posterAsset,
        backdropAsset: movie.backdropAsset,
        franchise: movie.franchise,
        lifecycleStatus: movie.lifecycleStatus,
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId,
        wikidataId: movie.wikidataId,
        createdAt: movie.createdAt.toISOString(),
        updatedAt: movie.updatedAt.toISOString(),
      },
      eligibility: movie.eligibility
        ? {
            id: movie.eligibility.id,
            playableAsGuess: movie.eligibility.playableAsGuess,
            playableAsTarget: movie.eligibility.playableAsTarget,
            minimumMetadataComplete: movie.eligibility.minimumMetadataComplete,
            reviewStatus: movie.eligibility.reviewStatus,
            disabledReason: movie.eligibility.disabledReason,
            updatedAt: movie.eligibility.updatedAt.toISOString(),
          }
        : null,
      people: movie.people.map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        roleType: p.roleType,
        relationType: p.relationType,
        billingOrder: p.billingOrder,
        job: p.job,
        department: p.department,
      })),
      genres: movie.genres.map((g) => g.genre.canonicalName),
      productionHouses: movie.productionHouses.map((ph) => ph.productionHouse.canonicalName),
      clueAnalysis,
      targetReferences: {
        dailyPuzzles,
        challenges,
        games,
        isTarget: dailyPuzzles > 0 || challenges > 0 || games > 0,
      },
      suspectedDuplicates,
      candidateProvenance: candidate
        ? {
            source: candidate.source,
            sourceMovieId: candidate.sourceMovieId,
            discoveredAt: candidate.discoveredAt.toISOString(),
            discoveryReason: candidate.discoveryReason || undefined,
            duplicateOfMovieId: candidate.duplicateOfMovieId,
          }
        : null,
    };
  }

  /**
   * Return server-side aggregated metrics for the review queue.
   */
  async getReviewStats(): Promise<ReviewQueueStats> {
    const pendingEligibilities = await prisma.gameEligibility.findMany({
      where: { reviewStatus: 'PENDING' },
      include: {
        movie: {
          select: {
            id: true,
            primaryTitle: true,
            releaseYear: true,
            supportedLanguages: true,
            posterAsset: true,
            tmdbId: true,
            people: { select: { roleType: true, job: true } },
            genres: { select: { genreId: true } },
          },
        },
      },
    });

    const totalPending = pendingEligibilities.length;
    let telugu = 0;
    let hindi = 0;
    let y2002_2009 = 0;
    let y2010_2019 = 0;
    let y2020_2026 = 0;
    let playableAsGuess = 0;
    let playableAsTarget = 0;
    let playableBoth = 0;
    let missingPoster = 0;
    let missingTmdb = 0;

    const byReason: Record<string, number> = {
      INSUFFICIENT_CLUE_COVERAGE: 0,
      MISSING_DIRECTOR: 0,
      MISSING_CAST_DATA: 0,
      MISSING_GENRES: 0,
      MISSING_POSTER: 0,
      MISSING_EXTERNAL_ID: 0,
    };

    for (const e of pendingEligibilities) {
      const m = e.movie;
      if (!m) continue;

      if (m.supportedLanguages.includes('TELUGU')) telugu++;
      if (m.supportedLanguages.includes('HINDI')) hindi++;

      if (m.releaseYear >= 2002 && m.releaseYear <= 2009) y2002_2009++;
      else if (m.releaseYear >= 2010 && m.releaseYear <= 2019) y2010_2019++;
      else if (m.releaseYear >= 2020) y2020_2026++;

      if (e.playableAsGuess) playableAsGuess++;
      if (e.playableAsTarget) playableAsTarget++;
      if (e.playableAsGuess && e.playableAsTarget) playableBoth++;

      if (!m.posterAsset) missingPoster++;
      if (!m.tmdbId) missingTmdb++;

      // Clue coverage evaluation
      const hasDirector = m.people.some((p) => p.roleType === 'DIRECTOR' || p.job === 'Director');
      const castCount = m.people.filter((p) =>
        ['LEAD_ACTOR', 'LEAD_ACTRESS', 'SUPPORTING_CAST', 'LEAD', 'SUPPORTING', 'CAST'].includes(p.roleType)
      ).length;
      const hasCast = castCount >= 2;
      const hasGenres = m.genres.length >= 1;
      const hasYear = m.releaseYear >= 2002;
      const isTarget = hasDirector && hasCast && hasGenres && hasYear;

      if (!hasDirector) byReason.MISSING_DIRECTOR++;
      if (!hasCast) byReason.MISSING_CAST_DATA++;
      if (!hasGenres) byReason.MISSING_GENRES++;
      if (!m.posterAsset) byReason.MISSING_POSTER++;
      if (!m.tmdbId) byReason.MISSING_EXTERNAL_ID++;
      if (!isTarget) byReason.INSUFFICIENT_CLUE_COVERAGE++;
    }

    const potentialDuplicates = await prisma.ingestionCandidate.count({
      where: { status: 'DUPLICATE' },
    });

    return {
      totalPending,
      byReason,
      byLanguage: { telugu, hindi },
      byYearGroup: {
        '2002-2009': y2002_2009,
        '2010-2019': y2010_2019,
        '2020-2026': y2020_2026,
      },
      playableAsGuess,
      playableAsTarget,
      playableBoth,
      missingPoster,
      missingTmdb,
      potentialDuplicates,
    };
  }

  /**
   * Safe Approval Workflow:
   * Re-evaluates playability against strict 11-clue engine rules.
   * Updates GameEligibility to APPROVED.
   * If complete clues: sets playableAsTarget = true.
   * If incomplete clues: sets playableAsTarget = false (guess playable only).
   */
  async approveMovie(
    movieId: string,
    actorId = 'admin',
    reason = 'Approved by administrator'
  ): Promise<{
    success: boolean;
    movieId: string;
    reviewStatus: ReviewStatus;
    playableAsGuess: boolean;
    playableAsTarget: boolean;
    disabledReason: string | null;
  }> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        eligibility: true,
        people: {
          include: {
            person: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        productionHouses: {
          include: {
            productionHouse: true,
          },
        },
      },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${movieId} not found`, 404);
    }

    const before = movie.eligibility;
    const clueAnalysis = this.evaluateClueCoverage(movie);

    const isTargetPlayable = clueAnalysis.isTargetPlayable;
    const disabledReason = isTargetPlayable ? null : 'INSUFFICIENT_CLUE_COVERAGE';

    const after = await prisma.gameEligibility.upsert({
      where: { movieId },
      create: {
        movieId,
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: isTargetPlayable,
        reviewStatus: 'APPROVED',
        disabledReason,
        updatedAt: new Date(),
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: isTargetPlayable,
        reviewStatus: 'APPROVED',
        disabledReason,
        updatedAt: new Date(),
      },
    });

    await this.logAudit({
      actorId,
      action: 'APPROVE_MOVIE',
      entityType: 'Movie',
      entityId: movieId,
      before,
      after,
      reason,
    });

    return {
      success: true,
      movieId,
      reviewStatus: after.reviewStatus,
      playableAsGuess: after.playableAsGuess,
      playableAsTarget: after.playableAsTarget,
      disabledReason: after.disabledReason,
    };
  }

  /**
   * Safe Rejection Workflow:
   * STRICT TARGET IMMUTABILITY: Throws 409 if referenced by any game target!
   * Sets lifecycleStatus = 'REJECTED' and disables playability.
   */
  async rejectMovie(
    movieId: string,
    reason = 'Rejected by administrator',
    actorId = 'admin'
  ): Promise<{
    success: boolean;
    movieId: string;
    lifecycleStatus: LifecycleStatus;
    reviewStatus: ReviewStatus;
  }> {
    await this.assertTargetImmutability(movieId, 'REJECT');

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { eligibility: true },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${movieId} not found`, 404);
    }

    const before = {
      lifecycleStatus: movie.lifecycleStatus,
      eligibility: movie.eligibility,
    };

    const [updatedMovie, updatedEligibility] = await prisma.$transaction([
      prisma.movie.update({
        where: { id: movieId },
        data: { lifecycleStatus: 'REJECTED' },
      }),
      prisma.gameEligibility.upsert({
        where: { movieId },
        create: {
          movieId,
          playableAsGuess: false,
          playableAsTarget: false,
          minimumMetadataComplete: false,
          reviewStatus: 'REJECTED',
          disabledReason: reason,
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: false,
          playableAsTarget: false,
          minimumMetadataComplete: false,
          reviewStatus: 'REJECTED',
          disabledReason: reason,
          updatedAt: new Date(),
        },
      }),
    ]);

    await this.logAudit({
      actorId,
      action: 'REJECT_MOVIE',
      entityType: 'Movie',
      entityId: movieId,
      before,
      after: {
        lifecycleStatus: updatedMovie.lifecycleStatus,
        eligibility: updatedEligibility,
      },
      reason,
    });

    return {
      success: true,
      movieId,
      lifecycleStatus: updatedMovie.lifecycleStatus,
      reviewStatus: updatedEligibility.reviewStatus,
    };
  }

  /**
   * Return Movie to Review Workflow:
   * Resets reviewStatus to PENDING.
   */
  async returnMovieToReview(
    movieId: string,
    reason = 'Returned to review queue by administrator',
    actorId = 'admin'
  ): Promise<{
    success: boolean;
    movieId: string;
    reviewStatus: ReviewStatus;
  }> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { eligibility: true },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${movieId} not found`, 404);
    }

    const before = movie.eligibility;

    const [updatedMovie, after] = await prisma.$transaction([
      prisma.movie.update({
        where: { id: movieId },
        data: { lifecycleStatus: 'ACTIVE' },
      }),
      prisma.gameEligibility.upsert({
        where: { movieId },
        create: {
          movieId,
          playableAsGuess: true,
          playableAsTarget: false,
          reviewStatus: 'PENDING',
          disabledReason: reason,
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: true,
          reviewStatus: 'PENDING',
          disabledReason: reason,
          updatedAt: new Date(),
        },
      }),
    ]);

    await this.logAudit({
      actorId,
      action: 'RETURN_TO_REVIEW',
      entityType: 'Movie',
      entityId: movieId,
      before,
      after,
      reason,
    });

    return {
      success: true,
      movieId,
      reviewStatus: after.reviewStatus,
    };
  }

  /**
   * Duplicate Curation & Safe Merge Workflow:
   * NON-NEGOTIABLE TARGET IMMUTABILITY: Ensures duplicateMovieId is not an active game target.
   * Merges duplicate metadata into primary movie safely without data loss.
   */
  async mergeDuplicateMovie(
    primaryMovieId: string,
    duplicateMovieId: string,
    actorId = 'admin',
    reason = 'Duplicate curation merge'
  ): Promise<{
    success: boolean;
    primaryMovieId: string;
    duplicateMovieId: string;
    mergedFields: string[];
  }> {
    if (primaryMovieId === duplicateMovieId) {
      throw new AppError('INVALID_MERGE', 'Cannot merge a movie into itself.', 400);
    }

    // 1. Strict Target Immutability check on duplicate
    await this.assertTargetImmutability(duplicateMovieId, 'MERGE (as duplicate)');

    const [primary, duplicate] = await Promise.all([
      prisma.movie.findUnique({
        where: { id: primaryMovieId },
        include: {
          eligibility: true,
          genres: true,
          people: true,
          productionHouses: true,
        },
      }),
      prisma.movie.findUnique({
        where: { id: duplicateMovieId },
        include: {
          eligibility: true,
          genres: true,
          people: true,
          productionHouses: true,
        },
      }),
    ]);

    if (!primary || !duplicate) {
      throw new AppError('MOVIE_NOT_FOUND', 'One or both movies not found for duplicate merge.', 404);
    }

    const mergedFields: string[] = [];

    return prisma.$transaction(async (tx) => {
      // 1. Poster preservation: If primary lacks poster but duplicate has one, copy it
      const movieUpdates: any = {};
      if (!primary.posterAsset && duplicate.posterAsset) {
        movieUpdates.posterAsset = duplicate.posterAsset;
        if (!primary.backdropAsset && duplicate.backdropAsset) {
          movieUpdates.backdropAsset = duplicate.backdropAsset;
        }
        mergedFields.push('posterAsset');
      }

      // 2. Alternative titles preservation: Combine unique titles
      const combinedAlts = Array.from(
        new Set([...(primary.alternativeTitles || []), ...(duplicate.alternativeTitles || []), duplicate.primaryTitle])
      ).filter((t) => t !== primary.primaryTitle);

      if (combinedAlts.length > (primary.alternativeTitles || []).length) {
        movieUpdates.alternativeTitles = combinedAlts;
        mergedFields.push('alternativeTitles');
      }

      // 3. External IDs preservation
      if (!primary.tmdbId && duplicate.tmdbId) {
        movieUpdates.tmdbId = duplicate.tmdbId;
        mergedFields.push('tmdbId');
      }
      if (!primary.imdbId && duplicate.imdbId) {
        movieUpdates.imdbId = duplicate.imdbId;
        mergedFields.push('imdbId');
      }
      if (!primary.wikidataId && duplicate.wikidataId) {
        movieUpdates.wikidataId = duplicate.wikidataId;
        mergedFields.push('wikidataId');
      }

      if (Object.keys(movieUpdates).length > 0) {
        await tx.movie.update({
          where: { id: primaryMovieId },
          data: movieUpdates,
        });
      }

      // 4. Preserve genres
      for (const g of duplicate.genres) {
        const exists = primary.genres.some((pg) => pg.genreId === g.genreId);
        if (!exists) {
          await tx.movieGenre.create({
            data: {
              movieId: primaryMovieId,
              genreId: g.genreId,
            },
          });
          mergedFields.push(`genre:${g.genreId}`);
        }
      }

      // 5. Preserve key people (directors/cast)
      for (const p of duplicate.people) {
        const exists = primary.people.some(
          (pp) => pp.personId === p.personId && pp.roleType === p.roleType
        );
        if (!exists) {
          await tx.moviePerson.create({
            data: {
              movieId: primaryMovieId,
              personId: p.personId,
              relationType: p.relationType,
              roleType: p.roleType,
              characterName: p.characterName,
              billingOrder: p.billingOrder,
              job: p.job,
              department: p.department,
            },
          });
          mergedFields.push(`person:${p.personId}`);
        }
      }

      // 6. Re-link past player guesses
      await tx.gameGuess.updateMany({
        where: { movieId: duplicateMovieId },
        data: { movieId: primaryMovieId },
      });

      // 7. Update duplicate candidate references
      await tx.ingestionCandidate.updateMany({
        where: { duplicateOfMovieId: duplicateMovieId },
        data: { duplicateOfMovieId: primaryMovieId },
      });

      // 8. Mark duplicate movie as MERGED
      await tx.movie.update({
        where: { id: duplicateMovieId },
        data: { lifecycleStatus: 'MERGED' },
      });

      // 9. Disable duplicate eligibility
      await tx.gameEligibility.upsert({
        where: { movieId: duplicateMovieId },
        create: {
          movieId: duplicateMovieId,
          playableAsGuess: false,
          playableAsTarget: false,
          minimumMetadataComplete: false,
          reviewStatus: 'REJECTED',
          disabledReason: `Merged into ${primary.primaryTitle} (${primaryMovieId})`,
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: false,
          playableAsTarget: false,
          minimumMetadataComplete: false,
          reviewStatus: 'REJECTED',
          disabledReason: `Merged into ${primary.primaryTitle} (${primaryMovieId})`,
          updatedAt: new Date(),
        },
      });

      // 10. Recalculate primary playability
      const updatedPrimary = await tx.movie.findUnique({
        where: { id: primaryMovieId },
        include: { people: true, genres: true },
      });
      const analysis = this.evaluateClueCoverage(updatedPrimary);

      await tx.gameEligibility.upsert({
        where: { movieId: primaryMovieId },
        create: {
          movieId: primaryMovieId,
          playableAsGuess: true,
          playableAsTarget: analysis.isTargetPlayable,
          minimumMetadataComplete: analysis.isTargetPlayable,
          reviewStatus: analysis.isTargetPlayable ? 'APPROVED' : 'PENDING',
          disabledReason: analysis.isTargetPlayable ? null : 'INSUFFICIENT_CLUE_COVERAGE',
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: true,
          playableAsTarget: analysis.isTargetPlayable,
          minimumMetadataComplete: analysis.isTargetPlayable,
          reviewStatus: analysis.isTargetPlayable ? 'APPROVED' : primary.eligibility?.reviewStatus || 'PENDING',
          disabledReason: analysis.isTargetPlayable ? null : 'INSUFFICIENT_CLUE_COVERAGE',
          updatedAt: new Date(),
        },
      });

      // 11. Log Audit record
      await tx.auditLog.create({
        data: {
          actorId,
          actorRole: 'SUPER_ADMIN',
          action: 'MERGE_DUPLICATE_MOVIE',
          entityType: 'Movie',
          entityId: primaryMovieId,
          before: {
            primaryMovieId,
            duplicateMovieId,
            duplicateTitle: duplicate.primaryTitle,
          },
          after: {
            primaryMovieId,
            mergedFields,
            newPlayableAsTarget: analysis.isTargetPlayable,
          },
          reason,
        },
      });

      return {
        success: true,
        primaryMovieId,
        duplicateMovieId,
        mergedFields,
      };
    });
  }

  /**
   * Request single-movie enrichment on demand from review queue.
   */
  async enrichSingleMovie(movieId: string, actorId = 'admin'): Promise<EnrichmentResult> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { eligibility: true },
    });

    if (!movie) {
      throw new AppError('MOVIE_NOT_FOUND', `Movie with ID ${movieId} not found`, 404);
    }

    const before = movie.eligibility;
    const res = await enrichmentService.enrichMovie(movieId);

    const after = await prisma.gameEligibility.findUnique({ where: { movieId } });

    await this.logAudit({
      actorId,
      action: 'ENRICH_MOVIE_SINGLE',
      entityType: 'Movie',
      entityId: movieId,
      before,
      after,
      reason: res.reason || 'Single movie enrichment from review queue',
    });

    return res;
  }

  /**
   * Batch recalculate playability / auto-approve candidates meeting all 11-clue engine requirements.
   * Supports dry-run simulation and controlled live mode.
   */
  async batchProcessEligibleMovies(options: { dryRun?: boolean; limit?: number; actorId?: string } = {}): Promise<{
    mode: 'DRY_RUN' | 'LIVE';
    totalEvaluated: number;
    approvedCount: number;
    remainsPendingCount: number;
    approvedMovies: Array<{ id: string; title: string; releaseYear: number }>;
  }> {
    const dryRun = options.dryRun !== false;
    const limit = options.limit || 50;
    const actorId = options.actorId || 'admin';

    const pending = await prisma.gameEligibility.findMany({
      where: { reviewStatus: 'PENDING' },
      include: {
        movie: {
          include: { people: true, genres: true },
        },
      },
      take: limit,
    });

    const approvedMovies: Array<{ id: string; title: string; releaseYear: number }> = [];
    let remainsPendingCount = 0;

    for (const e of pending) {
      const m = e.movie;
      if (!m) continue;

      const analysis = this.evaluateClueCoverage(m);
      if (analysis.isTargetPlayable) {
        approvedMovies.push({ id: m.id, title: m.primaryTitle, releaseYear: m.releaseYear });
        if (!dryRun) {
          await this.approveMovie(m.id, actorId, 'Batch automated verification (100% complete clues)');
        }
      } else {
        remainsPendingCount++;
      }
    }

    return {
      mode: dryRun ? 'DRY_RUN' : 'LIVE',
      totalEvaluated: pending.length,
      approvedCount: approvedMovies.length,
      remainsPendingCount,
      approvedMovies,
    };
  }
}

export const catalogReviewService = new CatalogReviewService();
