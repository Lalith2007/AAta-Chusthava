import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_9_APPROVALS } from '../scripts/apply-batch-9-approvals';

describe('Media Completion Batch 9: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 9 Approved Poster URL Integrity', () => {
    it('verifies all 27 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_9_APPROVALS).toHaveLength(27);
      for (const item of BATCH_9_APPROVALS) {
        const validation = mediaIdentityValidator.validateImageUrl(item.url);
        expect(validation.isValid, `Poster URL for "${item.title}" should be valid`).toBe(true);
        expect(validation.normalizedUrl).toBeDefined();
        expect(validation.normalizedUrl?.startsWith('https://')).toBe(true);
      }
    });

    it('rejects invalid or placeholder URLs', () => {
      const invalid = [
        'https://image.tmdb.org/t/p/w500/placeholder.png',
        'https://google.com/url?q=https://example.com/poster.jpg',
        'https://image.tmdb.org/t/p/w500/no-image.jpg',
        'https://image.tmdb.org/t/p/w500/default_avatar.png',
        'undefined',
        'null',
        '',
      ];
      for (const url of invalid) {
        const res = mediaIdentityValidator.validateImageUrl(url);
        expect(res.isValid).toBe(false);
      }
    });
  });

  describe('2. Batch 9 Anti-Collision & Guard Invariants', () => {
    it('strictly maintains Kalki 2898 AD Dune rejection guard', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Kalki 2898 AD', releaseYear: 2024, tmdbId: 792307 },
        {
          imageUrl: 'https://image.tmdb.org/t/p/w500/dune_sandworm.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Dune: Part Two',
          candidateYear: 2024,
          snippet: 'Arrakis desert drama',
          sourceDomain: 'themoviedb.org',
        }
      );
      expect(result.confidence).toBe('REJECTED_CONFLICT');
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2013 Malayalam Ladies and Gentleman against 2015 Telugu Ladies & Gentleman', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Ladies & Gentleman', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Ladies_and_Gentleman.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Ladies and Gentleman',
          candidateYear: 2013,
          snippet: '2013 Indian Malayalam-language comedy-drama film written and directed by Siddique starring Mohanlal',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2017 Jai Lava Kusa against 2015 Telugu Lava Kusa', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Lava Kusa', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c1/Jai_Lava_Kusa.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Jai Lava Kusa',
          candidateYear: 2017,
          snippet: '2017 Indian Telugu action film written and directed by K. S. Ravindra starring N. T. Rama Rao Jr.',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Moone Moonu Varthai poster against Telugu Moodu Mukkallo Cheppalante', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Moodu Mukkallo Cheppalante', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/24/Moone_Moonu_Varthai.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Moone Moonu Varthai',
          candidateYear: 2015,
          snippet: 'Tamil theatrical release poster featuring Tamil title typography',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Kannada version poster for bilingual Red Alert against Telugu entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Red Alert', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/96/Red_Alert_%282015_film%29.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Red Alert (2015 film)',
          candidateYear: 2015,
          snippet: 'Kannada version poster of multilingual action film directed by Chandra Mahesh',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2013 Prabhas blockbuster Mirchi against 2015 Varadhi', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Varadhi', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a8/Mirchi_film_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Mirchi (film)',
          candidateYear: 2013,
          snippet: '2013 Telugu action film directed by Koratala Siva starring Prabhas originally titled Vaaradhi',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1927 Oswald cartoon The Bells against 2015 Telugu release The Bells', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'The Bells', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Oswald_Sleigh_Bells_%281927%29.png',
          source: 'GOOGLE',
          candidateTitle: 'Sleigh Bells (film)',
          candidateYear: 1927,
          snippet: '1927 animated short cartoon featuring Oswald the Lucky Rabbit directed by Walt Disney',
          sourceDomain: 'wikimedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1967 animated film The Jungle Book against Akela The Alone', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Akela The Alone', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Thejunglebook_movieposter.jpg',
          source: 'GOOGLE',
          candidateTitle: 'The Jungle Book (1967 film)',
          candidateYear: 1967,
          snippet: '1967 animated musical comedy film produced by Walt Disney',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2024 film Committee Kurrollu against 2014 33 Prema Kathalu', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: '33 Prema Kathalu', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f7/Committee_Kurrollu_film_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Committee Kurrollu',
          candidateYear: 2024,
          snippet: '2024 Indian Telugu-language comedy drama film',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects actor biographical portrait against theatrical movie entry for Akkineni Nageswara Rao', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Akkineni Nageswara Rao', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Akkineni_Nageswara_Rao.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Akkineni Nageswara Rao (1924–2014 biography)',
          candidateYear: 1924,
          snippet: 'Actor and producer biographical record',
          sourceDomain: 'wikimedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 9 Scope & Accounting Integrity', () => {
    it('documents exactly 27 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_9_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(27);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_9_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
