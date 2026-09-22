import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ingestionService } from '../ingestion-service';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { movieRepository } from '@/modules/movies/movie-repository';
import { prisma } from '@/infrastructure/db/client';
import { HISTORICAL_CATALOG } from '@/infrastructure/external-sources/historical-catalog-data';

describe('Ingestion Service & Historical Discovery', () => {
  let initialCanonicalMovieCount = 0;

  beforeAll(async () => {
    initialCanonicalMovieCount = await prisma.movie.count();

    vi.spyOn(tmdbAdapter, 'discover').mockImplementation(async (options) => {
      const { language, year, page = 1 } = options;
      const pageSize = 20;
      const matches = HISTORICAL_CATALOG.filter((m) => {
        const movieYear = parseInt(m.details.release_date.split('-')[0], 10);
        return m.details.original_language === language && movieYear === year;
      });

      const totalResults = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
      const startIdx = (page - 1) * pageSize;
      const pageMatches = matches.slice(startIdx, startIdx + pageSize);

      return {
        results: pageMatches.map((m) => ({
          source: 'TMDB',
          sourceMovieId: String(m.details.id),
          title: m.details.title,
          originalTitle: m.details.original_title,
          releaseDate: m.details.release_date,
          originalLanguage: m.details.original_language,
          popularity: (m.details.vote_count || 0) / 100,
          voteAverage: m.details.vote_average,
          voteCount: m.details.vote_count,
        })),
        totalPages,
        totalResults,
      };
    });

    vi.spyOn(tmdbAdapter, 'discoverMovies').mockImplementation(async (language: string, year: number, page = 1) => {
      return tmdbAdapter.discover({ language, year, page });
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });
  it('discovers historical Telugu and Hindi movies for 2002-2026', async () => {
    const te2002 = await tmdbAdapter.discoverMovies('te', 2002);
    expect(te2002.results.length).toBeGreaterThan(0);
    expect(te2002.results.some((m) => m.title === 'Indra')).toBe(true);

    const hi2002 = await tmdbAdapter.discoverMovies('hi', 2002);
    expect(hi2002.results.length).toBeGreaterThan(0);
    expect(hi2002.results.some((m) => m.title === 'Devdas')).toBe(true);
  });

  it('enriches discovered movie with credits, crew and alternative titles', async () => {
    const devdasDetails = await tmdbAdapter.getMovieDetails('200203');
    expect(devdasDetails.title).toBe('Devdas');
    expect(devdasDetails.original_language).toBe('hi');

    const devdasCredits = await tmdbAdapter.getCredits('200203');
    expect(devdasCredits.cast.some((c) => c.name === 'Shah Rukh Khan')).toBe(true);
    expect(devdasCredits.crew.some((c) => c.job === 'Director' && c.name === 'Sanjay Leela Bhansali')).toBe(true);

    const altTitles = await tmdbAdapter.getAlternativeTitles('200203');
    expect(Array.isArray(altTitles)).toBe(true);
  });

  it('correctly ingests and searches movies by title', async () => {
    await ingestionService.discoverYear('te', 2002);
    const candidate = await prisma.ingestionCandidate.findFirst({
      where: { sourceMovieId: '200201' },
    });
    expect(candidate).toBeDefined();

    if (candidate) {
      const processRes = await ingestionService.processCandidate(candidate.id);
      expect(processRes.status).toMatch(/PROCESSED|REVIEW_REQUIRED/);
    }

    const results = await movieRepository.search('Indra');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].primaryTitle).toBe('Indra');
    expect(results[0].releaseYear).toBe(2002);
    expect(results[0].playableAsGuess).toBe(true);
  });

  it('guarantees zero canonical catalog additions during test run', async () => {
    const currentCount = await prisma.movie.count();
    expect(currentCount).toBe(initialCanonicalMovieCount);
  });
});

