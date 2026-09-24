import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { personEnrichmentService } from '@/modules/enrichment/person-enrichment-service';
import { resolvePosterUrl } from '@/lib/poster-utils';

export async function GET() {
  try {
    const activeMovies = await prisma.movie.findMany({
      where: { lifecycleStatus: 'ACTIVE' },
      select: {
        id: true,
        posterAsset: true,
        tmdbId: true,
        eligibility: { select: { playableAsTarget: true } },
      },
    });

    let withPoster = 0;
    let withoutPoster = 0;
    let candidates = 0;

    let targetTotal = 0;
    let targetWithPoster = 0;
    let targetWithoutPoster = 0;

    for (const m of activeMovies) {
      const hasPoster = Boolean(m.posterAsset && resolvePosterUrl(m.posterAsset));
      const isTarget = Boolean(m.eligibility?.playableAsTarget);

      if (hasPoster) {
        withPoster++;
      } else {
        withoutPoster++;
        if (m.tmdbId) candidates++;
      }

      if (isTarget) {
        targetTotal++;
        if (hasPoster) {
          targetWithPoster++;
        } else {
          targetWithoutPoster++;
        }
      }
    }

    const personStats = await personEnrichmentService.auditPersons();

    const targetCoveragePct = Number(((targetWithPoster / Math.max(1, targetTotal)) * 100).toFixed(2));
    const activeCoveragePct = Number(((withPoster / Math.max(1, activeMovies.length)) * 100).toFixed(2));
    const playerVisibleCoveragePct = Number(
      ((personStats.playerVisibleWithImage / Math.max(1, personStats.playerVisibleTotal)) * 100).toFixed(2)
    );
    const leadCastCoveragePct = Number(
      ((personStats.leadCastWithImage / Math.max(1, personStats.leadCastCount)) * 100).toFixed(2)
    );
    const directorsCoveragePct = Number(
      ((personStats.directorsWithImage / Math.max(1, personStats.directorsCount)) * 100).toFixed(2)
    );
    const supportingCoveragePct = Number(
      ((personStats.supportingCastWithImage / Math.max(1, personStats.supportingCastCount)) * 100).toFixed(2)
    );

    return NextResponse.json({
      posters: {
        totalActiveMovies: activeMovies.length,
        withPoster,
        withoutPoster,
        manualReview: withoutPoster,
        coveragePct: activeCoveragePct,
        enrichmentCandidates: candidates,
        target: {
          total: targetTotal,
          withPoster: targetWithPoster,
          withoutPoster: targetWithoutPoster,
          coveragePct: targetCoveragePct,
        },
      },
      persons: {
        totalPersons: personStats.totalPersons,
        personsInActiveMovies: personStats.personsInActiveMovies,
        personsInTargetPlayable: personStats.personsInTargetPlayable,
        withImage: personStats.withImage,
        withoutImage: personStats.withoutImage,
        coveragePct: Number(((personStats.withImage / Math.max(1, personStats.totalPersons)) * 100).toFixed(2)),
        playerVisible: {
          total: personStats.playerVisibleTotal,
          withImage: personStats.playerVisibleWithImage,
          withoutImage: personStats.playerVisibleWithoutImage,
          coveragePct: playerVisibleCoveragePct,
        },
        leadCast: {
          total: personStats.leadCastCount,
          withImage: personStats.leadCastWithImage,
          withoutImage: personStats.leadCastCount - personStats.leadCastWithImage,
          coveragePct: leadCastCoveragePct,
        },
        directors: {
          total: personStats.directorsCount,
          withImage: personStats.directorsWithImage,
          withoutImage: personStats.directorsCount - personStats.directorsWithImage,
          coveragePct: directorsCoveragePct,
        },
        supporting: {
          total: personStats.supportingCastCount,
          withImage: personStats.supportingCastWithImage,
          withoutImage: personStats.supportingCastCount - personStats.supportingCastWithImage,
          coveragePct: supportingCoveragePct,
        },
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
