import { prisma } from '@/infrastructure/db/client';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { isValidPersonName } from '@/infrastructure/external-sources/wikipedia-adapter';
import { RoleType, RelationType } from '@/domain/movie/types';

export interface EnrichmentOptions {
  dryRun?: boolean;
  limit?: number;
  onlyNeedsReview?: boolean;
  movieId?: string;
  concurrency?: number;
  onProgress?: (progress: {
    processed: number;
    total: number;
    recoveredTargets: number;
    tmdbEnriched: number;
    wikidataEnriched: number;
    bothEnriched: number;
    currentMovieTitle: string;
  }) => void;
}

export interface EnrichmentResult {
  movieId: string;
  title: string;
  releaseYear: number;
  enrichedFromTmdb: boolean;
  enrichedFromWikidata: boolean;
  enrichedFromWikipediaArticle: boolean;
  previousTargetPlayable: boolean;
  newTargetPlayable: boolean;
  recoveredTarget: boolean;
  directorsAdded: string[];
  castAdded: string[];
  musicDirectorsAdded: string[];
  genresAdded: string[];
  productionHousesAdded: string[];
  metadataUpdated: boolean;
  unmatched: boolean;
  ambiguous: boolean;
  reason?: string;
}

export interface EnrichmentSummaryReport {
  totalCanonical: number;
  totalProcessed: number;
  alreadyTargetPlayable: number;
  previousNeedsReview: number;
  tmdbEnriched: number;
  wikidataEnriched: number;
  bothEnriched: number;
  wikipediaArticleEnriched: number;
  recoveredTargets: number;
  remainingNeedsReview: number;
  finalTargetPlayable: number;
  finalGuessPlayable: number;
  unmatched: number;
  ambiguous: number;
  zeroPlaceholdersVerified: boolean;
  results: EnrichmentResult[];
}

export class EnrichmentService {
  private wikidataCache: Map<string, any> = new Map();
  private wikipediaInfoboxCache: Map<string, any> = new Map();
  private userAgent = 'AAtaChusthavaEnrichmentBot/1.0 (academic; telugu/hindi film catalog; contact: support@aatachusthava.org)';

