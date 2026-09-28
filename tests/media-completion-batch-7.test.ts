import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_7_APPROVALS } from '../scripts/apply-batch-7-approvals';

describe('Media Completion Batch 7: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 7 Approved Poster URL Integrity', () => {
    it('verifies all 15 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_7_APPROVALS).toHaveLength(15);
      for (const item of BATCH_7_APPROVALS) {
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

  describe('2. Batch 7 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 2011 Puri Jagannadh Nenu Naa Rakshasi collision against 2017 Panna Royal Rakshasi', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Rakshasi', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Nenu_Naa_Rakshasi_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Nenu Naa Rakshasi',
          candidateYear: 2011,
          snippet: '2011 Telugu film starring Rana Daggubati and Ileana D\'Cruz directed by Puri Jagannadh',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2007 Siddharth Aata collision against 2016 Shradda Das film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Aata', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/81/Aata_movie_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Aata (2007 film)',
          candidateYear: 2007,
          snippet: '2007 Telugu romantic action film starring Siddharth and Ileana',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1988 Nagarjuna classic Janaki Ramudu collision against 2016 film', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Janaki Ramudu', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Janaki_Ramudu_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Janaki Ramudu',
          candidateYear: 1988,
          snippet: '1988 Telugu musical film starring Akkineni Nagarjuna and Vijayashanti',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Devi poster against Telugu Abhinetri entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Abhinetri', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Devi_2016_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Devi (2016 film)',
          candidateYear: 2016,
          snippet: 'Tamil version poster of multilingual film starring Prabhu Deva and Tamannaah',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Velaiilla Pattadhari 2 poster against Telugu VIP 2 entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'VIP 2', releaseYear: 2017 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8b/Velaiilla_Pattadhari_2.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Velaiilla Pattadhari 2',
          candidateYear: 2017,
          snippet: 'Tamil version poster of action comedy film starring Dhanush and Kajol',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Kannada Idolle Ramayana poster against Telugu Mana Oori Ramayanam entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Mana Oori Ramayanam', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Idolle_Ramayana.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Idolle Ramayana',
          candidateYear: 2016,
          snippet: 'Kannada release poster of bilingual film directed by Prakash Raj',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Yagavarayinum Naa Kaakka poster against Telugu Malupu entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Malupu', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Yagavarayinum_Naa_Kaakka.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Yagavarayinum Naa Kaakka',
          candidateYear: 2015,
          snippet: 'Tamil release poster of bilingual film starring Aadhi Pinisetty',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 7 Scope & Accounting Integrity', () => {
    it('documents exactly 15 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_7_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(15);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_7_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
