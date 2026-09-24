import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { PosterDiscoveryProvider } from '../src/modules/enrichment/poster-discovery-provider';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';

vi.mock('../src/infrastructure/external-sources/tmdb-adapter', () => ({
  tmdbAdapter: {
    getMovieDetails: vi.fn(),
    searchMovies: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
}));

describe('Sprint 30B: Media Identity Verification & Poster Acquisition Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Kalki 2898 AD vs Dune Explicit Anti-Collision Regression Guard', () => {
    it('strictly REJECTS Dune candidates when target movie is Kalki 2898 AD', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'Kalki 2898 AD',
          releaseYear: 2024,
          tmdbId: 792307,
        },
        {
          imageUrl: 'https://image.tmdb.org/t/p/w500/dune_part_two_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Dune: Part Two (2024)',
          candidateYear: 2024,
          snippet: 'Starring Timothee Chalamet on Arrakis',
          sourceDomain: 'imdb.com',
        }
      );

      expect(result.confidence).toBe('REJECTED_CONFLICT');
      expect(result.isAcceptableForAutoEnrich).toBe(false);
      expect(result.rejectionReason).toContain('Kalki 2898 AD candidate explicitly rejected due to Dune collision');
    });

    it('ACCEPTS genuine Kalki 2898 AD candidates', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'Kalki 2898 AD',
          releaseYear: 2024,
          tmdbId: 792307,
        },
        {
          imageUrl: 'https://image.tmdb.org/t/p/w500/kalki_2898_ad_official.jpg',
          source: 'TMDB',
          candidateTitle: 'Kalki 2898 AD',
          candidateYear: 2024,
          tmdbId: 792307,
          sourceDomain: 'themoviedb.org',
        }
      );

      expect(result.confidence).toBe('HIGH');
      expect(result.isAcceptableForAutoEnrich).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('2. Poster Identity Scoring & Confidence Thresholds', () => {
    it('yields HIGH confidence for exact TMDB ID match', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'Baahubali: The Beginning',
          releaseYear: 2015,
          tmdbId: 256040,
        },
        {
          imageUrl: 'https://image.tmdb.org/t/p/w500/baahubali_official.jpg',
          source: 'TMDB',
          tmdbId: 256040,
        }
      );

      expect(result.confidence).toBe('HIGH');
      expect(result.isAcceptableForAutoEnrich).toBe(true);
      expect(result.score).toBe(100);
    });

    it('yields HIGH confidence for exact title and exact year from trusted domain', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'RRR',
          releaseYear: 2022,
        },
        {
          imageUrl: 'https://m.media-amazon.com/images/M/rrr_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'RRR',
          candidateYear: 2022,
          sourceDomain: 'imdb.com',
          snippet: 'Official movie poster for RRR (2022)',
        }
      );

      expect(result.confidence).toBe('HIGH');
      expect(result.isAcceptableForAutoEnrich).toBe(true);
      expect(result.matchEvidence.titleMatch).toBe('EXACT');
      expect(result.matchEvidence.yearMatch).toBe('EXACT');
    });

    it('routes near-year or partial title candidates to manual review (MEDIUM/LOW confidence)', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'Eega',
          releaseYear: 2012,
        },
        {
          imageUrl: 'https://example.com/eega_fan_poster.jpg',
          source: 'OTHER',
          candidateTitle: 'Eega The Fly',
          candidateYear: 2013, // Near year
          sourceDomain: 'randomblog.com',
        }
      );

      expect(result.isAcceptableForAutoEnrich).toBe(false);
      expect(['MEDIUM', 'LOW']).toContain(result.confidence);
    });

    it('strictly rejects candidate when year difference is significant', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        {
          title: 'Shiva',
          releaseYear: 1989,
        },
        {
          imageUrl: 'https://example.com/shiva_2006.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Shiva',
          candidateYear: 2006, // Mismatch
          sourceDomain: 'cinema.com',
        }
      );

      expect(result.isAcceptableForAutoEnrich).toBe(false);
      expect(result.confidence).toBe('LOW');
      expect(result.matchEvidence.yearMatch).toBe('MISMATCH');
    });
  });

  describe('3. Image URL Validation & Health Checks', () => {
    it('rejects placeholder and dummy image URLs', () => {
      const placeholders = [
        'https://example.com/placeholder.png',
        'https://example.com/images/no_image.jpg',
        'https://example.com/blank_poster.png',
        'https://example.com/assets/spacer.gif',
        'https://example.com/default_avatar.jpg',
      ];

      for (const url of placeholders) {
        const check = mediaIdentityValidator.validateImageUrl(url);
        expect(check.isValid).toBe(false);
        expect(check.reason).toContain('placeholder pattern');
      }
    });

    it('rejects tracking and redirect URLs', () => {
      const tracking = [
        'https://www.google.com/url?sa=i&url=https%3A%2F%2Ftarget.com',
        'https://ad.doubleclick.net/ddm/trackclk/poster.jpg',
      ];

      for (const url of tracking) {
        const check = mediaIdentityValidator.validateImageUrl(url);
        expect(check.isValid).toBe(false);
        expect(check.reason).toContain('tracking or redirect URL');
      }
    });

    it('rejects null, undefined, empty, or non-image strings', () => {
      expect(mediaIdentityValidator.validateImageUrl(null).isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl(undefined).isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl('').isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl('   ').isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl('null').isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl('undefined').isValid).toBe(false);
      expect(mediaIdentityValidator.validateImageUrl('not-a-valid-url').isValid).toBe(false);
    });

    it('normalizes valid TMDB relative paths and absolute image URLs', () => {
      const relCheck = mediaIdentityValidator.validateImageUrl('/baahubali.jpg');
      expect(relCheck.isValid).toBe(true);
      expect(relCheck.normalizedUrl).toBe('https://image.tmdb.org/t/p/w500/baahubali.jpg');

      const absCheck = mediaIdentityValidator.validateImageUrl('https://m.media-amazon.com/images/poster.jpg');
      expect(absCheck.isValid).toBe(true);
      expect(absCheck.normalizedUrl).toBe('https://m.media-amazon.com/images/poster.jpg');
    });
  });

  describe('4. Exact Search URL Generation', () => {
    it('generates exact Google Search URL for movie posters with exact title and year quotes', () => {
      const url = mediaIdentityValidator.buildMovieGoogleSearchUrl('Kalki 2898 AD', 2024);
      expect(url).toContain('https://www.google.com/search?q=');
      expect(decodeURIComponent(url)).toContain('"Kalki 2898 AD" "2024" movie poster');
    });

    it('generates exact Google Search URL for person profile with profession quotes', () => {
      const url = mediaIdentityValidator.buildPersonGoogleSearchUrl('Prabhas', 'actor');
      expect(url).toContain('https://www.google.com/search?q=');
      expect(decodeURIComponent(url)).toContain('"Prabhas" actor Indian cinema');
    });
  });

  describe('5. Multi-Source Poster Discovery Provider', () => {
    const provider = new PosterDiscoveryProvider();

    it('resolves verified poster via TMDB ID when available and valid', async () => {
      vi.mocked(tmdbAdapter.getMovieDetails).mockResolvedValueOnce({
        id: 256040,
        title: 'Baahubali: The Beginning',
        release_date: '2015-07-10',
        poster_path: '/baahubali_tmdb.jpg',
      } as any);

      const res = await provider.discoverPoster({
        id: 'm-1',
        title: 'Baahubali: The Beginning',
        releaseYear: 2015,
        tmdbId: 256040,
      });

      expect(res.status).toBe('VERIFIED');
      expect(res.source).toBe('TMDB_ID_MATCH');
      expect(res.posterUrl).toBe('https://image.tmdb.org/t/p/w500/baahubali_tmdb.jpg');
    });

    it('resolves verified poster via TMDB exact title+year search when TMDB ID is missing', async () => {
      vi.mocked(tmdbAdapter.searchMovies!).mockResolvedValueOnce({
        results: [
          {
            id: 88888,
            title: 'Hanu-Man',
            release_date: '2024-01-12',
            poster_path: '/hanuman_poster.jpg',
          },
        ],
      } as any);

      const res = await provider.discoverPoster({
        id: 'm-2',
        title: 'Hanu-Man',
        releaseYear: 2024,
        tmdbId: null,
      });

      expect(res.status).toBe('VERIFIED');
      expect(res.source).toBe('TMDB_TITLE_YEAR_MATCH');
      expect(res.posterUrl).toBe('https://image.tmdb.org/t/p/w500/hanuman_poster.jpg');
    });

    it('routes to MANUAL_REVIEW_REQUIRED with prebuilt Google Search URL when no high-confidence candidate found', async () => {
      vi.mocked(tmdbAdapter.searchMovies!).mockResolvedValueOnce({
        results: [],
      } as any);

      const res = await provider.discoverPoster({
        id: 'm-3',
        title: 'Rare Vintage Movie',
        releaseYear: 1965,
        tmdbId: null,
      });

      expect(res.status).toBe('MANUAL_REVIEW_REQUIRED');
      expect(res.posterUrl).toBeNull();
      expect(res.googleSearchUrl).toContain('Rare%20Vintage%20Movie');
      expect(decodeURIComponent(res.googleSearchUrl)).toContain('"Rare Vintage Movie" "1965" movie poster');
    });
  });
});
