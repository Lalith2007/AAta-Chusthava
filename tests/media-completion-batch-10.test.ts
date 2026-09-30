import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { BATCH_10_APPROVALS } from '../scripts/apply-batch-10-approvals';

describe('Media Completion Batch 10: Target-Playable Poster Identity & Verification Suite', () => {
  describe('1. Batch 10 Approved Poster URL Integrity', () => {
    it('verifies all 84 approved poster URLs are strictly valid image URLs', () => {
      expect(BATCH_10_APPROVALS).toHaveLength(84);
      for (const item of BATCH_10_APPROVALS) {
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

  describe('2. Batch 10 Anti-Collision & Guard Invariants', () => {
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

    it('rejects 1989 Salman Khan classic Maine Pyar Kiya against 2014 Telugu Maine Pyar Kiya', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Maine Pyar Kiya', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/Maine_Pyar_Kiya_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Maine Pyar Kiya (1989 film)',
          candidateYear: 1989,
          snippet: '1989 Indian Hindi-language musical romantic drama film directed by Sooraj R. Barjatya starring Salman Khan',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1994 original classic Yamaleela against 2014 Telugu Yamaleela 2', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Yamaleela 2', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/Yamaleela.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Yamaleela (1994 film)',
          candidateYear: 1994,
          snippet: '1994 Indian Telugu-language fantasy comedy film directed by S. V. Krishna Reddy starring Ali',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2004 Saif Ali Khan Hindi Hum Tum against 2014 Telugu Hum Tum', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Hum Tum', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Hum_Tum_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Hum Tum (2004 film)',
          candidateYear: 2004,
          snippet: '2004 Indian Hindi-language romantic comedy film directed by Kunal Kohli starring Saif Ali Khan and Rani Mukerji',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2000 Hrithik Roshan classic Kaho Naa... Pyaar Hai against 2014 Hindi Kaho Na Kaho', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Kaho Na Kaho', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Kaho_Naa_Pyaar_Hai.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Kaho Naa... Pyaar Hai (2000 film)',
          candidateYear: 2000,
          snippet: '2000 Indian Hindi-language romantic action drama film directed by Rakesh Roshan starring Hrithik Roshan and Ameesha Patel',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1982 Mithun Chakraborty classic Disco Dancer against 2012 Telugu Disco', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Disco', releaseYear: 2012 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/25/Disco_Dancer_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Disco Dancer (1982 film)',
          candidateYear: 1982,
          snippet: '1982 Indian Hindi-language musical drama film written by Rahi Masoom Raza and directed by Babbar Subhash starring Mithun Chakraborty',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1991 Bapu/Rajendra Prasad classic Pelli Pustakam against 2013 Telugu Pelli Pustakam', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Pelli Pustakam', releaseYear: 2013 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7f/Pelli_Pustakam_1991_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Pelli Pustakam (1991 film)',
          candidateYear: 1991,
          snippet: '1991 Indian Telugu-language romantic comedy film directed by Bapu starring Rajendra Prasad and Divyavani',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 1988 Chiranjeevi classic Yamudiki Mogudu against 2012 Telugu Yamudiki Mogudu', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Yamudiki Mogudu', releaseYear: 2012 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/Yamudiki_Mogudu_1988_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Yamudiki Mogudu (1988 film)',
          candidateYear: 1988,
          snippet: '1988 Indian Telugu-language fantasy action comedy film directed by Ravi Raja Pinisetty starring Chiranjeevi and Vijayashanti',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2023 film Skanda against 2011 Telugu film Babloo', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Babloo', releaseYear: 2011 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Skanda_film_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Skanda (2023 film)',
          candidateYear: 2023,
          snippet: '2023 Indian Telugu-language action drama film directed by Boyapati Sreenu starring Ram Pothineni and Sreeleela',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects 2014 American film Unfriended against 2014 Telugu film Chatting', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Chatting', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Unfriended_poster.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Unfriended (2014 film)',
          candidateYear: 2014,
          snippet: '2014 American found footage supernatural horror film directed by Leo Gabriadze',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects lyricist portrait against theatrical film entry for Maa Abbai Engineering Student', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Maa Abbai Engineering Student', releaseYear: 2012 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Kasarla_Shyam_with_National_Film_Award_2023.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Kasarla Shyam',
          candidateYear: 2023,
          snippet: 'Lyricist in Telugu cinema who won National Film Award 2023',
          sourceDomain: 'wikimedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });

    it('rejects Tamil language poster against Telugu film entry Jaihind 2', () => {
      const result = mediaIdentityValidator.scorePosterCandidate(
        { title: 'Jaihind 2', releaseYear: 2014 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Jai_Hind_2.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Jai Hind 2 (Tamil poster)',
          candidateYear: 2014,
          snippet: 'Tamil theatrical release poster featuring Tamil title typography directed by Arjun Sarja',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('3. Batch 10 Scope & Accounting Integrity', () => {
    it('documents exactly 84 approvals with unique non-colliding movie IDs', () => {
      const ids = BATCH_10_APPROVALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(84);
    });

    it('ensures all approvals contain non-empty attribution and provenance notes', () => {
      for (const item of BATCH_10_APPROVALS) {
        expect(item.notes).toBeTruthy();
        expect(item.notes.length).toBeGreaterThan(10);
      }
    });
  });
});
