import { describe, it, expect } from 'vitest';
import { defaultClueEngine } from '../clue-engine';
import { NormalizedMovie } from '@/domain/movie/types';

const rrrMovie: NormalizedMovie = {
  id: 'movie-rrr-2022',
  slug: 'rrr-2022',
  primaryTitle: 'RRR',
  originalTitle: 'రౌద్రం రణం రుధిరం',
  alternativeTitles: ['Roudram Ranam Rudhiram'],
  supportedLanguages: ['TELUGU', 'HINDI', 'TAMIL'],
  industries: ['TOLLYWOOD'],
  countries: ['IN'],
  releaseDate: new Date('2022-03-25'),
  releaseYear: 2022,
  canonicalIndiaReleaseDate: new Date('2022-03-25'),
  certification: 'U/A',
  budget: 5500000000,
  budgetCurrency: 'INR',
  boxOffice: 13870000000,
  boxOfficeCurrency: 'INR',
  boxOfficeStatus: 'FINAL',
  rating: 8.0,
  ratingVoteCount: 150000,
  posterAsset: '/posters/rrr.jpg',
  lifecycleStatus: 'ACTIVE',
  playableAsGuess: true,
  playableAsTarget: true,
  directors: [
    {
      id: 'person-ss-rajamouli',
      canonicalName: 'S. S. Rajamouli',
      alternateNames: ['SS Rajamouli'],
      roleType: 'DIRECTOR',
      relationType: 'CREW',
    },
  ],
  musicDirectors: [
    {
      id: 'person-mm-keeravaani',
      canonicalName: 'M. M. Keeravaani',
      alternateNames: ['MM Keeravani'],
      roleType: 'MUSIC_DIRECTOR',
      relationType: 'CREW',
    },
  ],
  leadActors: [
    {
      id: 'person-ntr-jr',
      canonicalName: 'N. T. Rama Rao Jr.',
      alternateNames: ['Jr NTR', 'Tarak'],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
    {
      id: 'person-ram-charan',
      canonicalName: 'Ram Charan',
      alternateNames: ['Mega Power Star'],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  leadActresses: [
    {
      id: 'person-alia-bhatt',
      canonicalName: 'Alia Bhatt',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  supportingCast: [
    {
      id: 'person-ajay-devgn',
      canonicalName: 'Ajay Devgn',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
    {
      id: 'person-shriya-saran',
      canonicalName: 'Shriya Saran',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
  ],
  crew: [],
  productionHouses: [
    {
      id: 'prod-dvv-entertainment',
      canonicalName: 'DVV Entertainment',
      alternateNames: [],
      relationshipType: 'PRODUCTION',
    },
  ],
  genres: [
    { id: 'genre-action', canonicalName: 'Action', slug: 'action' },
    { id: 'genre-drama', canonicalName: 'Drama', slug: 'drama' },
    { id: 'genre-history', canonicalName: 'History', slug: 'history' },
  ],
};

const baahubaliMovie: NormalizedMovie = {
  id: 'movie-baahubali-2015',
  slug: 'baahubali-the-beginning-2015',
  primaryTitle: 'Baahubali: The Beginning',
  originalTitle: 'బాహుబలి: ది బిగినింగ్',
  alternativeTitles: ['Baahubali 1'],
  supportedLanguages: ['TELUGU', 'TAMIL'],
  industries: ['TOLLYWOOD'],
  countries: ['IN'],
  releaseDate: new Date('2015-07-10'),
  releaseYear: 2015,
  canonicalIndiaReleaseDate: new Date('2015-07-10'),
  boxOffice: 6500000000,
  boxOfficeCurrency: 'INR',
  boxOfficeStatus: 'FINAL',
  rating: 8.1,
  ratingVoteCount: 120000,
  lifecycleStatus: 'ACTIVE',
  playableAsGuess: true,
  playableAsTarget: true,
  directors: [
    {
      id: 'person-ss-rajamouli',
      canonicalName: 'S. S. Rajamouli',
      alternateNames: [],
      roleType: 'DIRECTOR',
      relationType: 'CREW',
    },
  ],
  musicDirectors: [
    {
      id: 'person-mm-keeravaani',
      canonicalName: 'M. M. Keeravaani',
      alternateNames: [],
      roleType: 'MUSIC_DIRECTOR',
      relationType: 'CREW',
    },
  ],
  leadActors: [
    {
      id: 'person-prabhas',
      canonicalName: 'Prabhas',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
    {
      id: 'person-rana-daggubati',
      canonicalName: 'Rana Daggubati',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  leadActresses: [
    {
      id: 'person-anushka-shetty',
      canonicalName: 'Anushka Shetty',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  supportingCast: [
    {
      id: 'person-ramya-krishnan',
      canonicalName: 'Ramya Krishnan',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
    {
      id: 'person-sathyaraj',
      canonicalName: 'Sathyaraj',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
  ],
  crew: [],
  productionHouses: [
    {
      id: 'prod-arka-media',
      canonicalName: 'Arka Media Works',
      alternateNames: [],
      relationshipType: 'PRODUCTION',
    },
  ],
  genres: [
    { id: 'genre-action', canonicalName: 'Action', slug: 'action' },
    { id: 'genre-drama', canonicalName: 'Drama', slug: 'drama' },
  ],
};

const dangalMovie: NormalizedMovie = {
  id: 'movie-dangal-2016',
  slug: 'dangal-2016',
  primaryTitle: 'Dangal',
  originalTitle: 'दंगल',
  alternativeTitles: [],
  supportedLanguages: ['HINDI'],
  industries: ['BOLLYWOOD'],
  countries: ['IN'],
  releaseDate: new Date('2016-12-23'),
  releaseYear: 2016,
  canonicalIndiaReleaseDate: new Date('2016-12-23'),
  boxOffice: 20240000000,
  boxOfficeCurrency: 'INR',
  boxOfficeStatus: 'FINAL',
  rating: 8.4,
  lifecycleStatus: 'ACTIVE',
  playableAsGuess: true,
  playableAsTarget: true,
  directors: [
    {
      id: 'person-nitesh-tiwari',
      canonicalName: 'Nitesh Tiwari',
      alternateNames: [],
      roleType: 'DIRECTOR',
      relationType: 'CREW',
    },
  ],
  musicDirectors: [
    {
      id: 'person-pritam',
      canonicalName: 'Pritam',
      alternateNames: [],
      roleType: 'MUSIC_DIRECTOR',
      relationType: 'CREW',
    },
  ],
  leadActors: [
    {
      id: 'person-aamir-khan',
      canonicalName: 'Aamir Khan',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  leadActresses: [
    {
      id: 'person-fatima-sana-shaikh',
      canonicalName: 'Fatima Sana Shaikh',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  supportingCast: [
    {
      id: 'person-sanya-malhotra',
      canonicalName: 'Sanya Malhotra',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
  ],
  crew: [],
  productionHouses: [
    {
      id: 'prod-aamir-khan-prod',
      canonicalName: 'Aamir Khan Productions',
      alternateNames: [],
      relationshipType: 'PRODUCTION',
    },
  ],
  genres: [
    { id: 'genre-drama', canonicalName: 'Drama', slug: 'drama' },
    { id: 'genre-sports', canonicalName: 'Sports', slug: 'sports' },
  ],
};

const unknownBoxOfficeMovie: NormalizedMovie = {
  ...rrrMovie,
  id: 'movie-unknown-bo',
  primaryTitle: 'Indie Film',
  boxOffice: null,
  boxOfficeStatus: 'UNKNOWN',
};

describe('Clue Engine', () => {
  it('correctly evaluates an exact guess match (RRR vs RRR)', () => {
    const evalResult = defaultClueEngine.evaluateGuess(rrrMovie, rrrMovie);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.clues.LANGUAGE.status).toBe('EXACT');
    expect(evalResult.clues.DIRECTOR.status).toBe('EXACT');
    expect(evalResult.clues.PRODUCTION_HOUSE.status).toBe('EXACT');
    expect(evalResult.clues.RELEASE_YEAR.status).toBe('EXACT');
    expect(evalResult.clues.RELEASE_YEAR.direction).toBe('NONE');
    expect(evalResult.clues.BOX_OFFICE.status).toBe('EXACT');
    expect(evalResult.clues.RATING.status).toBe('EXACT');
    expect(evalResult.clues.LEAD_ACTOR.status).toBe('EXACT');
    expect(evalResult.clues.LEAD_ACTRESS.status).toBe('EXACT');
    expect(evalResult.clues.MUSIC_DIRECTOR.status).toBe('EXACT');
    expect(evalResult.clues.GENRES.status).toBe('EXACT');
  });

  it('correctly evaluates Director overlap and Year direction (Baahubali vs RRR target)', () => {
    const evalResult = defaultClueEngine.evaluateGuess(rrrMovie, baahubaliMovie);
    expect(evalResult.isCorrect).toBe(false);
    // Same director S.S. Rajamouli
    expect(evalResult.clues.DIRECTOR.status).toBe('EXACT');
    expect(evalResult.clues.DIRECTOR.matchedValues).toContain('S. S. Rajamouli');
    // Same music director M.M. Keeravaani
    expect(evalResult.clues.MUSIC_DIRECTOR.status).toBe('EXACT');
    // Languages: RRR (TE, HI, TA) vs Baahubali (TE, TA) -> PARTIAL
    expect(evalResult.clues.LANGUAGE.status).toBe('PARTIAL');
    // Year: Baahubali (2015) vs Target RRR (2022) -> diff -7 > threshold 3 -> NONE, direction UP
    expect(evalResult.clues.RELEASE_YEAR.status).toBe('NONE');
    expect(evalResult.clues.RELEASE_YEAR.direction).toBe('UP');
    // Rating: 8.1 vs 8.0 -> diff 0.1 <= 0.5 -> CLOSE, direction DOWN
    expect(evalResult.clues.RATING.status).toBe('CLOSE');
    expect(evalResult.clues.RATING.direction).toBe('DOWN');
  });

  it('correctly evaluates Dangal vs Target RRR', () => {
    const evalResult = defaultClueEngine.evaluateGuess(rrrMovie, dangalMovie);
    expect(evalResult.isCorrect).toBe(false);
    expect(evalResult.clues.DIRECTOR.status).toBe('NONE');
    expect(evalResult.clues.LEAD_ACTOR.status).toBe('NONE');
    expect(evalResult.clues.MUSIC_DIRECTOR.status).toBe('NONE');
    // Genres: Drama overlaps -> PARTIAL
    expect(evalResult.clues.GENRES.status).toBe('PARTIAL');
    expect(evalResult.clues.GENRES.matchedValues).toContain('Drama');
  });

  it('handles missing/unknown Box Office explicitly without collapsing to zero', () => {
    const evalResult = defaultClueEngine.evaluateGuess(rrrMovie, unknownBoxOfficeMovie);
    expect(evalResult.clues.BOX_OFFICE.status).toBe('UNAVAILABLE');
    expect(evalResult.clues.BOX_OFFICE.direction).toBe('NONE');
  });
});
