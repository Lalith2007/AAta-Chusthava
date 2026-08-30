import { describe, it, expect } from 'vitest';
import { ingestionService } from '../ingestion-service';
import { tmdbAdapter } from '@/infrastructure/external-sources/tmdb-adapter';
import { movieRepository } from '@/modules/movies/movie-repository';
import { prisma } from '@/infrastructure/db/client';

describe('Ingestion Service & Historical Discovery', () => {
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
});
