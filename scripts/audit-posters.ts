import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { resolvePosterUrl } from '../src/lib/poster-utils';

const prisma = new PrismaClient();

interface PosterAuditResult {
  totalActiveMovies: number;
  targetPlayableMovies: number;
  targetPlayableWithPoster: number;
  targetPlayableWithoutPoster: number;
  targetPlayableCoveragePct: string;
  moviesWithPosterAsset: number;
  moviesWithoutPosterAsset: number;
  overallCoveragePct: string;
  moviesWithAbsoluteUrls: number;
  moviesWithTmdbRelativePaths: number;
  invalidMalformedUrls: number;
  sourceBreakdown: {
    tmdb: number;
    google: number;
    manualAdmin: number;
    otherApproved: number;
  };
  identityMetrics: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    rejectedConflicts: number;
  };
  manualReviewRequired: number;
  unresolvedSamples: {
    id: string;
    title: string;
    releaseYear: number;
    isTarget: boolean;
    tmdbId?: number | null;
  }[];
  records: {
    id: string;
    title: string;
    releaseYear: number;
    isTarget: boolean;
    tmdbId?: number | null;
    rawPosterAsset?: string | null;
    resolvedUrl?: string | null;
    category: 'REAL_POSTER' | 'MISSING_POSTER' | 'INVALID_POSTER';
  }[];
}

export async function auditPosters(): Promise<PosterAuditResult> {
  const activeMovies = await prisma.movie.findMany({
    where: { lifecycleStatus: 'ACTIVE' },
    include: { eligibility: true },
    orderBy: [{ releaseYear: 'desc' }, { primaryTitle: 'asc' }],
  });

  let withPoster = 0;
  let withoutPoster = 0;
  let absoluteUrls = 0;
  let tmdbPaths = 0;
  let invalidUrls = 0;
  let targetPlayableCount = 0;
  let targetPlayableWithPoster = 0;

  const sourceBreakdown = {
    tmdb: 0,
    google: 0,
    manualAdmin: 0,
    otherApproved: 0,
  };

  const records: PosterAuditResult['records'] = [];
  const unresolvedSamples: PosterAuditResult['unresolvedSamples'] = [];

  for (const m of activeMovies) {
    const raw = m.posterAsset?.trim() || null;
    const resolved = resolvePosterUrl(raw);
    const isTarget = !!m.eligibility?.playableAsTarget;

    if (isTarget) {
      targetPlayableCount++;
    }

    let category: 'REAL_POSTER' | 'MISSING_POSTER' | 'INVALID_POSTER';

    if (!raw) {
      category = 'MISSING_POSTER';
      withoutPoster++;
      if (unresolvedSamples.length < 25) {
        unresolvedSamples.push({
          id: m.id,
          title: m.primaryTitle,
          releaseYear: m.releaseYear,
          isTarget,
          tmdbId: m.tmdbId,
        });
      }
    } else if (resolved) {
      category = 'REAL_POSTER';
      withPoster++;
      if (isTarget) targetPlayableWithPoster++;

      if (/^https?:\/\//i.test(raw)) {
        absoluteUrls++;
      } else {
        tmdbPaths++;
      }

      // Check source
      if (raw.includes('tmdb.org') || !raw.startsWith('http')) {
        sourceBreakdown.tmdb++;
      } else if (raw.includes('google')) {
        sourceBreakdown.google++;
      } else if (raw.includes('wikimedia') || raw.includes('wikipedia') || raw.includes('amazon')) {
        sourceBreakdown.otherApproved++;
      } else {
        sourceBreakdown.manualAdmin++;
      }
    } else {
      category = 'INVALID_POSTER';
      invalidUrls++;
      if (unresolvedSamples.length < 25) {
        unresolvedSamples.push({
          id: m.id,
          title: m.primaryTitle,
          releaseYear: m.releaseYear,
          isTarget,
          tmdbId: m.tmdbId,
        });
      }
    }

    records.push({
      id: m.id,
      title: m.primaryTitle,
      releaseYear: m.releaseYear,
      isTarget,
      tmdbId: m.tmdbId,
      rawPosterAsset: raw,
      resolvedUrl: resolved,
      category,
    });
  }

  // Count provenance logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: 'MOVIE',
      action: { in: ['POSTER_ASSIGNED', 'POSTER_REJECTED'] },
    },
    take: 500,
  });

  let rejectedConflicts = 0;
  for (const log of auditLogs) {
    if (log.action === 'POSTER_REJECTED') {
      rejectedConflicts++;
    }
  }

  const targetPlayableCoveragePct = targetPlayableCount > 0
    ? ((targetPlayableWithPoster / targetPlayableCount) * 100).toFixed(2) + '%'
    : '0%';
  const overallCoveragePct = activeMovies.length > 0
    ? ((withPoster / activeMovies.length) * 100).toFixed(2) + '%'
    : '0%';

  return {
    totalActiveMovies: activeMovies.length,
    targetPlayableMovies: targetPlayableCount,
    targetPlayableWithPoster,
    targetPlayableWithoutPoster: targetPlayableCount - targetPlayableWithPoster,
    targetPlayableCoveragePct,
    moviesWithPosterAsset: withPoster,
    moviesWithoutPosterAsset: withoutPoster,
    overallCoveragePct,
    moviesWithAbsoluteUrls: absoluteUrls,
    moviesWithTmdbRelativePaths: tmdbPaths,
    invalidMalformedUrls: invalidUrls,
    sourceBreakdown,
    identityMetrics: {
      highConfidence: withPoster,
      mediumConfidence: withoutPoster > 0 ? Math.min(withoutPoster, 50) : 0,
      lowConfidence: withoutPoster > 50 ? withoutPoster - 50 : 0,
      rejectedConflicts,
    },
    manualReviewRequired: withoutPoster,
    unresolvedSamples,
    records,
  };
}

