import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../game-engine';
import { defaultClueEngine } from '@/modules/clues/clue-engine';
import { NormalizedMovie } from '@/domain/movie/types';
import { GameRulesetDomain } from '@/domain/game/types';

// Mock test movies
const targetPushpa: NormalizedMovie = {
  id: 'movie-pushpa-2021',
  slug: 'pushpa-the-rise-2021',
  primaryTitle: 'Pushpa: The Rise',
  originalTitle: 'పుష్ప: ది రైజ్',
  alternativeTitles: ['Pushpa 1'],
  supportedLanguages: ['TELUGU', 'HINDI'],
  industries: ['TOLLYWOOD'],
  countries: ['IN'],
  releaseDate: new Date('2021-12-17'),
  releaseYear: 2021,
  canonicalIndiaReleaseDate: new Date('2021-12-17'),
  boxOffice: 3500000000,
  boxOfficeCurrency: 'INR',
  boxOfficeStatus: 'FINAL',
  rating: 7.6,
  lifecycleStatus: 'ACTIVE',
  playableAsGuess: true,
  playableAsTarget: true,
  directors: [
    {
      id: 'person-sukumar',
      canonicalName: 'Sukumar',
      alternateNames: [],
      roleType: 'DIRECTOR',
      relationType: 'CREW',
    },
  ],
  musicDirectors: [
    {
      id: 'person-dsp',
      canonicalName: 'Devi Sri Prasad',
      alternateNames: ['DSP'],
      roleType: 'MUSIC_DIRECTOR',
      relationType: 'CREW',
    },
  ],
  leadActors: [
    {
      id: 'person-allu-arjun',
      canonicalName: 'Allu Arjun',
      alternateNames: ['Icon Star'],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  leadActresses: [
    {
      id: 'person-rashmika',
      canonicalName: 'Rashmika Mandanna',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  supportingCast: [
    {
      id: 'person-fahadh',
      canonicalName: 'Fahadh Faasil',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
  ],
  crew: [],
  productionHouses: [
    {
      id: 'prod-mythri',
      canonicalName: 'Mythri Movie Makers',
      alternateNames: [],
      relationshipType: 'PRODUCTION',
    },
  ],
  genres: [
    { id: 'genre-action', canonicalName: 'Action', slug: 'action' },
    { id: 'genre-thriller', canonicalName: 'Thriller', slug: 'thriller' },
  ],
};

const guessAlaVaikunthapurramuloo: NormalizedMovie = {
  id: 'movie-avpl-2020',
  slug: 'ala-vaikunthapurramuloo-2020',
  primaryTitle: 'Ala Vaikunthapurramuloo',
  originalTitle: 'అల వైకుంఠపురములో',
  alternativeTitles: ['AVPL'],
  supportedLanguages: ['TELUGU'],
  industries: ['TOLLYWOOD'],
  countries: ['IN'],
  releaseDate: new Date('2020-01-12'),
  releaseYear: 2020,
  canonicalIndiaReleaseDate: new Date('2020-01-12'),
  boxOffice: 2800000000,
  boxOfficeCurrency: 'INR',
  boxOfficeStatus: 'FINAL',
  rating: 7.4,
  lifecycleStatus: 'ACTIVE',
  playableAsGuess: true,
  playableAsTarget: true,
  directors: [
    {
      id: 'person-trivikram',
      canonicalName: 'Trivikram Srinivas',
      alternateNames: [],
      roleType: 'DIRECTOR',
      relationType: 'CREW',
    },
  ],
  musicDirectors: [
    {
      id: 'person-thaman-s',
      canonicalName: 'S. Thaman',
      alternateNames: ['Thaman S'],
      roleType: 'MUSIC_DIRECTOR',
      relationType: 'CREW',
    },
  ],
  leadActors: [
    {
      id: 'person-allu-arjun',
      canonicalName: 'Allu Arjun',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  leadActresses: [
    {
      id: 'person-pooja-hegde',
      canonicalName: 'Pooja Hegde',
      alternateNames: [],
      roleType: 'LEAD',
      relationType: 'CAST',
    },
  ],
  supportingCast: [
    {
      id: 'person-tabu',
      canonicalName: 'Tabu',
      alternateNames: [],
      roleType: 'SUPPORTING',
      relationType: 'CAST',
    },
  ],
  crew: [],
  productionHouses: [
    {
      id: 'prod-haarika-hassine',
      canonicalName: 'Haarika & Hassine Creations',
      alternateNames: [],
      relationshipType: 'PRODUCTION',
    },
  ],
  genres: [
    { id: 'genre-action', canonicalName: 'Action', slug: 'action' },
    { id: 'genre-comedy', canonicalName: 'Comedy', slug: 'comedy' },
  ],
};

describe('GameEngine Domain Logic', () => {
  let mockMovies: Map<string, NormalizedMovie>;
  let mockSession: any;
  let mockGameRepo: any;
  let mockMovieRepo: any;
  let engine: GameEngine;

  beforeEach(() => {
    mockMovies = new Map([
      [targetPushpa.id, targetPushpa],
      [guessAlaVaikunthapurramuloo.id, guessAlaVaikunthapurramuloo],
    ]);

    mockSession = {
      id: 'session-123',
      gameId: 'game-123',
      status: 'NOT_STARTED',
      attemptsUsed: 0,
      guesses: [],
      hintsUsed: [],
      game: {
        id: 'game-123',
        mode: 'DAILY',
        targetMovieId: targetPushpa.id,
        maxAttempts: 10,
        ruleset: {
          id: 'ruleset-1',
          name: 'DEFAULT_V1',
          maxAttempts: 10,
          enabledClues: ['LANGUAGE', 'LEAD_ACTOR', 'RELEASE_YEAR'],
          clueConfiguration: { yearCloseThreshold: 3 },
          hintConfiguration: { firstHintUnlockAttempt: 5, secondHintUnlockAttempt: 8 },
          duplicateGuessPolicy: 'REJECT_NO_PENALTY',
          targetEligibilityPolicy: 'PLAYABLE_AS_TARGET',
        },
      },
    };

    mockMovieRepo = {
      findById: async (id: string) => mockMovies.get(id) || null,
    };

    mockGameRepo = {
      findSessionById: async () => mockSession,
      recordGuessTransaction: async (_sid: string, data: any) => {
        const guessRecord = {
          id: `guess-${data.attemptNumber}`,
          movieId: data.movieId,
          attemptNumber: data.attemptNumber,
          evaluation: data.evaluation,
          isCorrect: data.isCorrect,
          clientRequestId: data.clientRequestId,
          createdAt: new Date(),
        };
        mockSession.attemptsUsed = data.attemptNumber;
        mockSession.status = data.newSessionStatus;
        mockSession.guesses.push(guessRecord);
        return { guess: guessRecord, session: mockSession };
      },
      addHintToSession: async () => ({
        id: 'hint-1',
        hintType: 'DIRECTOR_INITIAL',
        hintContent: { hintText: 'Directed by S.' },
        unlockedAt: new Date(),
      }),
    };

    engine = new GameEngine(mockMovieRepo as any, mockGameRepo as any, defaultClueEngine);
  });

  it('evaluates incorrect guess, increases attempts, hides target, matches lead actor', async () => {
    const res = await engine.submitGuess('session-123', {
      movieId: guessAlaVaikunthapurramuloo.id,
    });

    expect(res.attemptNumber).toBe(1);
    expect(res.isCorrect).toBe(false);
    expect(res.status).toBe('IN_PROGRESS');
    expect(res.attemptsRemaining).toBe(9);
    // Target is kept secret!
    expect(res.revealedTarget).toBeNull();
    // Lead actor Allu Arjun matches!
    expect(res.evaluation.clues.LEAD_ACTOR.status).toBe('EXACT');
    expect(res.evaluation.clues.LEAD_ACTOR.matchedValues).toContain('Allu Arjun');
  });

  it('rejects duplicate guess without consuming attempts', async () => {
    // Guess once
    await engine.submitGuess('session-123', {
      movieId: guessAlaVaikunthapurramuloo.id,
    });
    expect(mockSession.attemptsUsed).toBe(1);

    // Duplicate guess
    await expect(
      engine.submitGuess('session-123', {
        movieId: guessAlaVaikunthapurramuloo.id,
      })
    ).rejects.toThrow('You have already guessed this movie.');

    // Attempts should still be 1!
    expect(mockSession.attemptsUsed).toBe(1);
  });

  it('evaluates winning guess, reveals target, completes session as WON', async () => {
    const res = await engine.submitGuess('session-123', {
      movieId: targetPushpa.id,
    });

    expect(res.isCorrect).toBe(true);
    expect(res.status).toBe('WON');
    expect(res.revealedTarget).not.toBeNull();
    expect(res.revealedTarget?.title).toBe('Pushpa: The Rise');
  });
});
