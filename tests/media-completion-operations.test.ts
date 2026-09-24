import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { posterReviewService, PosterRejectionReason } from '../src/modules/enrichment/poster-review-service';
import { prisma } from '../src/infrastructure/db/client';

describe('Sprint 30B: Media Completion Operations & Workstation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Exact Google Query Generation & Disambiguation', () => {
    it('generates exact quoted title and year for standard movie search', () => {
      const url = mediaIdentityValidator.buildMovieGoogleSearchUrl('Kalki 2898 AD', 2024);
      expect(url).toContain('https://www.google.com/search?q=');
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('"Kalki 2898 AD" "2024" movie poster');
    });

    it('generates disambiguated query with language and director when provided', () => {
      const url = mediaIdentityValidator.buildMovieGoogleSearchUrl('Leader', 2010, {
        language: 'TELUGU',
        director: 'Sekhar Kammula',
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('"Leader" "2010" Telugu movie poster director "Sekhar Kammula"');
    });

    it('generates disambiguated query with lead actor when director is missing', () => {
      const url = mediaIdentityValidator.buildMovieGoogleSearchUrl('Arya', 2004, {
        language: 'Telugu',
        lead: 'Allu Arjun',
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('"Arya" "2004" Telugu movie poster "Allu Arjun"');
    });

    it('generates exact person query with associated movie title, year and role', () => {
      const url = mediaIdentityValidator.buildPersonGoogleSearchUrl('Prabhas', {
        associatedMovie: 'Kalki 2898 AD',
        movieYear: 2024,
        role: 'LEAD',
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('"Prabhas" "Kalki 2898 AD" "2024" actor profile photo');
    });

    it('generates exact person query with director role', () => {
      const url = mediaIdentityValidator.buildPersonGoogleSearchUrl('Nag Ashwin', {
        associatedMovie: 'Kalki 2898 AD',
        movieYear: 2024,
        role: 'DIRECTOR',
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('"Nag Ashwin" "Kalki 2898 AD" "2024" director profile photo');
    });
  });

  describe('2. Poster Review Workstation Safety & Anti-Collision Guards', () => {
    it('strictly prevents approving Dune/Arrakis images for Kalki 2898 AD', async () => {
      vi.spyOn(prisma.movie, 'findUnique').mockResolvedValueOnce({
        id: 'kalki-movie-id',
        primaryTitle: 'Kalki 2898 AD',
        releaseYear: 2024,
        posterAsset: null,
      } as any);

      await expect(
        posterReviewService.approvePosterCandidate(
          'kalki-movie-id',
          'https://m.media-amazon.com/images/dune_part_two_poster.jpg',
          'ADMIN_USER'
        )
      ).rejects.toThrow('Anti-collision: Dune/Arrakis image cannot be approved for Kalki 2898 AD');
    });

    it('rejects placeholder or invalid image URLs during manual approval', async () => {
      await expect(
        posterReviewService.approvePosterCandidate(
          'some-movie-id',
          'https://example.com/no_image_placeholder.jpg',
          'ADMIN_USER'
        )
      ).rejects.toThrow('Invalid poster candidate URL');
    });

    it('approves legitimate poster URL and assigns ADMIN_MANUAL_VERIFIED provenance and audit log', async () => {
      vi.spyOn(prisma.movie, 'findUnique').mockResolvedValueOnce({
        id: 'valid-movie-id',
        primaryTitle: 'Baahubali: The Beginning',
        releaseYear: 2015,
        posterAsset: null,
      } as any);

      const updateSpy = vi.spyOn(prisma.movie, 'update').mockResolvedValueOnce({} as any);
      const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({} as any);

      const result = await posterReviewService.approvePosterCandidate(
        'valid-movie-id',
        'https://image.tmdb.org/t/p/w500/baahubali_verified.jpg',
        'ADMIN_TESTER'
      );

      expect(result.success).toBe(true);
      expect(result.normalizedUrl).toBe('https://image.tmdb.org/t/p/w500/baahubali_verified.jpg');
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'valid-movie-id' },
        data: { posterAsset: 'https://image.tmdb.org/t/p/w500/baahubali_verified.jpg' },
      });
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'POSTER_ASSIGNED',
            actorId: 'ADMIN_TESTER',
            entityId: 'valid-movie-id',
            after: expect.objectContaining({
              verificationMethod: 'ADMIN_MANUAL_VERIFIED',
              source: 'ADMIN_MANUAL_VERIFIED',
            }),
          }),
        })
      );
    });

    it('records explicit rejection reasons in AuditLog when poster candidate is rejected', async () => {
      vi.spyOn(prisma.movie, 'findUnique').mockResolvedValue({
        id: 'rejected-movie-id',
        posterAsset: null,
      } as any);

      const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const reasons: PosterRejectionReason[] = [
        'WRONG_MOVIE',
        'WRONG_YEAR',
        'WRONG_PERSON',
        'PLACEHOLDER',
        'BROKEN_IMAGE',
        'AMBIGUOUS_IDENTITY',
        'UNRELATED_IMAGE',
        'OTHER',
      ];

      for (const reason of reasons) {
        await posterReviewService.rejectPosterCandidate('rejected-movie-id', 'ADMIN_USER', reason);
        expect(auditSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'POSTER_REJECTED',
              entityId: 'rejected-movie-id',
              reason,
            }),
          })
        );
      }
    });
  });

  describe('3. Queue Ordering & Filter Invariants', () => {
    it('queries target-playable movies first and preserves mathematical pagination', async () => {
      const countSpy = vi.spyOn(prisma.movie, 'count').mockResolvedValue(1188);
      const findManySpy = vi.spyOn(prisma.movie, 'findMany').mockResolvedValue([
        {
          id: 'm1',
          primaryTitle: 'Target Film',
          releaseYear: 2024,
          tmdbId: 12345,
          imdbId: null,
          supportedLanguages: ['TELUGU'],
          posterAsset: null,
          eligibility: { playableAsTarget: true },
          people: [],
        } as any,
      ]);

      const queue = await posterReviewService.getPosterReviewQueue({
        page: 1,
        pageSize: 50,
        targetOnly: true,
        sortBy: 'targetFirst',
      });

      expect(queue.page).toBe(1);
      expect(queue.pageSize).toBe(50);
      expect(queue.total).toBe(1188);
      expect(queue.items).toHaveLength(1);
      expect(queue.items[0].currentStatus).toBe('MANUAL_REVIEW_REQUIRED');
      expect(queue.items[0].isTargetPlayable).toBe(true);
      expect(findManySpy).toHaveBeenCalled();
    });
  });
});
