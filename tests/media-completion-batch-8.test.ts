import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_8_APPROVALS } from '../scripts/apply-batch-8-approvals';

describe('Media Completion Batch 8: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 8 Approved Poster URL Integrity', () => {
    it('verifies all 26 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_8_APPROVALS).toHaveLength(26);
      for (const item of BATCH_8_APPROVALS) {
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

  describe('2. Batch 8 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 1950 Chandrika film poster collision against 2015 Telugu film Chandrika', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Chandrika', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Chandrika_film_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Chandrika (film)',
          candidateYear: 1950,
          snippet: '1950 Indian Malayalam/Tamil-language film directed by V. S. Raghavan',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects musician/person portrait Anup Rubens against Padesave', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Padesave', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Anup_Rubens.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Anup Rubens',
          candidateYear: 2016,
          snippet: 'Music director and composer portrait',
          sourceDomain: 'wikimedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1994 classic Premikudu against 2016 Telugu indie Premikudu', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Premikudu', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Kadhalan_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Premikudu (1994)',
          candidateYear: 1994,
          snippet: '1994 romantic thriller film directed by S. Shankar starring Prabhu Deva',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Vil Ambu artwork against Telugu dubbed release Parvathipuram', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Parvathipuram', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/36/Vil_Ambu_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Vil Ambu',
          candidateYear: 2016,
          snippet: 'Tamil original release poster of Vil Ambu',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil JK Enum Nanbanin Vaazhkai poster against Telugu Rajadhi Raja entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Rajadhi Raja', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/JK_Enum_Nanbanin_Vaazhkai_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'JK Enum Nanbanin Vaazhkai',
          candidateYear: 2015,
          snippet: 'Tamil release poster of bilingual drama directed by Cheran',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Irudhi Suttru poster against Hindi Saala Khadoos entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Saala Khadoos', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Irudhi_Suttru.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Irudhi Suttru',
          candidateYear: 2016,
          snippet: 'Tamil language theatrical release poster featuring Tamil title typography',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Devi poster against Hindi Tutak Tutak Tutiya entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Tutak Tutak Tutiya', releaseYear: 2016 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Devi_2016_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Devi (2016 film)',
          candidateYear: 2016,
          snippet: 'Tamil language theatrical poster of multilingual comedy',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil Thoongaa Vanam poster against Telugu Cheekati Rajyam entry', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Cheekati Rajyam', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Thoongaa_Vanam_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Thoongaa Vanam',
          candidateYear: 2015,
          snippet: 'Tamil primary release poster starring Kamal Haasan',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2002 US horror film May against corrupted catalog entry - May', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: '- May', releaseYear: 2015 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/may.JPG',
          source: 'GOOGLE',
          candidateTitle: 'May (film)',
          candidateYear: 2002,
          snippet: '2002 American psychological slasher film written and directed by Lucky McKee',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 8 Scope & Accounting Integrity', () => {
    it('documents exactly 26 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_8_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(26);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_8_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
