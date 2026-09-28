import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_3_APPROVALS } from '../scripts/apply-batch-3-approvals';

describe('Media Completion Batch 3: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 3 Approved Poster URL Integrity', () => {
    it('verifies all 30 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_3_APPROVALS).toHaveLength(30);
      for (const item of BATCH_3_APPROVALS) {
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

  describe('2. Batch 3 Anti-Collision & Guard Invariants', () => {
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

    it('rejects candidates with major year discrepancies (> 2 years difference)', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: '4 Letters', releaseYear: 2019 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/four_letters_2025.jpg',
          source: 'GOOGLE',
          candidateTitle: '4 Letters (2025 short film)',
          candidateYear: 2025,
          snippet: 'Short film released in 2025',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects multi-language / adaptation collisions without explicit verification', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Haathi Mere Saathi', releaseYear: 2021 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/03/Kaadan_Poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Kaadan (Tamil version)',
          candidateYear: 2021,
          snippet: 'Tamil version Kaadan directed by Prabhu Solomon',
          sourceDomain: 'wikipedia.org',
        }
      );
      // High score cannot auto-enrich if title differs significantly across languages
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 3 Scope & Accounting Integrity', () => {
    it('documents exactly 30 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_3_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(30);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_3_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
