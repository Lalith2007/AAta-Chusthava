import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { PersonEnrichmentService } from '../src/modules/enrichment/person-enrichment-service';
import { prisma } from '../src/infrastructure/db/client';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';

vi.mock('../src/infrastructure/db/client', () => ({
  prisma: {
    person: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../src/infrastructure/external-sources/tmdb-adapter', () => ({
  tmdbAdapter: {
    getPersonDetails: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
}));

describe('Sprint 30B: Person Identity Verification & Profile Image Acquisition', () => {
  let service: PersonEnrichmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PersonEnrichmentService();
  });

  describe('1. Filmography Corroboration Engine', () => {
    it('accepts person candidate when name AND filmography are corroborated', () => {
      const result = mediaIdentityValidator.scorePersonCandidate(
        {
          canonicalName: 'Prabhas',
          tmdbId: 32230,
          knownMovies: [
            { title: 'Baahubali: The Beginning', year: 2015 },
            { title: 'Kalki 2898 AD', year: 2024 },
          ],
        },
        {
          imageUrl: 'https://image.tmdb.org/t/p/w185/prabhas.jpg',
          source: 'GOOGLE',
          candidateName: 'Prabhas',
          snippet: 'Indian actor who starred in Baahubali: The Beginning and Kalki 2898 AD',
        }
      );

      expect(result.confidence).toBe('HIGH');
      expect(result.isAcceptableForAutoEnrich).toBe(true);
    });

    it('rejects person candidate when name matches but filmography context is missing (prevents homonym collisions)', () => {
      const result = mediaIdentityValidator.scorePersonCandidate(
        {
          canonicalName: 'Nani',
          tmdbId: 123456,
          knownMovies: [
            { title: 'Jersey', year: 2019 },
            { title: 'Dasara', year: 2023 },
          ],
        },
        {
          imageUrl: 'https://example.com/other_nani.jpg',
          source: 'GOOGLE',
          candidateName: 'Nani',
          snippet: 'Portuguese footballer Luis Nani',
        }
      );

      expect(result.isAcceptableForAutoEnrich).toBe(false);
      expect(result.rejectionReason).toContain('lacks strict filmography corroboration');
    });

    it('rejects candidate if person name does not match context', () => {
      const result = mediaIdentityValidator.scorePersonCandidate(
        {
          canonicalName: 'Samantha Ruth Prabhu',
        },
        {
          imageUrl: 'https://example.com/unrelated.jpg',
          source: 'GOOGLE',
          candidateName: 'Kajal Aggarwal',
          snippet: 'Actress in South Indian cinema',
        }
      );

      expect(result.confidence).toBe('LOW');
      expect(result.isAcceptableForAutoEnrich).toBe(false);
      expect(result.rejectionReason).toContain('does not appear in candidate context');
    });

    it('rejects candidate with placeholder image URL', () => {
      const result = mediaIdentityValidator.scorePersonCandidate(
        {
          canonicalName: 'Chiranjeevi',
        },
        {
          imageUrl: 'https://example.com/default_avatar.jpg',
          source: 'GOOGLE',
          candidateName: 'Chiranjeevi',
        }
      );

      expect(result.confidence).toBe('REJECTED_CONFLICT');
      expect(result.isAcceptableForAutoEnrich).toBe(false);
    });
  });

  describe('2. Person Google Search Link Generation', () => {
    it('creates unambiguous Google search query for Indian cinema person', () => {
      const url = mediaIdentityValidator.buildPersonGoogleSearchUrl('Sukumar', 'director');
      expect(decodeURIComponent(url)).toBe('https://www.google.com/search?q="Sukumar" director Indian cinema');
    });
  });

  describe('3. Person Enrichment Service Idempotency & Safety', () => {
    it('does not overwrite existing verified profile image', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-1',
        canonicalName: 'Mahesh Babu',
        tmdbId: 62064,
        image: 'https://image.tmdb.org/t/p/w185/mahesh.jpg',
      } as any);

      const res = await service.enrichPersonImage('p-1');
      expect(res.status).toBe('ALREADY_HAD_IMAGE');
      expect(res.newImage).toBe('https://image.tmdb.org/t/p/w185/mahesh.jpg');
      expect(prisma.person.update).not.toHaveBeenCalled();
    });

    it('rejects TMDB profile if it points to a placeholder image', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-2',
        canonicalName: 'Actor With Placeholder',
        tmdbId: 99999,
        image: null,
      } as any);

      vi.mocked(tmdbAdapter.getPersonDetails!).mockResolvedValueOnce({
        id: 99999,
        name: 'Actor With Placeholder',
        profile_path: '/placeholder.png',
      });

      const res = await service.enrichPersonImage('p-2');
      expect(res.status).toBe('NO_IMAGE_AVAILABLE');
      expect(prisma.person.update).not.toHaveBeenCalled();
    });
  });
});
