import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { personEnrichmentService } from '@/modules/enrichment/person-enrichment-service';
import { resolvePosterUrl } from '@/lib/poster-utils';

export async function GET() {
  try {
    const activeMovies = await prisma.movie.findMany({
      where: { lifecycleStatus: 'ACTIVE' },
      select: { id: true, posterAsset: true, tmdbId: true },
    });

    let withPoster = 0;
    let withoutPoster = 0;
    let candidates = 0;

    for (const m of activeMovies) {
      if (m.posterAsset && resolvePosterUrl(m.posterAsset)) {
        withPoster++;
      } else {
        withoutPoster++;
        if (m.tmdbId) candidates++;
      }
    }

    const personStats = await personEnrichmentService.auditPersons();

    return NextResponse.json({
      posters: {
        totalActiveMovies: activeMovies.length,
        withPoster,
        withoutPoster,
        coveragePct: Number(((withPoster / Math.max(1, activeMovies.length)) * 100).toFixed(1)),
        enrichmentCandidates: candidates,
      },
      persons: {
        totalPersons: personStats.totalPersons,
        personsInActiveMovies: personStats.personsInActiveMovies,
        personsInTargetPlayable: personStats.personsInTargetPlayable,
        withImage: personStats.withImage,
        withoutImage: personStats.withoutImage,
        coveragePct: Number(((personStats.withImage / Math.max(1, personStats.totalPersons)) * 100).toFixed(1)),
        leadCastCount: personStats.leadCastCount,
        leadCastWithImage: personStats.leadCastWithImage,
        directorsCount: personStats.directorsCount,
        directorsWithImage: personStats.directorsWithImage,
        enrichmentCandidates: personStats.enrichmentCandidates,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch media stats' },
      { status: 500 }
    );
  }
}
