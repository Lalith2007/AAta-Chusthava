import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/infrastructure/db/client';
import { enrichmentService } from '../enrichment-service';
import { isValidPersonName } from '@/infrastructure/external-sources/wikipedia-adapter';

describe('Catalog Enrichment & Target Recovery Service', () => {
  const TEST_MOVIE_ID_1 = 'enrich-test-movie-1';
  const TEST_MOVIE_ID_2 = 'enrich-test-movie-2';

  beforeEach(async () => {
    // Setup test movies in database
    await prisma.movie.deleteMany({
      where: { id: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2] } },
    });

    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_1,
        slug: 'test-enrichment-target-film-2020',
        primaryTitle: 'Middle Class Melodies',
        originalTitle: 'Middle Class Melodies',
        releaseYear: 2020,
        supportedLanguages: ['TELUGU'],
        industries: ['TOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        eligibility: {
          create: {
            playableAsGuess: true,
            playableAsTarget: false,
            minimumMetadataComplete: false,
            reviewStatus: 'PENDING',
          },
        },
      },
    });

    await prisma.movie.create({
      data: {
        id: TEST_MOVIE_ID_2,
        slug: 'test-incomplete-short-film-2025',
        primaryTitle: 'NonExistentFakeShortFilm999',
        originalTitle: 'NonExistentFakeShortFilm999',
        releaseYear: 2025,
        supportedLanguages: ['HINDI'],
        industries: ['BOLLYWOOD'],
        lifecycleStatus: 'ACTIVE',
        eligibility: {
          create: {
            playableAsGuess: true,
            playableAsTarget: false,
            minimumMetadataComplete: false,
            reviewStatus: 'PENDING',
          },
        },
      },
    });
  });

  afterEach(async () => {
    await prisma.movie.deleteMany({
      where: { id: { in: [TEST_MOVIE_ID_1, TEST_MOVIE_ID_2] } },
    });
  });

  it('1. Person Name Validator rejects all forbidden placeholders and structural noise', () => {
    expect(isValidPersonName('Vinod Ananthoju')).toBe(true);
    expect(isValidPersonName('Anand Deverakonda')).toBe(true);
    expect(isValidPersonName('Varsha Bollamma')).toBe(true);

    expect(isValidPersonName('Director')).toBe(false);
    expect(isValidPersonName('Lead Actor')).toBe(false);
    expect(isValidPersonName('Supporting Actor')).toBe(false);
    expect(isValidPersonName('Actor')).toBe(false);
    expect(isValidPersonName('Actress')).toBe(false);
    expect(isValidPersonName('N/A')).toBe(false);
    expect(isValidPersonName('Unknown')).toBe(false);
    expect(isValidPersonName('TBA')).toBe(false);
    expect(isValidPersonName('TBD')).toBe(false);
    expect(isValidPersonName('style="text-align:center"')).toBe(false);
    expect(isValidPersonName('wikitable')).toBe(false);
  });

  it('2. Cleans raw person names from wikitext links and parentheses', () => {
    expect(enrichmentService.cleanPersonName('[[Anand Deverakonda]]')).toBe('Anand Deverakonda');
    expect(enrichmentService.cleanPersonName('[[Varsha Bollamma|Varsha]]')).toBe('Varsha Bollamma');
    expect(enrichmentService.cleanPersonName('Vishal Mishra (director)')).toBe('Vishal Mishra');
    expect(enrichmentService.cleanPersonName('Rajesh Sharma (actor)')).toBe('Rajesh Sharma');
    expect(enrichmentService.cleanPersonName('* [[Siddharth Anand]]')).toBe('Siddharth Anand');
    expect(enrichmentService.cleanPersonName('Director')).toBe(null);
    expect(enrichmentService.cleanPersonName('')).toBe(null);
  });

  it('3. Dry-Run mode evaluates potential target recovery without writing to database', async () => {
    const result = await enrichmentService.enrichMovie(TEST_MOVIE_ID_1, { dryRun: true });
    expect(result.movieId).toBe(TEST_MOVIE_ID_1);
    expect(result.previousTargetPlayable).toBe(false);

    // Verify DB was NOT mutated in dry-run
    const dbMovie = await prisma.movie.findUnique({
      where: { id: TEST_MOVIE_ID_1 },
      include: { eligibility: true, people: true },
    });
    expect(dbMovie?.eligibility?.playableAsTarget).toBe(false);
    expect(dbMovie?.eligibility?.reviewStatus).toBe('PENDING');
  });

  it('4. Enriches movie with verified metadata and recovers target playability', async () => {
    const result = await enrichmentService.enrichMovie(TEST_MOVIE_ID_1, { dryRun: false });
    expect(result.movieId).toBe(TEST_MOVIE_ID_1);
    expect(result.recoveredTarget).toBe(true);
    expect(result.newTargetPlayable).toBe(true);
    expect(result.directorsAdded.length).toBeGreaterThanOrEqual(1);
    expect(result.castAdded.length).toBeGreaterThanOrEqual(2);

    // Verify DB was updated
    const updatedMovie = await prisma.movie.findUnique({
      where: { id: TEST_MOVIE_ID_1 },
      include: {
        eligibility: true,
        people: { include: { person: true } },
      },
    });

    expect(updatedMovie?.eligibility?.playableAsTarget).toBe(true);
    expect(updatedMovie?.eligibility?.reviewStatus).toBe('APPROVED');
    expect(updatedMovie?.eligibility?.minimumMetadataComplete).toBe(true);

    const validDirs = updatedMovie?.people.filter(
      (p) => p.roleType === 'DIRECTOR' && isValidPersonName(p.person.canonicalName)
    );
    const validCast = updatedMovie?.people.filter(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING') && isValidPersonName(p.person.canonicalName)
    );
    expect(validDirs?.length).toBeGreaterThanOrEqual(1);
    expect(validCast?.length).toBeGreaterThanOrEqual(2);
  });

  it('5. Handles unmatched movies gracefully leaving review status PENDING without fake data', async () => {
    const result = await enrichmentService.enrichMovie(TEST_MOVIE_ID_2, { dryRun: false });
    expect(result.unmatched).toBe(true);
    expect(result.recoveredTarget).toBe(false);
    expect(result.newTargetPlayable).toBe(false);

    const dbMovie = await prisma.movie.findUnique({
      where: { id: TEST_MOVIE_ID_2 },
      include: { eligibility: true },
    });
    expect(dbMovie?.eligibility?.playableAsTarget).toBe(false);
    expect(dbMovie?.eligibility?.reviewStatus).toBe('PENDING');
  });

  it('6. Deterministic conflict resolution merges unique valid persons and avoids duplicate relationships', async () => {
    // Run enrichment twice on TEST_MOVIE_ID_1
    await enrichmentService.enrichMovie(TEST_MOVIE_ID_1, { dryRun: false });
    const countAfterFirst = await prisma.moviePerson.count({ where: { movieId: TEST_MOVIE_ID_1 } });

    await enrichmentService.enrichMovie(TEST_MOVIE_ID_1, { dryRun: false });
    const countAfterSecond = await prisma.moviePerson.count({ where: { movieId: TEST_MOVIE_ID_1 } });

    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('7. Enriches batch of review candidates with progress reporting', async () => {
    let progressCalls = 0;
    const summary = await enrichmentService.enrichCatalog({
      movieId: TEST_MOVIE_ID_1,
      dryRun: true,
      onProgress: () => {
        progressCalls++;
      },
    });

    expect(summary.totalProcessed).toBe(1);
    expect(summary.zeroPlaceholdersVerified).toBe(true);
    expect(progressCalls).toBeGreaterThanOrEqual(1);
  });
});
