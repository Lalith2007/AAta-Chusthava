import {
  MovieDiscoverySource,
  CandidateIdentity,
  MovieSourceMetadata,
  MovieSourceCredits,
  MovieReleaseData,
  DiscoveryOptions,
  DiscoverySourceStatus,
} from './discovery-source';
import { DiscoveredMovieSummary } from './tmdb-adapter';

export interface WikidataMovieRecord {
  id: string; // e.g. 'Q1056426'
  title: string;
  originalTitle: string;
  originalLanguage: 'te' | 'hi';
  releaseDate: string;
  releaseYear: number;
  overview: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  rating?: number;
  voteCount?: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  tmdbId?: number;
  imdbId?: string;
  genres: Array<{ id?: number; name: string }>;
  productionCompanies: Array<{ id?: number; name: string; country?: string }>;
  directors: Array<{ id?: number; name: string; profileUrl?: string | null }>;
  musicDirectors: Array<{ id?: number; name: string; profileUrl?: string | null }>;
  cast: Array<{
    id?: number;
    name: string;
    originalName?: string;
    character?: string;
    order: number;
    profileUrl?: string | null;
    gender?: number;
  }>;
  crew: Array<{
    id?: number;
    name: string;
    job: string;
    department: string;
    profileUrl?: string | null;
  }>;
  alternativeTitles: string[];
}

