import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_6_APPROVALS } from '../scripts/apply-batch-6-approvals';

describe('Media Completion Batch 6: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 6 Approved Poster URL Integrity', () => {
    it('verifies all 9 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_6_APPROVALS).toHaveLength(9);
      for (const item of BATCH_6_APPROVALS) {
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

  describe('2. Batch 6 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 1990 Gerard Depardieu Green Card foreign film collision against 2017 Telugu film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Green Card', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dc/Greencardposter.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Green Card (film)',
          candidateYear: 1990,
          snippet: '1990 romantic comedy starring Gérard Depardieu and Andie MacDowell',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2005 Robert Downey Jr. Kiss Kiss Bang Bang collision against 2017 Telugu film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Kiss Kiss Bang Bang', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Kiss_kiss_bang_bang_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Kiss Kiss Bang Bang',
          candidateYear: 2005,
          snippet: '2005 American neo-noir comedy film directed by Shane Black',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2019 Taapsee Pannu Game Over collision against 2017 Hindi film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Game Over', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Game_Over_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Game Over (2019 film)',
          candidateYear: 2019,
          snippet: '2019 psychological thriller film starring Taapsee Pannu',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects foreign English title Viceroy House poster against Indian title Partition: 1947', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Partition: 1947', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Viceroy%27s_House_%28film%29.png',
          source: 'GOOGLE',
          candidateTitle: "Viceroy's House (film)",
          candidateYear: 2017,
          snippet: 'British-Indian historical drama film directed by Gurinder Chadha',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 6 Scope & Accounting Integrity', () => {
    it('documents exactly 9 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_6_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(9);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_6_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