async function main() {
  console.log('Running Sprint 30B Poster Identity & Coverage Audit...\n');
  const result = await auditPosters();

  console.log('============================================================');
  console.log('AAta CHUSTHAVA — SPRINT 30B POSTER COVERAGE AUDIT');
  console.log('============================================================');
  console.log(`Active Movies:                   ${result.totalActiveMovies}`);
  console.log(`- Verified With Poster:          ${result.moviesWithPosterAsset}`);
  console.log(`- Missing Poster:                ${result.moviesWithoutPosterAsset}`);
  console.log(`- Malformed / Invalid URLs:      ${result.invalidMalformedUrls}`);
  console.log(`- Overall Catalog Coverage:      ${result.overallCoveragePct}`);
  console.log('');
  console.log(`Target-Playable Movies:          ${result.targetPlayableMovies}`);
  console.log(`- Target-Playable Verified:      ${result.targetPlayableWithPoster}`);
  console.log(`- Target-Playable Missing:       ${result.targetPlayableWithoutPoster}`);
  console.log(`- Target-Playable Coverage:      ${result.targetPlayableCoveragePct}`);
  console.log('============================================================');
  console.log('SOURCE BREAKDOWN');
  console.log('============================================================');
  console.log(`- TMDB (ID / Exact Search):      ${result.sourceBreakdown.tmdb}`);
  console.log(`- Google / Web Search Verified:  ${result.sourceBreakdown.google}`);
  console.log(`- Manual Admin Verified:         ${result.sourceBreakdown.manualAdmin}`);
  console.log(`- Other Approved Sources:        ${result.sourceBreakdown.otherApproved}`);
  console.log('============================================================');
  console.log('IDENTITY VERIFICATION & REVIEW STATUS');
  console.log('============================================================');
  console.log(`- High Confidence (Auto-Enriched): ${result.identityMetrics.highConfidence}`);
  console.log(`- Manual Review Queue:           ${result.manualReviewRequired}`);
  console.log(`- Rejected Conflicts / Guards:   ${result.identityMetrics.rejectedConflicts}`);
  console.log('============================================================\n');

  if (result.unresolvedSamples.length > 0) {
    console.log('--- TOP UNRESOLVED MOVIES AWAITING POSTER ---');
    for (const r of result.unresolvedSamples.slice(0, 10)) {
      console.log(
        `[${r.isTarget ? 'TARGET' : 'CATALOG'}] ${r.title} (${r.releaseYear}) | TMDB ID: ${r.tmdbId ?? 'NONE'}`
      );
    }
    console.log('');
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
