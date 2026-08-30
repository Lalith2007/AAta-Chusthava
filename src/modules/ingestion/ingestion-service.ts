import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter, MovieDataSource, TmdbMovieDetails, TmdbCredits } from '@/infrastructure/external-sources/tmdb-adapter';
import { MovieLanguage, MovieIndustry, RoleType, RelationType, ProductionHouseRole } from '@/domain/movie/types';
import { queueService } from '@/infrastructure/queue/queue-service';

export interface IngestionResult {
  candidateId: string;
  movieId?: string;
  status: 'PROCESSED' | 'REVIEW_REQUIRED' | 'SKIPPED' | 'FAILED';
  title: string;
  reason?: string;
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
      const existing = await prisma.ingestionCandidate.findUnique({
        where: {
          source_sourceMovieId: {
            source: 'TMDB',
            sourceMovieId: item.sourceMovieId,
          },
        },
      });

      if (!existing) {
        await prisma.ingestionCandidate.create({
          data: {
            source: 'TMDB',
            sourceMovieId: item.sourceMovieId,
            discoveryReason: `Discovery ${languageCode.toUpperCase()} ${year} p${page}`,
            status: 'DISCOVERED',
          },
        });
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

      // 1. Fetch details & credits
      const details = await this.sourceAdapter.getMovieDetails(candidate.sourceMovieId);
      const credits = await this.sourceAdapter.getCredits(candidate.sourceMovieId);
      const altTitles = await this.sourceAdapter.getAlternativeTitles(candidate.sourceMovieId);

      // 2. Store Raw Source Record
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
          data: { status: 'REJECTED', error: 'Release year prior to 2002 or invalid' },
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

      // 3. Check for duplicates in normalized movie DB
      let movie = await prisma.movie.findUnique({
        where: { tmdbId: details.id },
      });

      const posterAsset = details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null;
      const backdropAsset = details.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null;

      const boxOffice = details.revenue && details.revenue > 0 ? details.revenue * 83 : null; // approx INR conversion if in USD
      const boxOfficeStatus = boxOffice ? 'REPORTED' : 'UNKNOWN';

      if (!movie) {
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
            budget: details.budget && details.budget > 0 ? details.budget * 83 : null,
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

      // 4. Ingest Genres
      for (const g of details.genres) {
        const genreRecord = await prisma.genre.upsert({
          where: { tmdbId: g.id },
          create: {
            tmdbId: g.id,
            canonicalName: g.name,
            slug: g.name.toLowerCase().replace(/[^\w]/g, '-'),
          },
          update: { canonicalName: g.name },
        });

        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: genreRecord.id,
            },
          },
          create: { movieId: movie.id, genreId: genreRecord.id },
          update: {},
        });
      }

      // 5. Ingest Production Companies
      for (const pc of details.production_companies) {
        const ph = await prisma.productionHouse.upsert({
          where: { tmdbId: pc.id },
          create: {
            tmdbId: pc.id,
            canonicalName: pc.name,
            alternateNames: [],
          },
          update: { canonicalName: pc.name },
        });

        await prisma.movieProductionHouse.upsert({
          where: {
            movieId_productionHouseId_relationshipType: {
              movieId: movie.id,
              productionHouseId: ph.id,
              relationshipType: 'PRODUCTION',
            },
          },
          create: {
            movieId: movie.id,
            productionHouseId: ph.id,
            relationshipType: 'PRODUCTION',
          },
          update: {},
        });
      }

      // 6. Ingest Directors and Crew
      const directors = credits.crew.filter((c) => c.job === 'Director');
      for (const d of directors) {
        const person = await prisma.person.upsert({
          where: { tmdbId: d.id },
          create: {
            tmdbId: d.id,
            canonicalName: d.name,
            image: d.profile_path ? `https://image.tmdb.org/t/p/w300${d.profile_path}` : null,
          },
          update: { canonicalName: d.name },
        });

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
        const person = await prisma.person.upsert({
          where: { tmdbId: m.id },
          create: {
            tmdbId: m.id,
            canonicalName: m.name,
            image: m.profile_path ? `https://image.tmdb.org/t/p/w300${m.profile_path}` : null,
          },
          update: { canonicalName: m.name },
        });

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

      // Cast (Lead and Supporting)
      const topCast = credits.cast.slice(0, 10);
      for (let i = 0; i < topCast.length; i++) {
        const c = topCast[i];
        const person = await prisma.person.upsert({
          where: { tmdbId: c.id },
          create: {
            tmdbId: c.id,
            canonicalName: c.name,
            image: c.profile_path ? `https://image.tmdb.org/t/p/w300${c.profile_path}` : null,
          },
          update: { canonicalName: c.name },
        });

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
            characterName: c.character || null,
            billingOrder: c.order,
          },
          update: {},
        });
      }

      // 7. Quality Validation & Eligibility
      const hasDirector = directors.length > 0;
      const hasCast = topCast.length > 0;
      const isTargetPlayable = hasDirector && hasCast && (details.vote_count || 0) >= 5;

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
        where: { id: candidateId },
        data: {
          status: 'NORMALIZED',
          rawSourceRecordId: rawRecord.id,
        },
      });

      return {
        candidateId,
        movieId: movie.id,
        status: isTargetPlayable ? 'PROCESSED' : 'REVIEW_REQUIRED',
        title: movie.primaryTitle,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.ingestionCandidate.update({
        where: { id: candidateId },
        data: { status: 'FAILED', error: errorMsg },
      });
      return { candidateId, status: 'FAILED', title: '', reason: errorMsg };
    }
  }

  async runHistoricalBatch(startYear = 2002, endYear = 2026) {
    const job = await queueService.enqueue('DISCOVER_RELEASES', { startYear, endYear });
    return job;
  }
}

export const ingestionService = new IngestionService();
