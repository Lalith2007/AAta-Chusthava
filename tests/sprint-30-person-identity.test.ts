import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Sprint 30: Person Image & Identity Resolution Suite', () => {
  let service: PersonEnrichmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PersonEnrichmentService();
  });

  describe('1. Person Image Resolution & Idempotency', () => {
    it('returns ALREADY_HAD_IMAGE if person already has a valid image asset', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-prabhas',
        canonicalName: 'Prabhas',
        tmdbId: 32230,
        image: 'https://image.tmdb.org/t/p/w185/prabhas_real.jpg',
      } as any);

      const res = await service.enrichPersonImage('p-prabhas');
      expect(res.status).toBe('ALREADY_HAD_IMAGE');
      expect(res.newImage).toBe('https://image.tmdb.org/t/p/w185/prabhas_real.jpg');
      expect(prisma.person.update).not.toHaveBeenCalled();
    });

    it('returns SKIPPED if person has no TMDB ID', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-unknown',
        canonicalName: 'Unknown Artist',
        tmdbId: null,
        image: null,
      } as any);

      const res = await service.enrichPersonImage('p-unknown');
      expect(res.status).toBe('SKIPPED');
      expect(prisma.person.update).not.toHaveBeenCalled();
    });

    it('enriches person image safely when TMDB returns a valid profile path', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-anushka',
        canonicalName: 'Anushka Shetty',
        tmdbId: 110940,
        image: null,
      } as any);

      vi.mocked(tmdbAdapter.getPersonDetails!).mockResolvedValueOnce({
        id: 110940,
        name: 'Anushka Shetty',
        profile_path: '/anushka_profile.jpg',
      });

      const res = await service.enrichPersonImage('p-anushka', { dryRun: false });
      expect(res.status).toBe('ENRICHED');
      expect(res.newImage).toBe('https://image.tmdb.org/t/p/w185/anushka_profile.jpg');
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { id: 'p-anushka' },
        data: { image: 'https://image.tmdb.org/t/p/w185/anushka_profile.jpg' },
      });
    });

    it('respects dryRun option and makes zero database writes', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-rajamouli',
        canonicalName: 'S. S. Rajamouli',
        tmdbId: 75752,
        image: null,
      } as any);

      vi.mocked(tmdbAdapter.getPersonDetails!).mockResolvedValueOnce({
        id: 75752,
        name: 'S. S. Rajamouli',
        profile_path: '/rajamouli_profile.jpg',
      });

      const res = await service.enrichPersonImage('p-rajamouli', { dryRun: true });
      expect(res.status).toBe('ENRICHED');
      expect(res.newImage).toBe('https://image.tmdb.org/t/p/w185/rajamouli_profile.jpg');
      expect(prisma.person.update).not.toHaveBeenCalled();
    });

    it('returns NO_IMAGE_AVAILABLE when TMDB has no profile path for the person', async () => {
      vi.mocked(prisma.person.findUnique).mockResolvedValueOnce({
        id: 'p-no-pic',
        canonicalName: 'Newcomer Actor',
        tmdbId: 999999,
        image: null,
      } as any);

      vi.mocked(tmdbAdapter.getPersonDetails!).mockResolvedValueOnce({
        id: 999999,
        name: 'Newcomer Actor',
        profile_path: null,
      });

      const res = await service.enrichPersonImage('p-no-pic');
      expect(res.status).toBe('NO_IMAGE_AVAILABLE');
      expect(res.newImage).toBeNull();
      expect(prisma.person.update).not.toHaveBeenCalled();
    });
  });

  describe('2. Person Audit Integrity', () => {
    it('calculates audit metrics consistently without throwing', async () => {
      vi.mocked(prisma.person.count)
        .mockResolvedValueOnce(9616) // total
        .mockResolvedValueOnce(117)  // with image
        .mockResolvedValueOnce(437)  // with tmdbId
        .mockResolvedValueOnce(9600) // active
        .mockResolvedValueOnce(8200) // target playable
        .mockResolvedValueOnce(2500) // lead cast count
        .mockResolvedValueOnce(90)   // lead cast with image
        .mockResolvedValueOnce(1200) // directors count
        .mockResolvedValueOnce(45)   // directors with image
        .mockResolvedValueOnce(320); // enrichment candidates

      const stats = await service.auditPersons();
      expect(stats.totalPersons).toBe(9616);
      expect(stats.withImage).toBe(117);
      expect(stats.withoutImage).toBe(9616 - 117);
      expect(stats.leadCastCount).toBe(2500);
      expect(stats.directorsCount).toBe(1200);
    });
  });
});
