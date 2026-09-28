import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_5_APPROVALS } from '../scripts/apply-batch-5-approvals';

describe('Media Completion Batch 5: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 5 Approved Poster URL Integrity', () => {
    it('verifies all 13 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_5_APPROVALS).toHaveLength(13);
      for (const item of BATCH_5_APPROVALS) {
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

  describe('2. Batch 5 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 1985 Arnold Schwarzenegger Commando collision against 2017 Vidyut Jammwal film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Commando 2', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d9/Commandoposter.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Commando (1985 film)',
          candidateYear: 1985,
          snippet: '1985 American action film starring Arnold Schwarzenegger',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Kannada Chakravarthy 2017 collision against Telugu Dr. Chakravarthy', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Dr. Chakravarthy', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/76/Chakravarthy_%282017_film%29.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Chakravarthy (2017 film)',
          candidateYear: 2017,
          snippet: '2017 Kannada film starring Darshan and Deepa Sannidhi',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Diya poster against Telugu Kanam entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Kanam', releaseYear: 2018 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/27/Diya_film_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Diya (film)',
          candidateYear: 2018,
          snippet: 'Tamil version poster of bilingual film directed by A. L. Vijay',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 5 Scope & Accounting Integrity', () => {
    it('documents exactly 13 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_5_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(13);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_5_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