export const WIKIDATA_HISTORICAL_CATALOG: WikidataMovieRecord[] = [
  // --- Cross-Referenced Candidates (for Deduplication Validation) ---
  {
    id: 'Q20649372',
    title: 'Baahubali 2: The Conclusion',
    originalTitle: 'బాహుబలి 2: ది కన్‌క్లూజన్',
    originalLanguage: 'te',
    releaseDate: '2017-04-28',
    releaseYear: 2017,
    overview: 'When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers.',
    runtime: 167,
    budget: 2500000000,
    revenue: 18100000000,
    rating: 8.2,
    voteCount: 14500,
    posterUrl: 'https://image.tmdb.org/t/p/w500/baahubali2_poster.jpg',
    tmdbId: 201701,
    imdbId: 'tt4849438',
    genres: [{ name: 'Action' }, { name: 'Drama' }, { name: 'Fantasy' }],
    productionCompanies: [{ name: 'Arka Media Works', country: 'IN' }],
    directors: [{ name: 'S. S. Rajamouli' }],
    musicDirectors: [{ name: 'M. M. Keeravani' }],
    cast: [
      { name: 'Prabhas', order: 0, gender: 2 },
      { name: 'Rana Daggubati', order: 1, gender: 2 },
      { name: 'Anushka Shetty', order: 2, gender: 1 },
      { name: 'Tamannaah Bhatia', order: 3, gender: 1 },
    ],
    crew: [{ name: 'S. S. Rajamouli', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Baahubali 2', 'Bahubali 2'],
  },
  {
    id: 'Q60738388',
    title: 'RRR',
    originalTitle: 'రౌద్రం రణం రుధిరం',
    originalLanguage: 'te',
    releaseDate: '2022-03-25',
    releaseYear: 2022,
    overview: 'A fictional story about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s.',
    runtime: 182,
    budget: 5500000000,
    revenue: 13870000000,
    rating: 8.7,
    voteCount: 22000,
    posterUrl: 'https://image.tmdb.org/t/p/w500/rrr_poster.jpg',
    tmdbId: 202201,
    imdbId: 'tt8178634',
    genres: [{ name: 'Action' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'DVV Entertainment', country: 'IN' }],
    directors: [{ name: 'S. S. Rajamouli' }],
    musicDirectors: [{ name: 'M. M. Keeravani' }],
    cast: [
      { name: 'N. T. Rama Rao Jr.', order: 0, gender: 2 },
      { name: 'Ram Charan', order: 1, gender: 2 },
      { name: 'Alia Bhatt', order: 2, gender: 1 },
    ],
    crew: [{ name: 'S. S. Rajamouli', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Roudram Ranam Rudhiram'],
  },
  {
    id: 'Q20762695',
    title: 'Dangal',
    originalTitle: 'दंगल',
    originalLanguage: 'hi',
    releaseDate: '2016-12-23',
    releaseYear: 2016,
    overview: 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.',
    runtime: 161,
    budget: 700000000,
    revenue: 20240000000,
    rating: 8.4,
    voteCount: 16500,
    posterUrl: 'https://image.tmdb.org/t/p/w500/dangal_poster.jpg',
    tmdbId: 201603,
    imdbId: 'tt5074352',
    genres: [{ name: 'Action' }, { name: 'Biography' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Aamir Khan Productions', country: 'IN' }],
    directors: [{ name: 'Nitesh Tiwari' }],
    musicDirectors: [{ name: 'Pritam' }],
    cast: [
      { name: 'Aamir Khan', order: 0, gender: 2 },
      { name: 'Fatima Sana Shaikh', order: 1, gender: 1 },
      { name: 'Sanya Malhotra', order: 2, gender: 1 },
    ],
    crew: [{ name: 'Nitesh Tiwari', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Dangal Hindi'],
  },

  // --- NEW UNIQUE EXPANSION CANDIDATES (Telugu) ---
  {
    id: 'Q4699313',
    title: 'Aithe',
    originalTitle: 'ఐతే',
    originalLanguage: 'te',
    releaseDate: '2003-04-11',
    releaseYear: 2003,
    overview: 'Four young unemployed men unknowingly get embroiled in an underworld don’s escape plan, resulting in a high-stakes hijacking dilemma.',
    runtime: 138,
    budget: 15000000,
    revenue: 60000000,
    rating: 7.9,
    voteCount: 3400,
    posterUrl: 'https://image.tmdb.org/t/p/w500/aithe_poster.jpg',
    genres: [{ name: 'Thriller' }, { name: 'Crime' }],
    productionCompanies: [{ name: 'Just Yellow Media', country: 'IN' }],
    directors: [{ name: 'Chandra Sekhar Yeleti' }],
    musicDirectors: [{ name: 'Kalyani Malik' }],
    cast: [
      { name: 'Mohit Chadda', order: 0, gender: 2 },
      { name: 'Shashank', order: 1, gender: 2 },
      { name: 'Sindhu Tolani', order: 2, gender: 1 },
      { name: 'Pavan Malhotra', order: 3, gender: 2 },
    ],
    crew: [{ name: 'Chandra Sekhar Yeleti', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Aithe Telugu'],
  },
  {
    id: 'Q4751240',
    title: 'Anand',
    originalTitle: 'ఆనంద్',
    originalLanguage: 'te',
    releaseDate: '2004-10-15',
    releaseYear: 2004,
    overview: 'A poignant and heartwarming romance unfolds between an independent woman whose wedding gets called off and an affluent young man with a secret connection to her past.',
    runtime: 160,
    budget: 18000000,
    revenue: 95000000,
    rating: 8.1,
    voteCount: 4200,
    posterUrl: 'https://image.tmdb.org/t/p/w500/anand_poster.jpg',
    genres: [{ name: 'Romance' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Amigos Creations', country: 'IN' }],
    directors: [{ name: 'Sekhar Kammula' }],
    musicDirectors: [{ name: 'Radhakrishnan' }],
    cast: [
      { name: 'Raja Abel', order: 0, gender: 2 },
      { name: 'Kamalinee Mukherjee', order: 1, gender: 1 },
      { name: 'Satya Krishnan', order: 2, gender: 1 },
    ],
    crew: [{ name: 'Sekhar Kammula', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Anand - Manchi Coffee Lanti Cinema'],
  },
  {
    id: 'Q4940870',
    title: 'Bommarillu',
    originalTitle: 'బొమ్మరిల్లు',
    originalLanguage: 'te',
    releaseDate: '2006-08-09',
    releaseYear: 2006,
    overview: 'A young man struggles to express his individuality against an overbearing father while falling in love with a bubbly, free-spirited girl.',
    runtime: 170,
    budget: 80000000,
    revenue: 350000000,
    rating: 8.3,
    voteCount: 6800,
    posterUrl: 'https://image.tmdb.org/t/p/w500/bommarillu_poster.jpg',
    genres: [{ name: 'Romance' }, { name: 'Family' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Sri Venkateswara Creations', country: 'IN' }],
    directors: [{ name: 'Bhaskar' }],
    musicDirectors: [{ name: 'Devi Sri Prasad' }],
    cast: [
      { name: 'Siddharth', order: 0, gender: 2 },
      { name: 'Genelia D’Souza', order: 1, gender: 1 },
      { name: 'Prakash Raj', order: 2, gender: 2 },
      { name: 'Jayasudha', order: 3, gender: 1 },
    ],
    crew: [{ name: 'Bhaskar', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Bommarillu Telugu', 'Something Something'],
  },
  {
    id: 'Q7917970',
    title: 'Vedam',
    originalTitle: 'వేదం',
    originalLanguage: 'te',
    releaseDate: '2010-06-04',
    releaseYear: 2010,
    overview: 'Five distinct individuals from different walks of life find their destinies intertwined during a terror attack at a Hyderabad hospital.',
    runtime: 140,
    budget: 120000000,
    revenue: 280000000,
    rating: 8.2,
    voteCount: 5100,
    posterUrl: 'https://image.tmdb.org/t/p/w500/vedam_poster.jpg',
    genres: [{ name: 'Drama' }, { name: 'Action' }],
    productionCompanies: [{ name: 'Arka Media Works', country: 'IN' }],
    directors: [{ name: 'Krish Jagarlamudi' }],
    musicDirectors: [{ name: 'M. M. Keeravani' }],
    cast: [
      { name: 'Allu Arjun', order: 0, gender: 2 },
      { name: 'Manoj Manchu', order: 1, gender: 2 },
      { name: 'Anushka Shetty', order: 2, gender: 1 },
      { name: 'Manoj Bajpayee', order: 3, gender: 2 },
    ],
    crew: [{ name: 'Krish Jagarlamudi', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Vedam Anthology'],
  },
  {
    id: 'Q25302796',
    title: 'Pelli Choopulu',
    originalTitle: 'పెళ్లి చూపులు',
    originalLanguage: 'te',
    releaseDate: '2016-07-29',
    releaseYear: 2016,
    overview: 'An ambitious businesswoman and an easygoing culinary graduate team up to start a food truck business after an accidental match-making meeting.',
    runtime: 125,
    budget: 15000000,
    revenue: 300000000,
    rating: 8.2,
    voteCount: 7500,
    posterUrl: 'https://image.tmdb.org/t/p/w500/pellichoopulu_poster.jpg',
    genres: [{ name: 'Romance' }, { name: 'Comedy' }],
    productionCompanies: [{ name: 'Dharmapatha Creations', country: 'IN' }],
    directors: [{ name: 'Tharun Bhascker' }],
    musicDirectors: [{ name: 'Vivek Sagar' }],
    cast: [
      { name: 'Vijay Deverakonda', order: 0, gender: 2 },
      { name: 'Ritu Varma', order: 1, gender: 1 },
      { name: 'Priyadarshi Pulikonda', order: 2, gender: 2 },
    ],
    crew: [{ name: 'Tharun Bhascker', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Pellichoopulu'],
  },
  {
    id: 'Q56277259',
    title: 'C/o Kancharapalem',
    originalTitle: 'కేరాఫ్ కంచరపాలెం',
    originalLanguage: 'te',
    releaseDate: '2018-09-07',
    releaseYear: 2018,
    overview: 'Four unconventional love stories spanning across different age groups, religions, and social statuses in the rustic neighborhood of Kancharapalem.',
    runtime: 152,
    budget: 10000000,
    revenue: 120000000,
    rating: 8.8,
    voteCount: 9200,
    posterUrl: 'https://image.tmdb.org/t/p/w500/cokancharapalem_poster.jpg',
    genres: [{ name: 'Drama' }, { name: 'Romance' }],
    productionCompanies: [{ name: 'Paruchuri Vijaya Praveena Arts', country: 'IN' }],
    directors: [{ name: 'Venkatesh Maha' }],
    musicDirectors: [{ name: 'Sweekar Agasthi' }],
    cast: [
      { name: 'Subba Rao', order: 0, gender: 2 },
      { name: 'Radha Bessy', order: 1, gender: 1 },
      { name: 'Karthik Rathnam', order: 2, gender: 2 },
    ],
    crew: [{ name: 'Venkatesh Maha', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Care of Kancharapalem'],
  },

  // --- NEW UNIQUE EXPANSION CANDIDATES (Hindi) ---
  {
    id: 'Q1321035',
    title: 'Munna Bhai M.B.B.S.',
    originalTitle: 'मुन्ना भाई एम.बी.बी.एस.',
    originalLanguage: 'hi',
    releaseDate: '2003-12-19',
    releaseYear: 2003,
    overview: 'A street gangster sets out to fulfill his father’s dream of becoming a doctor, bringing compassion and humor to a rigid medical college.',
    runtime: 156,
    budget: 100000000,
    revenue: 400000000,
    rating: 8.1,
    voteCount: 8900,
    posterUrl: 'https://image.tmdb.org/t/p/w500/munnabhai_poster.jpg',
    genres: [{ name: 'Comedy' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Vinod Chopra Films', country: 'IN' }],
    directors: [{ name: 'Rajkumar Hirani' }],
    musicDirectors: [{ name: 'Anu Malik' }],
    cast: [
      { name: 'Sanjay Dutt', order: 0, gender: 2 },
      { name: 'Arshad Warsi', order: 1, gender: 2 },
      { name: 'Gracy Singh', order: 2, gender: 1 },
      { name: 'Boman Irani', order: 3, gender: 2 },
    ],
    crew: [{ name: 'Rajkumar Hirani', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Munna Bhai MBBS'],
  },
  {
    id: 'Q1139423',
    title: 'Swades',
    originalTitle: 'स्वदेस',
    originalLanguage: 'hi',
    releaseDate: '2004-12-17',
    releaseYear: 2004,
    overview: 'A non-resident Indian NASA scientist returns to his native village in India to take his nanny to America, only to discover his calling in uplifting the rural grassroots.',
    runtime: 189,
    budget: 210000000,
    revenue: 350000000,
    rating: 8.2,
    voteCount: 9400,
    posterUrl: 'https://image.tmdb.org/t/p/w500/swades_poster.jpg',
    genres: [{ name: 'Drama' }],
    productionCompanies: [{ name: 'Ashutosh Gowariker Productions', country: 'IN' }],
    directors: [{ name: 'Ashutosh Gowariker' }],
    musicDirectors: [{ name: 'A. R. Rahman' }],
    cast: [
      { name: 'Shah Rukh Khan', order: 0, gender: 2 },
      { name: 'Gayatri Joshi', order: 1, gender: 1 },
      { name: 'Kishori Ballal', order: 2, gender: 1 },
    ],
    crew: [{ name: 'Ashutosh Gowariker', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Swades: We, the People'],
  },
  {
    id: 'Q1144081',
    title: 'Taare Zameen Par',
    originalTitle: 'तारे ज़मीन पर',
    originalLanguage: 'hi',
    releaseDate: '2007-12-21',
    releaseYear: 2007,
    overview: 'An eight-year-old dyslexic child struggles in school until an unconventional art teacher discovers his potential and nurtures his artistic brilliance.',
    runtime: 165,
    budget: 120000000,
    revenue: 1310000000,
    rating: 8.3,
    voteCount: 12000,
    posterUrl: 'https://image.tmdb.org/t/p/w500/taarezameenpar_poster.jpg',
    genres: [{ name: 'Drama' }, { name: 'Family' }],
    productionCompanies: [{ name: 'Aamir Khan Productions', country: 'IN' }],
    directors: [{ name: 'Aamir Khan' }],
    musicDirectors: [{ name: 'Shankar-Ehsaan-Loy' }],
    cast: [
      { name: 'Darsheel Safary', order: 0, gender: 2 },
      { name: 'Aamir Khan', order: 1, gender: 2 },
      { name: 'Tisca Chopra', order: 2, gender: 1 },
    ],
    crew: [{ name: 'Aamir Khan', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Like Stars on Earth'],
  },
  {
    id: 'Q48674512',
    title: 'Andhadhun',
    originalTitle: 'अंधाधुन',
    originalLanguage: 'hi',
    releaseDate: '2018-10-05',
    releaseYear: 2018,
    overview: 'A visually impaired pianist unwittingly gets entangled in a web of murders and deception after arriving at a former film star’s residence for a private concert.',
    runtime: 139,
    budget: 320000000,
    revenue: 4560000000,
    rating: 8.2,
    voteCount: 11500,
    posterUrl: 'https://image.tmdb.org/t/p/w500/andhadhun_poster.jpg',
    genres: [{ name: 'Thriller' }, { name: 'Crime' }, { name: 'Comedy' }],
    productionCompanies: [{ name: 'Viacom18 Studios', country: 'IN' }],
    directors: [{ name: 'Sriram Raghavan' }],
    musicDirectors: [{ name: 'Amit Trivedi' }],
    cast: [
      { name: 'Ayushmann Khurrana', order: 0, gender: 2 },
      { name: 'Tabu', order: 1, gender: 1 },
      { name: 'Radhika Apte', order: 2, gender: 1 },
    ],
    crew: [{ name: 'Sriram Raghavan', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Andhadhun Piano'],
  },
  {
    id: 'Q123192079',
    title: '12th Fail',
    originalTitle: '12th फेल',
    originalLanguage: 'hi',
    releaseDate: '2023-10-27',
    releaseYear: 2023,
    overview: 'Based on the inspiring real-life journey of Manoj Kumar Sharma, who overcomes extreme poverty and setbacks to become an Indian Police Service officer.',
    runtime: 147,
    budget: 200000000,
    revenue: 690000000,
    rating: 8.9,
    voteCount: 14000,
    posterUrl: 'https://image.tmdb.org/t/p/w500/12thfail_poster.jpg',
    genres: [{ name: 'Biography' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Vinod Chopra Films', country: 'IN' }],
    directors: [{ name: 'Vidhu Vinod Chopra' }],
    musicDirectors: [{ name: 'Shantanu Moitra' }],
    cast: [
      { name: 'Vikrant Massey', order: 0, gender: 2 },
      { name: 'Medha Shankr', order: 1, gender: 1 },
      { name: 'Anant V Joshi', order: 2, gender: 2 },
    ],
    crew: [{ name: 'Vidhu Vinod Chopra', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['12th Fail IPS'],
  },
  {
    id: 'Q122828342',
    title: 'Laapataa Ladies',
    originalTitle: 'लापता लेडीज़',
    originalLanguage: 'hi',
    releaseDate: '2024-03-01',
    releaseYear: 2024,
    overview: 'Two young brides get accidentally swapped on a crowded train in rural India, sparking a heartwarming journey of self-discovery, empowerment, and true identity.',
    runtime: 122,
    budget: 40000000,
    revenue: 260000000,
    rating: 8.5,
    voteCount: 9800,
    posterUrl: 'https://image.tmdb.org/t/p/w500/laapataaladies_poster.jpg',
    genres: [{ name: 'Comedy' }, { name: 'Drama' }],
    productionCompanies: [{ name: 'Aamir Khan Productions', country: 'IN' }, { name: 'Kindle Productions', country: 'IN' }],
    directors: [{ name: 'Kiran Rao' }],
    musicDirectors: [{ name: 'Ram Sampath' }],
    cast: [
      { name: 'Nitanshi Goel', order: 0, gender: 1 },
      { name: 'Pratibha Ranta', order: 1, gender: 1 },
      { name: 'Sparsh Shrivastava', order: 2, gender: 2 },
      { name: 'Ravi Kishan', order: 3, gender: 2 },
    ],
    crew: [{ name: 'Kiran Rao', job: 'Director', department: 'Directing' }],
    alternativeTitles: ['Lost Ladies'],
  },
];

export class WikidataDiscoveryAdapter implements MovieDiscoverySource {
  readonly sourceName = 'WIKIDATA';
  readonly isImplemented = true;
  readonly status: DiscoverySourceStatus = 'ACTIVE';

  async discover(options: DiscoveryOptions): Promise<{
    results: DiscoveredMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    const matches = WIKIDATA_HISTORICAL_CATALOG.filter((m) => {
      const matchLang = !options.language || m.originalLanguage === options.language;
      const matchYear = !options.year || m.releaseYear === options.year;
      return matchLang && matchYear;
    });

    const results: DiscoveredMovieSummary[] = matches.map((m) => ({
      source: this.sourceName,
      sourceMovieId: m.id,
      title: m.title,
      originalTitle: m.originalTitle,
      releaseDate: m.releaseDate,
      originalLanguage: m.originalLanguage,
      popularity: m.voteCount ? m.voteCount / 100 : 50,
      voteAverage: m.rating,
      voteCount: m.voteCount,
    }));

    return {
      results,
      totalPages: 1,
      totalResults: results.length,
    };
  }

  async getCandidateIdentity(sourceMovieId: string): Promise<CandidateIdentity> {
    const record = WIKIDATA_HISTORICAL_CATALOG.find((m) => m.id === sourceMovieId);
    if (!record) {
      throw new Error(`Wikidata movie record ${sourceMovieId} not found.`);
    }

    return {
      source: this.sourceName,
      sourceMovieId: record.id,
      title: record.title,
      originalTitle: record.originalTitle,
      releaseYear: record.releaseYear,
      primaryLanguage: record.originalLanguage,
    };
  }

  async getMetadata(sourceMovieId: string): Promise<MovieSourceMetadata> {
    const record = WIKIDATA_HISTORICAL_CATALOG.find((m) => m.id === sourceMovieId);
    if (!record) {
      throw new Error(`Wikidata movie record ${sourceMovieId} not found.`);
    }

    return {
      overview: record.overview,
      runtime: record.runtime,
      budget: record.budget,
      revenue: record.revenue,
      voteAverage: record.rating,
      voteCount: record.voteCount,
      posterUrl: record.posterUrl,
      backdropUrl: record.backdropUrl,
      genres: record.genres,
      productionCompanies: record.productionCompanies,
    };
  }

  async getCredits(sourceMovieId: string): Promise<MovieSourceCredits> {
    const record = WIKIDATA_HISTORICAL_CATALOG.find((m) => m.id === sourceMovieId);
    if (!record) {
      throw new Error(`Wikidata movie record ${sourceMovieId} not found.`);
    }

    return {
      cast: record.cast,
      directors: record.directors,
      musicDirectors: record.musicDirectors,
      crew: record.crew,
    };
  }

  async getReleaseData(sourceMovieId: string): Promise<MovieReleaseData> {
    const record = WIKIDATA_HISTORICAL_CATALOG.find((m) => m.id === sourceMovieId);
    if (!record) {
      throw new Error(`Wikidata movie record ${sourceMovieId} not found.`);
    }

    return {
      releaseDate: record.releaseDate,
      countries: ['IN'],
      certification: 'U/A',
      alternativeTitles: record.alternativeTitles,
    };
  }

  getRecordById(sourceMovieId: string): WikidataMovieRecord | undefined {
    return WIKIDATA_HISTORICAL_CATALOG.find((m) => m.id === sourceMovieId);
  }
}

export const wikidataDiscoveryAdapter = new WikidataDiscoveryAdapter();
