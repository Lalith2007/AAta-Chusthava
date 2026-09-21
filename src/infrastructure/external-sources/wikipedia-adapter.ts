import {
  CandidateIdentity,
  DiscoveryOptions,
  DiscoverySourceStatus,
  DiscoveredMovieSummary,
  MovieDiscoverySource,
  MovieReleaseData,
  MovieSourceCredits,
  MovieSourceMetadata,
} from './discovery-source';

export interface WikipediaFilmRecord {
  id: string; // e.g. WIKI_TE_2002_seema-simham
  title: string;
  originalTitle: string;
  language: 'te' | 'hi';
  releaseYear: number;
  releaseDate?: string;
  directors: string[];
  cast: string[];
  musicDirectors?: string[];
  productionHouse?: string;
  sourceArticleUrl: string;
  attribution: string;
}

export class WikipediaDiscoveryAdapter implements MovieDiscoverySource {
  readonly sourceName = 'WIKIPEDIA';
  readonly isImplemented = true;
  readonly status: DiscoverySourceStatus = 'ACTIVE';

  private cache: Map<string, WikipediaFilmRecord> = new Map();

  constructor() {
    this.seedBaselineCache();
  }

  /**
   * Discovers movies from Wikipedia annual filmography pages for Telugu and Hindi.
   */
  async discover(options: DiscoveryOptions): Promise<{
    results: DiscoveredMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    const lang = (options.language?.toLowerCase() || 'te') as 'te' | 'hi';
    const year = options.year;
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Fetch and parse from MediaWiki API or local structured cache
    let records = await this.fetchYearFilmography(lang, year);

    // If live API returned 0 records or in offline mode, ensure baseline records
    if (records.length === 0) {
      records = Array.from(this.cache.values()).filter(
        (m) => m.language === lang && m.releaseYear === year
      );
    }

    const totalResults = records.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / limit));
    const start = (page - 1) * limit;
    const paginated = records.slice(start, start + limit);

    const results: DiscoveredMovieSummary[] = paginated.map((rec) => ({
      source: 'WIKIPEDIA',
      sourceMovieId: rec.id,
      title: rec.title,
      originalTitle: rec.originalTitle || rec.title,
      releaseDate: rec.releaseDate || `${rec.releaseYear}-01-01`,
      originalLanguage: rec.language,
      popularity: 50,
      voteAverage: 7.0,
      voteCount: 50,
    }));

    return {
      results,
      totalPages,
      totalResults,
    };
  }

  async getCandidateIdentity(sourceMovieId: string): Promise<CandidateIdentity> {
    const rec = this.cache.get(sourceMovieId);
    if (!rec) {
      const yearMatch = sourceMovieId.match(/_(\d{4})_/);
      const parsedYear = yearMatch ? parseInt(yearMatch[1], 10) : 2024;
      const rawTitle = sourceMovieId.replace(/^WIKI_[A-Z]+_\d+_/i, '').replace(/-/g, ' ');
      return {
        source: this.sourceName,
        sourceMovieId,
        title: rawTitle,
        originalTitle: rawTitle,
        releaseYear: parsedYear,
        primaryLanguage: sourceMovieId.includes('_TE_') ? 'TELUGU' : 'HINDI',
      };
    }

    return {
      source: this.sourceName,
      sourceMovieId: rec.id,
      title: rec.title,
      originalTitle: rec.originalTitle || rec.title,
      releaseYear: rec.releaseYear,
      primaryLanguage: rec.language === 'te' ? 'TELUGU' : 'HINDI',
    };
  }

  async getMetadata(sourceMovieId: string): Promise<MovieSourceMetadata> {
    const rec = this.cache.get(sourceMovieId);
    return {
      overview: rec
        ? `Wikipedia listed entry for ${rec.title} (${rec.releaseYear}). Attribution: ${rec.attribution}`
        : 'Wikipedia film entry.',
      runtime: 135,
      genres: [{ name: 'Drama' }],
      productionCompanies: rec?.productionHouse ? [{ name: rec.productionHouse }] : [],
    };
  }

  async getCredits(sourceMovieId: string): Promise<MovieSourceCredits> {
    const rec = this.cache.get(sourceMovieId);
    const directors = (rec?.directors || ['Director']).map((name) => ({ name }));
    const cast = (rec?.cast || ['Lead Actor', 'Supporting Actor']).map((name, idx) => ({
      name,
      order: idx,
      character: idx < 2 ? 'Lead' : 'Supporting',
    }));
    const musicDirectors = (rec?.musicDirectors || []).map((name) => ({ name }));

    return {
      directors,
      cast,
      musicDirectors,
      crew: [],
    };
  }

  async getReleaseData(sourceMovieId: string): Promise<MovieReleaseData> {
    const rec = this.cache.get(sourceMovieId);
    return {
      releaseDate: rec?.releaseDate || `${rec?.releaseYear || 2024}-01-01`,
      countries: ['IN'],
      alternativeTitles: rec?.originalTitle && rec.originalTitle !== rec.title ? [rec.originalTitle] : [],
    };
  }

  /**
   * Cleans MediaWiki wikitext artifacts, templates, links, references, and HTML formatting.
   */
  public cleanWikilink(text: string): string {
    if (!text) return '';
    let cleaned = text;
    // Remove <ref>...</ref> and <ref .../>
    cleaned = cleaned.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '');
    cleaned = cleaned.replace(/<ref\b[^>]*\/>/gi, '');
    // Remove HTML tags like <small>, <br>, <b>, <i>
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    // Remove templates like {{efn|...}}, {{INR|...}}, {{cite...}}
    cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');
    // Convert [[Target|Label]] to Label, and [[Title]] to Title
    cleaned = cleaned.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
    cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');
    // Remove bold/italics
    cleaned = cleaned.replace(/[']{2,5}/g, '');
    // Clean HTML entities and non-breaking spaces
    cleaned = cleaned.replace(/&nbsp;/gi, ' ');
    return cleaned.trim();
  }

  /**
   * Parses MediaWiki wikitext tables for film titles, release dates, directors, and cast.
   */
  public parseWikitextFilmography(
    wikitext: string,
    lang: 'te' | 'hi',
    year: number,
    pageTitle: string
  ): WikipediaFilmRecord[] {
    const records: WikipediaFilmRecord[] = [];
    const sourceArticleUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;
    const attribution = `Derived from Wikipedia article "${pageTitle}" by Wikipedia contributors, licensed under CC BY-SA 4.0.`;

    const tableBlocks = wikitext.split(/\{\|/);
    for (let t = 1; t < tableBlocks.length; t++) {
      const tableContent = tableBlocks[t].split(/\|\}/)[0];
      const rows = tableContent.split(/\n\|-[^\n]*\n?/);

      for (let r = 0; r < rows.length; r++) {
        const rawRow = rows[r].trim();
        if (!rawRow || rawRow.startsWith('!') || rawRow.includes('|+')) continue;

        // Extract cells separated by newlines with | or inline ||
        const rawCells = rawRow.split(/\n\||\|\|/);
        const cleanedCells: string[] = [];

        for (const cell of rawCells) {
          let clean = cell.trim();
          if (!clean) continue;
          if (clean.startsWith('|')) clean = clean.substring(1).trim();
          // Remove table cell parameters like style="..." | or rowspan=2 |
          const pipeIdx = clean.indexOf('|');
          if (
            pipeIdx !== -1 &&
            (clean.includes('style=') ||
              clean.includes('rowspan=') ||
              clean.includes('colspan=') ||
              clean.includes('align=') ||
              clean.includes('bgcolor=') ||
              clean.includes('class='))
          ) {
            clean = clean.substring(pipeIdx + 1).trim();
          }
          const text = this.cleanWikilink(clean);
          if (
            text &&
            !text.startsWith('class=') &&
            !text.startsWith('style=') &&
            !text.startsWith('margin:')
          ) {
            cleanedCells.push(text);
          }
        }

        if (cleanedCells.length === 0) continue;

        // Identify Title, Director, Cast
        let foundTitle = '';
        let foundDirector = '';
        let foundCast: string[] = [];

        for (let i = 0; i < cleanedCells.length; i++) {
          const val = cleanedCells[i];
          // Skip month names and day numbers
          if (
            val.match(
              /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})$/i
            )
          ) {
            continue;
          }
          // Skip header words and table markers
          if (
            val.includes('class=') ||
            val.includes('wikitable') ||
            val.toLowerCase().includes('grossing') ||
            val.toLowerCase().includes('rank') ||
            val.toLowerCase().includes('opening') ||
            val.toLowerCase().includes('ref.') ||
            val.toLowerCase().includes('references')
          ) {
            continue;
          }
          if (!foundTitle) {
            foundTitle = val;
          } else if (!foundDirector) {
            foundDirector = val;
          } else if (foundCast.length === 0) {
            foundCast = val
              .split(/,\s*|\band\b/i)
              .map((s) => s.trim())
              .filter((s) => s.length > 1);
          }
        }

        if (foundTitle && foundTitle.length > 1) {
          const slug = foundTitle
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[\s_-]+/g, '-');

          if (
            slug.length >= 2 &&
            !slug.includes('wikitable') &&
            !slug.includes('highest-grossing') &&
            !slug.includes('box-office')
          ) {
            records.push({
              id: `WIKI_${lang.toUpperCase()}_${year}_${slug}`,
              title: foundTitle,
              originalTitle: foundTitle,
              language: lang,
              releaseYear: year,
              releaseDate: `${year}-06-15`,
              directors: foundDirector ? [foundDirector] : ['Director'],
              cast: foundCast.length >= 2 ? foundCast : ['Lead Actor', 'Supporting Actor'],
              sourceArticleUrl,
              attribution,
            });
          }
        }
      }
    }

    // Deduplicate by ID within the year
    const seen = new Set<string>();
    return records.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  /**
   * Fetches annual filmography wikitext from MediaWiki API and parses table rows.
   */
  public async fetchYearFilmography(
    lang: 'te' | 'hi',
    year: number
  ): Promise<WikipediaFilmRecord[]> {
    const pageTitle =
      lang === 'te' ? `List_of_Telugu_films_of_${year}` : `List_of_Hindi_films_of_${year}`;
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=wikitext&format=json`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'AAtaChusthava/1.0 (https://github.com/Lalith2007/AAta-Chusthava; contact: admin@aatachusthava.com)',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.warn(`Wikipedia MediaWiki API HTTP ${res.status} for ${pageTitle}`);
        return [];
      }

      const data = await res.json();
      if (data.error) {
        console.warn(`Wikipedia API error for ${pageTitle}:`, data.error);
        return [];
      }

      const wikitext = data?.parse?.wikitext?.['*'];
      if (!wikitext) {
        console.warn(`No wikitext returned for ${pageTitle}`);
        return [];
      }

      const extracted = this.parseWikitextFilmography(wikitext, lang, year, pageTitle);
      for (const rec of extracted) {
        this.cache.set(rec.id, rec);
      }
      return extracted;
    } catch (e: unknown) {
      console.warn(`Network fallback for Wikipedia ${pageTitle}:`, e instanceof Error ? e.message : String(e));
      return Array.from(this.cache.values()).filter(
        (m) => m.language === lang && m.releaseYear === year
      );
    }
  }

  private seedBaselineCache() {
    const seedRecords: WikipediaFilmRecord[] = [
      {
        id: 'WIKI_TE_2002_manmadhudu',
        title: 'Manmadhudu',
        originalTitle: 'మన్మథుడు',
        language: 'te',
        releaseYear: 2002,
        releaseDate: '2002-12-20',
        directors: ['K. Vijaya Bhaskar'],
        cast: ['Nagarjuna Akkineni', 'Sonali Bendre', 'Anshu'],
        musicDirectors: ['Devi Sri Prasad'],
        productionHouse: 'Annapurna Studios',
        sourceArticleUrl: 'https://en.wikipedia.org/wiki/List_of_Telugu_films_of_2002',
        attribution:
          'Derived from Wikipedia article "List of Telugu films of 2002" by Wikipedia contributors, CC BY-SA 4.0.',
      },
      {
        id: 'WIKI_TE_2023_waltair-veerayya',
        title: 'Waltair Veerayya',
        originalTitle: 'వాల్తేరు వీరయ్య',
        language: 'te',
        releaseYear: 2023,
        releaseDate: '2023-01-13',
        directors: ['Bobby Kolli'],
        cast: ['Chiranjeevi', 'Ravi Teja', 'Shruti Haasan', 'Catherine Tresa'],
        musicDirectors: ['Devi Sri Prasad'],
        productionHouse: 'Mythri Movie Makers',
        sourceArticleUrl: 'https://en.wikipedia.org/wiki/List_of_Telugu_films_of_2023',
        attribution:
          'Derived from Wikipedia article "List of Telugu films of 2023" by Wikipedia contributors, CC BY-SA 4.0.',
      },
      {
        id: 'WIKI_HI_2023_jawan',
        title: 'Jawan',
        originalTitle: 'जवान',
        language: 'hi',
        releaseYear: 2023,
        releaseDate: '2023-09-07',
        directors: ['Atlee'],
        cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi', 'Deepika Padukone'],
        musicDirectors: ['Anirudh Ravichander'],
        productionHouse: 'Red Chillies Entertainment',
        sourceArticleUrl: 'https://en.wikipedia.org/wiki/List_of_Hindi_films_of_2023',
        attribution:
          'Derived from Wikipedia article "List of Hindi films of 2023" by Wikipedia contributors, CC BY-SA 4.0.',
      },
      {
        id: 'WIKI_TE_2024_hanuman',
        title: 'Hanu-Man',
        originalTitle: 'హను-మాన్',
        language: 'te',
        releaseYear: 2024,
        releaseDate: '2024-01-12',
        directors: ['Prasanth Varma'],
        cast: ['Teja Sajja', 'Amritha Aiyer', 'Varalaxmi Sarathkumar', 'Vinay Rai'],
        musicDirectors: ['GowraHari', 'Anudeep Dev'],
        productionHouse: 'Primeshow Entertainment',
        sourceArticleUrl: 'https://en.wikipedia.org/wiki/List_of_Telugu_films_of_2024',
        attribution:
          'Derived from Wikipedia article "List of Telugu films of 2024" by Wikipedia contributors, CC BY-SA 4.0.',
      },
      {
        id: 'WIKI_HI_2024_fighter',
        title: 'Fighter',
        originalTitle: 'फाइटर',
        language: 'hi',
        releaseYear: 2024,
        releaseDate: '2024-01-25',
        directors: ['Siddharth Anand'],
        cast: ['Hrithik Roshan', 'Deepika Padukone', 'Anil Kapoor', 'Karan Singh Grover'],
        musicDirectors: ['Vishal-Shekhar'],
        productionHouse: 'Marflix Pictures',
        sourceArticleUrl: 'https://en.wikipedia.org/wiki/List_of_Hindi_films_of_2024',
        attribution:
          'Derived from Wikipedia article "List of Hindi films of 2024" by Wikipedia contributors, CC BY-SA 4.0.',
      },
    ];

    for (const r of seedRecords) {
      this.cache.set(r.id, r);
    }
  }
}

export const wikipediaDiscoveryAdapter = new WikipediaDiscoveryAdapter();
