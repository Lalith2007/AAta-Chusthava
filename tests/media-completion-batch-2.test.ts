import { describe, it, expect } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';

describe('Media Completion Batch 2: Target-Playable Poster Identity & Verification Suite', () => {
  const batch2Approvals = [
    { title: 'Berlin', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/5/57/Berlin_Movie_Poster.jpeg' },
    { title: 'Love Sex Aur Dhokha 2', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/9/93/LSD_2_Poster.jpg' },
    { title: 'Vyuham', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/c/cf/Vyuham_film_poster.jpg' },
    { title: 'Mrs.', year: 2025, url: 'https://upload.wikimedia.org/wikipedia/en/c/cf/Mrs._film_poster.jpg' },
    { title: 'The Storyteller', year: 2025, url: 'https://upload.wikimedia.org/wikipedia/en/6/67/The_Storyteller_%282025_film%29.jpg' },
    { title: 'The Mehta Boys', year: 2025, url: 'https://upload.wikimedia.org/wikipedia/en/c/c8/The_Mehta_Boys.jpg' },
    { title: 'Saali Mohabbat', year: 2025, url: 'https://upload.wikimedia.org/wikipedia/en/0/04/Saali_Mohabbat_poster.jpg' },
    { title: 'Hisaab Barabar', year: 2025, url: 'https://upload.wikimedia.org/wikipedia/en/5/58/Hisaab_Barabar_film_poster.jpg' },
    { title: 'Aseq', year: 2023, url: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Aseq.jpg' },
    { title: 'Tipppsy', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/d/d8/Tipppsy_poster.jpg' },
    { title: 'Phooli', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/8/87/Phooli_film_poster.jpg' },
    { title: 'Keshava Chandra Ramavath', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/f/fe/Keshava_Chandra_Ramavath.jpg' },
    { title: 'Pranaya Godari', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Pranaya_Godari.jpg' },
    { title: 'Before Marriage', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Before_Marriage.jpg' },
    { title: 'Dirty Fellow', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Dirty_Fellow.jpg' },
    { title: 'Ram NRI', year: 2024, url: 'https://upload.wikimedia.org/wikipedia/en/5/53/Ram_NRI.jpg' },
  ];

  describe('1. Batch 2 Approved Poster URL Integrity', () => {
    it('verifies all 16 approved poster URLs are strictly valid image URLs', () => {
      expect(batch2Approvals).toHaveLength(16);
      for (const item of batch2Approvals) {
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

  describe('2. Batch 2 Collision & Rejection Guards', () => {
    it('maintains Kalki 2898 AD Dune rejection guard', () => {
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
        { title: 'Cheater', releaseYear: 2023 },
        {
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/cheater_2016.jpg',
          source: 'GOOGLE',
          candidateTitle: 'Cheater (2016 film)',
          candidateYear: 2016,
          snippet: 'Marathi horror comedy released in 2016',
          sourceDomain: 'wikipedia.org',
        }
      );
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });
});
