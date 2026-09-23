import { prisma } from '@/infrastructure/db/client';

export interface PosterProvenanceData {
  source:
    | 'TMDB_ID_EXACT'
    | 'TMDB_TITLE_YEAR'
    | 'TMDB_ID_MATCH'
    | 'TMDB_TITLE_YEAR_MATCH'
    | 'GOOGLE_TITLE_YEAR_VERIFIED'
    | 'ADMIN_MANUAL_VERIFIED'
    | 'MANUAL_ADMIN'
    | 'MIGRATION';
  verificationMethod:
    | 'AUTOMATED_EXACT_MATCH'
    | 'DISCOVERY_PROVIDER_MATCH'
    | 'ADMIN_APPROVAL'
    | 'HISTORICAL_BASELINE';
  verifiedAt: string;
  adminId?: string;
  notes?: string;
}

/**
 * Logs poster provenance to AuditLog without requiring schema changes
 */
export async function recordPosterProvenance(
  movieId: string,
  previousPosterAsset: string | null,
  newPosterAsset: string,
  provenance: PosterProvenanceData
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: provenance.adminId || 'SYSTEM_ENRICHMENT',
        actorRole: provenance.adminId ? 'ADMIN' : 'SYSTEM',
        action: 'POSTER_ASSIGNED',
        entityType: 'Movie',
        entityId: movieId,
        before: {
          posterAsset: previousPosterAsset,
        },
        after: {
          posterAsset: newPosterAsset,
          source: provenance.source,
          verificationMethod: provenance.verificationMethod,
          verifiedAt: provenance.verifiedAt,
          notes: provenance.notes,
        },
        reason: `Poster assigned via ${provenance.source} (${provenance.verificationMethod})`,
      },
    });
  } catch (err) {
    // Provenance logging failure should not crash main transaction if DB allows
    console.warn(`Failed to record poster provenance for movie ${movieId}:`, err);
  }
}