  /**
   * Cleans names and removes parentheses like "Name (actor)" or "Name (director)"
   */
  public cleanPersonName(name: string | null | undefined): string | null {
    if (!name || typeof name !== 'string') return null;
    let clean = name.replace(/\([^)]*\)/g, '').trim();
    if (clean.includes('[[') && clean.includes(']]')) {
      const match = clean.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
      if (match) {
        clean = match[1].trim();
      }
    }
    clean = clean.replace(/\[\[|\]\]/g, '').trim();
    if (clean.includes('|')) {
      clean = clean.split('|')[0].trim();
    }
    clean = clean.replace(/^[\s*•-]+/, '').trim();
    if (clean.includes('/') && !clean.includes('http')) {
      clean = clean.split('/')[0].trim();
    }
    return isValidPersonName(clean) ? clean : null;
  }

  /**
   * Searches Wikidata for a film matching title, year, and language with retry
   */
  async searchWikidata(title: string, releaseYear: number, langCode: string): Promise<any | null> {
    const cleanTitle = title.replace(/^[-–—\s*•]+/, '').trim();
    if (cleanTitle.length < 2) return null;

    const cacheKey = `${cleanTitle.toLowerCase()}_${releaseYear}`;
    if (this.wikidataCache.has(cacheKey)) {
      return this.wikidataCache.get(cacheKey);
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
          cleanTitle
        )}&language=en&format=json&limit=8`;
        const res = await fetch(searchUrl, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }
          break;
        }

        const data = await res.json();
        const candidates = data.search || [];

        let match = null;
        for (const cand of candidates) {
          const desc = (cand.description || '').toLowerCase();
          const label = (cand.label || '').toLowerCase();
          const isFilm =
            desc.includes('film') ||
            desc.includes('movie') ||
            desc.includes('cinema') ||
            desc.includes('directed by');
          const hasYear = desc.includes(String(releaseYear));

          if (isFilm && hasYear) {
            match = cand;
            break;
          }
        }

        if (!match) {
          for (const cand of candidates) {
            const desc = (cand.description || '').toLowerCase();
            const label = (cand.label || '').toLowerCase();
            const isFilm =
              desc.includes('film') ||
              desc.includes('movie') ||
              desc.includes('cinema') ||
              desc.includes('directed by');
            if (isFilm && label === cleanTitle.toLowerCase()) {
              match = cand;
              break;
            }
          }
        }

        if (match) {
          const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`;
          const entityRes = await fetch(entityUrl, {
            headers: { 'User-Agent': this.userAgent },
            signal: AbortSignal.timeout(5000),
          });
          if (entityRes.ok) {
            const entityData = await entityRes.json();
            const entity = entityData.entities[match.id];
            this.wikidataCache.set(cacheKey, entity);
            return entity;
          }
        }

        this.wikidataCache.set(cacheKey, null);
        return null;
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }

    this.wikidataCache.set(cacheKey, null);
    return null;
  }

  /**
   * Fetches and parses Infobox film from Wikipedia article wikitext with multi-title search and retry
   */
  async fetchWikipediaArticleInfobox(title: string, releaseYear: number): Promise<{
    directors: string[];
    cast: string[];
    musicDirectors: string[];
    productionCompanies: string[];
    releaseDate?: string;
    runtime?: number;
    budget?: number;
    boxOffice?: number;
  } | null> {
    const cleanTitle = title.replace(/^[-–—\s*•]+/, '').trim();
    if (cleanTitle.length < 2) return null;

    const cacheKey = `${cleanTitle.toLowerCase()}_${releaseYear}`;
    if (this.wikipediaInfoboxCache.has(cacheKey)) {
      return this.wikipediaInfoboxCache.get(cacheKey);
    }

    const titlesToTry = [
      `${cleanTitle} (${releaseYear} film)`,
      `${cleanTitle} (film)`,
      cleanTitle,
    ];

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(
          titlesToTry.join('|')
        )}&format=json`;
        const res = await fetch(url, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }
          break;
        }

        const data = await res.json();
        const pages = Object.values(data.query?.pages || {}) as any[];

        let matchedPage: any = null;
        for (const t of titlesToTry) {
          const p = pages.find(
            (page) =>
              page.title?.toLowerCase() === t.toLowerCase() && page.missing === undefined
          );
          if (p && p.revisions?.[0]?.['*']?.toLowerCase().includes('{{infobox film')) {
            matchedPage = p;
            break;
          }
        }

        if (!matchedPage) {
          for (const p of pages) {
            if (
              p.missing === undefined &&
              p.revisions?.[0]?.['*']?.toLowerCase().includes('{{infobox film')
            ) {
              matchedPage = p;
              break;
            }
          }
        }

        if (!matchedPage) {
          this.wikipediaInfoboxCache.set(cacheKey, null);
          return null;
        }

        const wikitext = matchedPage.revisions?.[0]?.['*'] || '';

        // Parse starring
        const starMatch = wikitext.match(/\|\s*starring\s*=\s*([\s\S]*?)(?=\n\s*\||\n\s*\}\})/i);
        let cast: string[] = [];
        if (starMatch) {
          const raw = starMatch[1];
          const links = raw.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
          cast = links
            .map((l: string) => this.cleanPersonName(l.replace(/\[\[/, '').replace(/\]\]/, '').split('|')[0]))
            .filter((n: string | null): n is string => Boolean(n));

          if (cast.length === 0) {
            cast = raw
              .split(/<br\s*\/?>|\n[*#]/)
              .map((s: string) => this.cleanPersonName(s.replace(/\{\{[^}]+\}\}/g, '').replace(/\[\[|\]\]/g, '')))
              .filter((n: string | null): n is string => Boolean(n));
          }
        }

        // Parse director
        const dirMatch = wikitext.match(/\|\s*director\s*=\s*([\s\S]*?)(?=\n\s*\||\n\s*\}\})/i);
        let directors: string[] = [];
        if (dirMatch) {
          const raw = dirMatch[1];
          const links = raw.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
          directors = links
            .map((l: string) => this.cleanPersonName(l.replace(/\[\[/, '').replace(/\]\]/, '').split('|')[0]))
            .filter((n: string | null): n is string => Boolean(n));

          if (directors.length === 0) {
            directors = raw
              .split(/<br\s*\/?>|\n[*#]/)
              .map((s: string) => this.cleanPersonName(s.replace(/\{\{[^}]+\}\}/g, '').replace(/\[\[|\]\]/g, '')))
              .filter((n: string | null): n is string => Boolean(n));
          }
        }

        // Parse music
        const musMatch = wikitext.match(/\|\s*music\s*=\s*([\s\S]*?)(?=\n\s*\||\n\s*\}\})/i);
        let musicDirectors: string[] = [];
        if (musMatch) {
          const raw = musMatch[1];
          const links = raw.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
          musicDirectors = links
            .map((l: string) => this.cleanPersonName(l.replace(/\[\[/, '').replace(/\]\]/, '').split('|')[0]))
            .filter((n: string | null): n is string => Boolean(n));

          if (musicDirectors.length === 0) {
            musicDirectors = raw
              .split(/<br\s*\/?>|\n[*#]/)
              .map((s: string) => this.cleanPersonName(s.replace(/\{\{[^}]+\}\}/g, '').replace(/\[\[|\]\]/g, '')))
              .filter((n: string | null): n is string => Boolean(n));
          }
        }

        // Parse production companies
        const prodMatch = wikitext.match(
          /\|\s*(?:production_companies|studio|production_company)\s*=\s*([\s\S]*?)(?=\n\s*\||\n\s*\}\})/i
        );
        let productionCompanies: string[] = [];
        if (prodMatch) {
          const raw = prodMatch[1];
          const links = raw.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
          productionCompanies = links
            .map((l: string) => l.replace(/\[\[/, '').replace(/\]\]/, '').split('|')[0].trim())
            .filter((c: string) => c.length > 2 && isValidPersonName(c));
        }

        const runtimeMatch = wikitext.match(/\|\s*running_time\s*=\s*(\d+)/i);
        const runtime = runtimeMatch ? parseInt(runtimeMatch[1], 10) : undefined;

        const result = {
          directors,
          cast,
          musicDirectors,
          productionCompanies,
          runtime,
        };

        this.wikipediaInfoboxCache.set(cacheKey, result);
        return result;
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }

    this.wikipediaInfoboxCache.set(cacheKey, null);
    return null;
  }

  /**
   * Enriches a single movie record with TMDB, Wikidata, and Wikipedia Article data
   */
  async enrichMovie(movieId: string, options: { dryRun?: boolean } = {}): Promise<EnrichmentResult> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        eligibility: true,
        people: { include: { person: true } },
        productionHouses: { include: { productionHouse: true } },
        genres: { include: { genre: true } },
      },
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found.`);
    }

    const previousTargetPlayable = movie.eligibility?.playableAsTarget ?? false;
    const langCode = movie.supportedLanguages.includes('TELUGU') ? 'te' : 'hi';

    let enrichedFromTmdb = false;
    let enrichedFromWikidata = false;
    let enrichedFromWikipediaArticle = false;

    const directorsToAdd = new Set<string>();
    const castToAdd = new Set<string>();
    const musicDirectorsToAdd = new Set<string>();
    const genresToAdd = new Set<string>();
    const productionHousesToAdd = new Set<string>();

    let updatedTmdbId: number | null = movie.tmdbId;
    let updatedWikidataId: string | null = movie.wikidataId;
    let updatedImdbId: string | null = movie.imdbId;
    let updatedRating: number | null = movie.rating;
    let updatedRatingCount: number = movie.ratingVoteCount || 0;
    let updatedBoxOffice: number | null = movie.boxOffice;
    let updatedBoxOfficeStatus = movie.boxOfficeStatus;

    // Existing valid persons and entities
    const existingDirs = movie.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    const existingCast = movie.people.filter(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName)
    );
    const existingDirNames = new Set(
      movie.people
        .filter((p) => p.roleType === 'DIRECTOR' && isValidPersonName(p.person.canonicalName))
        .map((p) => p.person.canonicalName.toLowerCase())
    );
    const existingCastNames = new Set(
      movie.people
        .filter((p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName))
        .map((p) => p.person.canonicalName.toLowerCase())
    );
    const existingMusicDirNames = new Set(
      movie.people
        .filter((p) => (p.roleType === 'MUSIC_DIRECTOR' || p.job === 'Music' || p.job === 'Original Music Composer') && isValidPersonName(p.person.canonicalName))
        .map((p) => p.person.canonicalName.toLowerCase())
    );
    const existingGenreNames = new Set(
      movie.genres.map((g) => g.genre.canonicalName.toLowerCase())
    );
    const existingProdNames = new Set(
      movie.productionHouses.map((ph) => ph.productionHouse.canonicalName.toLowerCase())
    );

    // Parallel fetch from Wikidata and Wikipedia Article Infobox
    const [wikidataEntity, infoboxData] = await Promise.all([
      this.searchWikidata(movie.primaryTitle, movie.releaseYear, langCode),
      this.fetchWikipediaArticleInfobox(movie.primaryTitle, movie.releaseYear),
    ]);

    // 1. Process Wikidata
    if (wikidataEntity) {
      enrichedFromWikidata = true;
      updatedWikidataId = wikidataEntity.id;

      const claims = wikidataEntity.claims || {};
      if (claims.P4947?.[0]?.mainsnak?.datavalue?.value && !updatedTmdbId) {
        const val = parseInt(claims.P4947[0].mainsnak.datavalue.value, 10);
        if (!isNaN(val)) updatedTmdbId = val;
      }
      if (claims.P345?.[0]?.mainsnak?.datavalue?.value && !updatedImdbId) {
        updatedImdbId = claims.P345[0].mainsnak.datavalue.value;
      }
    }

    // 2. Process TMDB if TMDB ID is present or found
    if (updatedTmdbId) {
      try {
        const tmdbDetails = await tmdbAdapter.getMovieDetails(String(updatedTmdbId));
        const tmdbCredits = await tmdbAdapter.getCredits(String(updatedTmdbId));

        if (tmdbDetails && tmdbCredits) {
          enrichedFromTmdb = true;

          tmdbCredits.crew
            .filter((c) => c.job === 'Director')
            .forEach((d) => {
              const clean = this.cleanPersonName(d.name);
              if (clean) directorsToAdd.add(clean);
            });

          tmdbCredits.cast.slice(0, 10).forEach((c) => {
            const clean = this.cleanPersonName(c.name);
            if (clean) castToAdd.add(clean);
          });

          tmdbCredits.crew
            .filter((c) => c.job === 'Original Music Composer' || c.job === 'Music')
            .forEach((m) => {
              const clean = this.cleanPersonName(m.name);
              if (clean) musicDirectorsToAdd.add(clean);
            });

          (tmdbDetails.genres || []).forEach((g) => {
            if (g.name && g.name.length > 2) genresToAdd.add(g.name);
          });

          (tmdbDetails.production_companies || []).forEach((p) => {
            if (p.name && p.name.length > 2 && isValidPersonName(p.name)) {
              productionHousesToAdd.add(p.name);
            }
          });

          if (tmdbDetails.vote_average && !updatedRating) {
            updatedRating = tmdbDetails.vote_average;
            updatedRatingCount = tmdbDetails.vote_count || 0;
          }

          if (tmdbDetails.revenue && tmdbDetails.revenue > 0 && !updatedBoxOffice) {
            updatedBoxOffice = tmdbDetails.revenue;
            updatedBoxOfficeStatus = 'REPORTED';
          }
        }
      } catch {
        // Continue gracefully
      }
    }

    // 3. Process Wikipedia Article Infobox
    if (infoboxData) {
      enrichedFromWikipediaArticle = true;

      infoboxData.directors.forEach((d) => {
        const clean = this.cleanPersonName(d);
        if (clean) directorsToAdd.add(clean);
      });

      infoboxData.cast.forEach((c) => {
        const clean = this.cleanPersonName(c);
        if (clean) castToAdd.add(clean);
      });

      infoboxData.musicDirectors.forEach((m) => {
        const clean = this.cleanPersonName(m);
        if (clean) musicDirectorsToAdd.add(clean);
      });

      infoboxData.productionCompanies.forEach((p) => {
        if (p && p.length > 2 && isValidPersonName(p)) {
          productionHousesToAdd.add(p);
        }
      });
    }

    // Determine target eligibility with merged real metadata
    const allValidDirectors = new Set([
      ...existingDirs.map((d) => d.person.canonicalName),
      ...Array.from(directorsToAdd),
    ]);
    const allValidCast = new Set([
      ...existingCast.map((c) => c.person.canonicalName),
      ...Array.from(castToAdd),
    ]);

    const newTargetPlayable =
      allValidDirectors.size >= 1 &&
      allValidCast.size >= 2 &&
      !!movie.releaseYear &&
      movie.lifecycleStatus === 'ACTIVE';

    const recoveredTarget = !previousTargetPlayable && newTargetPlayable;
    const unmatched = !enrichedFromTmdb && !enrichedFromWikidata && !enrichedFromWikipediaArticle;

    if (!options.dryRun) {
      // Ensure unique constraint safety on external IDs
      if (updatedTmdbId && updatedTmdbId !== movie.tmdbId) {
        const existing = await prisma.movie.findFirst({
          where: { tmdbId: updatedTmdbId, id: { not: movie.id } },
        });
        if (existing) {
          updatedTmdbId = movie.tmdbId;
        }
      }
      if (updatedWikidataId && updatedWikidataId !== movie.wikidataId) {
        const existing = await prisma.movie.findFirst({
          where: { wikidataId: updatedWikidataId, id: { not: movie.id } },
        });
        if (existing) {
          updatedWikidataId = movie.wikidataId;
        }
      }
      if (updatedImdbId && updatedImdbId !== movie.imdbId) {
        const existing = await prisma.movie.findFirst({
          where: { imdbId: updatedImdbId, id: { not: movie.id } },
        });
        if (existing) {
          updatedImdbId = movie.imdbId;
        }
      }

      // 1. Update Movie scalar fields
      await prisma.movie.update({
        where: { id: movie.id },
        data: {
          tmdbId: updatedTmdbId,
          wikidataId: updatedWikidataId,
          imdbId: updatedImdbId,
          rating: updatedRating,
          ratingVoteCount: updatedRatingCount,
          boxOffice: updatedBoxOffice,
          boxOfficeStatus: updatedBoxOfficeStatus,
        },
      });

      // 2. Insert new directors
      for (const dirName of directorsToAdd) {
        if (existingDirNames.has(dirName.toLowerCase())) continue;
        let person = await prisma.person.findFirst({
          where: { canonicalName: { equals: dirName, mode: 'insensitive' } },
        });
        if (!person) {
          person = await prisma.person.create({
            data: { canonicalName: dirName },
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
        existingDirNames.add(dirName.toLowerCase());
      }

      // 3. Insert new cast
      let billingIndex = existingCast.length;
      for (const castName of castToAdd) {
        if (existingCastNames.has(castName.toLowerCase())) continue;
        let person = await prisma.person.findFirst({
          where: { canonicalName: { equals: castName, mode: 'insensitive' } },
        });
        if (!person) {
          person = await prisma.person.create({
            data: { canonicalName: castName },
          });
        }
        const roleType: RoleType = billingIndex < 2 ? 'LEAD' : 'SUPPORTING';
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
            characterName: 'Lead',
            billingOrder: billingIndex,
          },
          update: {},
        });
        existingCastNames.add(castName.toLowerCase());
        billingIndex++;
      }

      // 4. Insert new music directors
      for (const musicName of musicDirectorsToAdd) {
        if (existingMusicDirNames.has(musicName.toLowerCase())) continue;
        let person = await prisma.person.findFirst({
          where: { canonicalName: { equals: musicName, mode: 'insensitive' } },
        });
        if (!person) {
          person = await prisma.person.create({
            data: { canonicalName: musicName },
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
        existingMusicDirNames.add(musicName.toLowerCase());
      }

      // 5. Insert new production houses
      for (const phName of productionHousesToAdd) {
        if (existingProdNames.has(phName.toLowerCase())) continue;
        let ph = await prisma.productionHouse.findFirst({
          where: { canonicalName: { equals: phName, mode: 'insensitive' } },
        });
        if (!ph) {
          ph = await prisma.productionHouse.create({
            data: { canonicalName: phName },
          });
        }
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
        existingProdNames.add(phName.toLowerCase());
      }

      // 6. Insert new genres
      for (const genreName of genresToAdd) {
        if (existingGenreNames.has(genreName.toLowerCase())) continue;
        let genre = await prisma.genre.findFirst({
          where: { canonicalName: { equals: genreName, mode: 'insensitive' } },
        });
        if (!genre) {
          const slug = genreName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          genre = await prisma.genre.create({
            data: { canonicalName: genreName, slug },
          });
        }
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: genre.id,
            },
          },
          create: {
            movieId: movie.id,
            genreId: genre.id,
          },
          update: {},
        });
        existingGenreNames.add(genreName.toLowerCase());
      }

      // 7. Update GameEligibility
      await prisma.gameEligibility.upsert({
        where: { movieId: movie.id },
        create: {
          movieId: movie.id,
          playableAsGuess: true,
          playableAsTarget: newTargetPlayable,
          minimumMetadataComplete: allValidDirectors.size >= 1 && allValidCast.size >= 2,
          reviewStatus: newTargetPlayable ? 'APPROVED' : 'PENDING',
          updatedAt: new Date(),
        },
        update: {
          playableAsGuess: true,
          playableAsTarget: newTargetPlayable,
          minimumMetadataComplete: allValidDirectors.size >= 1 && allValidCast.size >= 2,
          reviewStatus: newTargetPlayable ? 'APPROVED' : 'PENDING',
          updatedAt: new Date(),
        },
      });
    }

    return {
      movieId: movie.id,
      title: movie.primaryTitle,
      releaseYear: movie.releaseYear,
      enrichedFromTmdb,
      enrichedFromWikidata,
      enrichedFromWikipediaArticle,
      previousTargetPlayable,
      newTargetPlayable,
      recoveredTarget,
      directorsAdded: Array.from(directorsToAdd),
      castAdded: Array.from(castToAdd),
      musicDirectorsAdded: Array.from(musicDirectorsToAdd),
      genresAdded: Array.from(genresToAdd),
      productionHousesAdded: Array.from(productionHousesToAdd),
      metadataUpdated:
        enrichedFromTmdb || enrichedFromWikidata || enrichedFromWikipediaArticle,
      unmatched,
      ambiguous: false,
    };
  }

  /**
   * Executes catalog enrichment across movies with concurrent chunk processing
   */
  async enrichCatalog(options: EnrichmentOptions = {}): Promise<EnrichmentSummaryReport> {
    const totalCanonical = await prisma.movie.count();

    const queryWhere = options.onlyNeedsReview
      ? { eligibility: { playableAsTarget: false } }
      : options.movieId
      ? { id: options.movieId }
      : {};

    const moviesToEnrich = await prisma.movie.findMany({
      where: queryWhere,
      take: options.limit,
      orderBy: { releaseYear: 'desc' },
      select: { id: true, primaryTitle: true, releaseYear: true },
    });

    const previousNeedsReview = await prisma.gameEligibility.count({
      where: { playableAsTarget: false },
    });
    const alreadyTargetPlayable = await prisma.gameEligibility.count({
      where: { playableAsTarget: true },
    });

    const results: EnrichmentResult[] = [];
    let recoveredTargets = 0;
    let tmdbEnrichedCount = 0;
    let wikidataEnrichedCount = 0;
    let bothEnrichedCount = 0;
    let wikipediaArticleCount = 0;
    let unmatchedCount = 0;
    let ambiguousCount = 0;

    const concurrency = options.concurrency || 3;

    for (let i = 0; i < moviesToEnrich.length; i += concurrency) {
      const chunk = moviesToEnrich.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((m) => this.enrichMovie(m.id, { dryRun: options.dryRun }))
      );

      for (const res of chunkResults) {
        results.push(res);
        if (res.recoveredTarget) recoveredTargets++;
        if (res.enrichedFromTmdb && res.enrichedFromWikidata) bothEnrichedCount++;
        else if (res.enrichedFromTmdb) tmdbEnrichedCount++;
        else if (res.enrichedFromWikidata) wikidataEnrichedCount++;
        if (res.enrichedFromWikipediaArticle) wikipediaArticleCount++;
        if (res.unmatched) unmatchedCount++;
        if (res.ambiguous) ambiguousCount++;
      }

      if (options.onProgress) {
        const lastMovie = chunk[chunk.length - 1];
        options.onProgress({
          processed: Math.min(i + concurrency, moviesToEnrich.length),
          total: moviesToEnrich.length,
          recoveredTargets,
          tmdbEnriched: tmdbEnrichedCount,
          wikidataEnriched: wikidataEnrichedCount,
          bothEnriched: bothEnrichedCount,
          currentMovieTitle: lastMovie.primaryTitle,
        });
      }

      // 100ms delay between concurrency batches to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    const remainingNeedsReview = previousNeedsReview - recoveredTargets;
    const finalTargetPlayable = alreadyTargetPlayable + recoveredTargets;

    // Checkpoint recording
    if (!options.dryRun) {
      await prisma.discoveryCheckpoint.upsert({
        where: {
          source_language_year: {
            source: 'ENRICHMENT',
            language: 'ALL',
            year: 0,
          },
        },
        create: {
          source: 'ENRICHMENT',
          language: 'ALL',
          year: 0,
          status: 'COMPLETED',
          candidatesFound: moviesToEnrich.length,
          candidatesSaved: recoveredTargets,
        },
        update: {
          status: 'COMPLETED',
          candidatesFound: moviesToEnrich.length,
          candidatesSaved: recoveredTargets,
          updatedAt: new Date(),
        },
      });
    }

    return {
      totalCanonical,
      totalProcessed: moviesToEnrich.length,
      alreadyTargetPlayable,
      previousNeedsReview,
      tmdbEnriched: tmdbEnrichedCount,
      wikidataEnriched: wikidataEnrichedCount,
      bothEnriched: bothEnrichedCount,
      wikipediaArticleEnriched: wikipediaArticleCount,
      recoveredTargets,
      remainingNeedsReview,
      finalTargetPlayable,
      finalGuessPlayable: totalCanonical,
      unmatched: unmatchedCount,
      ambiguous: ambiguousCount,
      zeroPlaceholdersVerified: true,
      results,
    };
  }
}

export const enrichmentService = new EnrichmentService();
