import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_11_APPROVALS } from '../scripts/apply-batch-11-approvals';

describe('Media Completion Batch 11: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 11 Approved Poster URL Integrity', () => {
    it('verifies all 108 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_11_APPROVALS).toHaveLength(108);
      for (const item of BATCH_11_APPROVALS) {
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

  describe('2. Batch 11 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 1967 Dustin Hoffman classic The Graduate against 2011 Telugu Graduate', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Graduate', releaseYear: 2011 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8b/Graduateposter67.jpg',
          source: 'GOOGLE',
          candidateTitle: 'The Graduate (1967 film)',
          candidateYear: 1967,
          snippet: '1967 American romantic comedy-drama film directed by Mike Nichols',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2023 American biographical drama Dumb Money against 2011 Telugu Money Money, More Money', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Money Money, More Money', releaseYear: 2011 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Dumb_money_poster.png',
          source: 'GOOGLE',
          candidateTitle: 'Dumb Money (2023 film)',
          candidateYear: 2023,
          snippet: '2023 American biographical comedy-drama film directed by Craig Gillespie',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2008 Hong Kong martial arts film Ip Man against 2010 Hindi film It\'s a Man\'s World', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: "It's a Man's World", releaseYear: 2010 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Ipmanposter02.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Ip Man (film)',
          candidateYear: 2008,
          snippet: 'Hong Kong biographical martial arts film directed by Wilson Yip starring Donnie Yen',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1986 Mani Ratnam classic Mouna Ragam against 2010 Telugu film Mouna Ragam', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Mouna Ragam', releaseYear: 2010 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/87/Mouna_Ragam_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Mouna Ragam (1986 film)',
          candidateYear: 1986,
          snippet: '1986 Indian Tamil-language romantic drama film directed by Mani Ratnam',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1996 classic Pelli Sandadi against 2010 Telugu film Sandadi', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Sandadi', releaseYear: 2010 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/03/Pelli_Sandadi.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Pelli Sandadi (1996 film)',
          candidateYear: 1996,
          snippet: '1996 Indian Telugu-language musical romance film directed by K. Raghavendra Rao',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2011 film Luv Ka The End against 2009 Hindi film Love Ka Tadka', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Love Ka Tadka', releaseYear: 2009 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/ff/Luv_Ka_The_End.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Luv Ka The End (2011 film)',
          candidateYear: 2011,
          snippet: '2011 Hindi-language romantic comedy film directed by Bumpy',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2015 Sharwanand film Malli Malli Idi Rani Roju against 2009 Telugu film Malli Malli', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Malli Malli', releaseYear: 2009 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Malli_Malli_Idi_Rani_Roju_Movie_Poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Malli Malli Idi Rani Roju (2015 film)',
          candidateYear: 2015,
          snippet: '2015 Indian Telugu-language romantic drama film directed by Kranthi Madhav',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1997 David Lynch film Lost Highway against 2008 Telugu film Highway', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Highway', releaseYear: 2008 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/Lost_Higway_%281997%29.png',
          source: 'GOOGLE',
          candidateTitle: 'Lost Highway (1997 film)',
          candidateYear: 1997,
          snippet: '1997 surrealist neo-noir horror film directed by David Lynch',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2003 film Ninne Ishtapaddanu against 2007 Telugu film Bangaru Konda', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Bangaru Konda', releaseYear: 2007 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Ninne_Istapaddanu.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Ninne Ishtapaddanu (2003 film)',
          candidateYear: 2003,
          snippet: '2003 Telugu-language romantic drama film directed by Konda',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil language poster against Telugu film entry Pistha', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Pistha', releaseYear: 2009 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e3/Thoranai_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Thoranai (Tamil poster)',
          candidateYear: 2009,
          snippet: 'Tamil theatrical release poster featuring Tamil title typography Thoranai',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil language poster against Telugu film entry Ninna Nedu Repu', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Ninna Nedu Repu', releaseYear: 2008 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/19/Netru_Indru_Naalai_2008_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Netru Indru Naalai (Tamil poster)',
          candidateYear: 2008,
          snippet: 'Tamil theatrical release poster featuring Tamil title typography Netru Indru Naalai',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects actor portrait against theatrical film entry for Karalu Miriyalu', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Karalu Miriyalu', releaseYear: 2011 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Madhu_Shalini_in_Cinivaram.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Madhu Shalini',
          candidateYear: 2011,
          snippet: 'Indian actress who works predominantly in Telugu and Tamil films',
          sourceDomain: 'wikimedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 11 Scope & Accounting Integrity', () => {
    it('documents exactly 108 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_11_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(108);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_11_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
