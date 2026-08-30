import { prisma } from '@/infrastructure/db/client';
import { NormalizedMovie, MovieSearchResult, MovieLanguage } from '@/domain/movie/types';
import { Movie, Person, MoviePerson, ProductionHouse, Genre, GameEligibility } from '@prisma/client';

type FullMovieRecord = Movie & {
  people: (MoviePerson & { person: Person })[];
  productionHouses: {
    relationshipType: any;
    productionHouse: ProductionHouse;
  }[];
  genres: {
    genre: Genre;
  }[];
  eligibility: GameEligibility | null;
};

export class MovieRepository {
  static normalizeRecord(m: FullMovieRecord): NormalizedMovie {
    const directors = m.people
      .filter((p) => p.roleType === 'DIRECTOR' || p.job === 'Director')
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    const musicDirectors = m.people
      .filter((p) => p.roleType === 'MUSIC_DIRECTOR' || p.job === 'Original Music Composer')
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    const leadActors = m.people
      .filter((p) => p.roleType === 'LEAD' && p.relationType === 'CAST')
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    // In case no explicitly tagged lead actresses, check female leads or fallback to cast
    const leadActresses = m.people
      .filter((p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING') && p.relationType === 'CAST')
      .slice(0, 2)
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    const supportingCast = m.people
      .filter((p) => p.relationType === 'CAST' && p.roleType === 'SUPPORTING')
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    const crew = m.people
      .filter((p) => p.relationType === 'CREW')
      .map((p) => ({
        id: p.person.id,
        canonicalName: p.person.canonicalName,
        alternateNames: p.person.alternateNames,
        tmdbId: p.person.tmdbId,
        imdbId: p.person.imdbId,
        image: p.person.image,
        roleType: p.roleType,
        relationType: p.relationType,
        characterName: p.characterName,
        billingOrder: p.billingOrder,
      }));

    const productionHouses = m.productionHouses.map((ph) => ({
      id: ph.productionHouse.id,
      canonicalName: ph.productionHouse.canonicalName,
      alternateNames: ph.productionHouse.alternateNames,
      parentCompanyId: ph.productionHouse.parentCompanyId,
      relationshipType: ph.relationshipType,
    }));

    const genres = m.genres.map((g) => ({
      id: g.genre.id,
      canonicalName: g.genre.canonicalName,
      slug: g.genre.slug,
    }));

    return {
      id: m.id,
      slug: m.slug,
      primaryTitle: m.primaryTitle,
      originalTitle: m.originalTitle,
      alternativeTitles: m.alternativeTitles,
      supportedLanguages: m.supportedLanguages,
      industries: m.industries,
      countries: m.countries,
      releaseDate: m.releaseDate,
      releaseYear: m.releaseYear,
      canonicalIndiaReleaseDate: m.canonicalIndiaReleaseDate,
      certification: m.certification,
      budget: m.budget,
      budgetCurrency: m.budgetCurrency,
      boxOffice: m.boxOffice,
      boxOfficeCurrency: m.boxOfficeCurrency,
      boxOfficeStatus: m.boxOfficeStatus,
      boxOfficeSource: m.boxOfficeSource,
      boxOfficeVerifiedAt: m.boxOfficeVerifiedAt,
      rating: m.rating,
      ratingVoteCount: m.ratingVoteCount,
      ratingSource: m.ratingSource,
      ratingUpdatedAt: m.ratingUpdatedAt,
      posterAsset: m.posterAsset,
      backdropAsset: m.backdropAsset,
      franchise: m.franchise,
      lifecycleStatus: m.lifecycleStatus,
      tmdbId: m.tmdbId,
      imdbId: m.imdbId,
      wikidataId: m.wikidataId,
      directors,
      musicDirectors,
      leadActors,
      leadActresses,
      supportingCast,
      crew,
      productionHouses,
      genres,
      playableAsGuess: m.eligibility?.playableAsGuess ?? true,
      playableAsTarget: m.eligibility?.playableAsTarget ?? true,
    };
  }

  async findById(id: string): Promise<NormalizedMovie | null> {
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        productionHouses: { include: { productionHouse: true } },
        genres: { include: { genre: true } },
        eligibility: true,
      },
    });

    if (!movie) return null;
    return MovieRepository.normalizeRecord(movie as unknown as FullMovieRecord);
  }

  async findBySlug(slug: string): Promise<NormalizedMovie | null> {
    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        people: { include: { person: true } },
        productionHouses: { include: { productionHouse: true } },
        genres: { include: { genre: true } },
        eligibility: true,
      },
    });

    if (!movie) return null;
    return MovieRepository.normalizeRecord(movie as unknown as FullMovieRecord);
  }

  async search(
    query: string,
    options: {
      playableAsGuessOnly?: boolean;
      playableAsTargetOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<MovieSearchResult[]> {
    const limit = options.limit || 15;
    const cleanQuery = query.trim().toLowerCase();

    const movies = await prisma.movie.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        AND: [
          cleanQuery
            ? {
                OR: [
                  { primaryTitle: { contains: cleanQuery, mode: 'insensitive' } },
                  { originalTitle: { contains: cleanQuery, mode: 'insensitive' } },
                  { alternativeTitles: { hasSome: [cleanQuery] } },
                ],
              }
            : {},
          options.playableAsGuessOnly
            ? {
                eligibility: {
                  playableAsGuess: true,
                },
              }
            : {},
          options.playableAsTargetOnly
            ? {
                eligibility: {
                  playableAsTarget: true,
                },
              }
            : {},
        ],
      },
      include: {
        people: { include: { person: true } },
        eligibility: true,
      },
      orderBy: [{ ratingVoteCount: 'desc' }, { releaseYear: 'desc' }],
      take: limit,
    });

    return movies.map((m) => {
      const directors = m.people
        .filter((p) => p.roleType === 'DIRECTOR' || p.job === 'Director')
        .map((p) => p.person.canonicalName);
      const leadCast = m.people
        .filter((p) => p.relationType === 'CAST')
        .slice(0, 3)
        .map((p) => p.person.canonicalName);

      return {
        id: m.id,
        primaryTitle: m.primaryTitle,
        originalTitle: m.originalTitle,
        releaseYear: m.releaseYear,
        supportedLanguages: m.supportedLanguages,
        industries: m.industries,
        posterAsset: m.posterAsset,
        directorNames: directors,
        leadCastNames: leadCast,
        playableAsGuess: m.eligibility?.playableAsGuess ?? true,
        playableAsTarget: m.eligibility?.playableAsTarget ?? true,
      };
    });
  }

  async findRandomTargetEligible(language?: MovieLanguage): Promise<NormalizedMovie | null> {
    const eligibleMovies = await prisma.movie.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        eligibility: {
          playableAsTarget: true,
        },
        ...(language ? { supportedLanguages: { has: language } } : {}),
      },
      select: { id: true },
    });

    if (eligibleMovies.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * eligibleMovies.length);
    const selectedId = eligibleMovies[randomIndex].id;
    return this.findById(selectedId);
  }
}

export const movieRepository = new MovieRepository();
