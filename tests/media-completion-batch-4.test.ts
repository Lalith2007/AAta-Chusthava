import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_4_APPROVALS } from '../scripts/apply-batch-4-approvals';

describe('Media Completion Batch 4: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 4 Approved Poster URL Integrity', () => {
    it('verifies all 10 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_4_APPROVALS).toHaveLength(10);
      for (const item of BATCH_4_APPROVALS) {
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

  describe('2. Batch 4 Anti-Collision & Guard Invariants', () => {
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

    it('rejects Sarovaram 1993 Malayalam collision against 2019 Telugu target', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Sarovaram', releaseYear: 2019 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/sarovaram_1993.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Sarovaram (1993 film)',
          candidateYear: 1993,
          snippet: '1993 Malayalam film directed by Jeassy starring Mammootty',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects candidate with major year discrepancies (> 2 years difference)', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Pranam Khareedu', releaseYear: 2019 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/pranam_khareedu_1978.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Pranam Khareedu (1978 film)',
          candidateYear: 1978,
          snippet: '1978 Telugu film starring Chiranjeevi',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 4 Scope & Accounting Integrity', () => {
    it('documents exactly 10 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_4_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_4_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
