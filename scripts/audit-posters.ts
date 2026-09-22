import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { resolvePosterUrl } from '../src/lib/poster-utils';

const prisma = new PrismaClient();

interface PosterAuditResult {
  totalActiveMovies: number;
  moviesWithPosterAsset: number;
  moviesWithoutPosterAsset: number;
  moviesWithAbsoluteUrls: number;
  moviesWithTmdbRelativePaths: number;
  invalidMalformedUrls: number;
  enrichmentCandidates: number;
  records: {
    id: string;
    title: string;
    releaseYear: number;
    tmdbId?: number | null;
    rawPosterAsset?: string | null;
    resolvedUrl?: string | null;
    category: 'REAL_POSTER' | 'MISSING_POSTER' | 'INVALID_POSTER';
    isEnrichmentCandidate: boolean;
  }[];
}

export async function auditPosters(): Promise<PosterAuditResult> {
  const activeMovies = await prisma.movie.findMany({
    where: { lifecycleStatus: 'ACTIVE' },
    orderBy: { releaseYear: 'desc' },
  });

  let withPoster = 0;
  let withoutPoster = 0;
  let absoluteUrls = 0;
  let tmdbPaths = 0;
  let invalidUrls = 0;
  let enrichmentCandidates = 0;

  const records: PosterAuditResult['records'] = [];

  for (const m of activeMovies) {
    const raw = m.posterAsset?.trim() || null;
    const resolved = resolvePosterUrl(raw);

    let category: 'REAL_POSTER' | 'MISSING_POSTER' | 'INVALID_POSTER';
    let isEnrichmentCandidate = false;

    if (!raw) {
      category = 'MISSING_POSTER';
      withoutPoster++;
      if (m.tmdbId) {
        isEnrichmentCandidate = true;
        enrichmentCandidates++;
      }
    } else if (resolved) {
      category = 'REAL_POSTER';
      withPoster++;
      if (/^https?:\/\//i.test(raw)) {
        absoluteUrls++;
      } else {
        tmdbPaths++;
      }
    } else {
      category = 'INVALID_POSTER';
      invalidUrls++;
      if (m.tmdbId) {
        isEnrichmentCandidate = true;
        enrichmentCandidates++;
      }
    }

    records.push({
      id: m.id,
      title: m.primaryTitle,
      releaseYear: m.releaseYear,
      tmdbId: m.tmdbId,
      rawPosterAsset: raw,
      resolvedUrl: resolved,
      category,
      isEnrichmentCandidate,
    });
  }

  return {
    totalActiveMovies: activeMovies.length,
    moviesWithPosterAsset: withPoster,
    moviesWithoutPosterAsset: withoutPoster,
    moviesWithAbsoluteUrls: absoluteUrls,
    moviesWithTmdbRelativePaths: tmdbPaths,
    invalidMalformedUrls: invalidUrls,
    enrichmentCandidates,
    records,
  };
}

async function main() {
  console.log('Running Poster Asset Audit...');
  const result = await auditPosters();

  console.log('\n============================================================');
  console.log('POSTER ASSET AUDIT REPORT');
  console.log('============================================================');
  console.log(`Total Active Movies:             ${result.totalActiveMovies}`);
  console.log(`Movies With Valid Poster Asset:  ${result.moviesWithPosterAsset}`);
  console.log(`- Absolute HTTP/HTTPS URLs:      ${result.moviesWithAbsoluteUrls}`);
  console.log(`- TMDB Relative Paths:           ${result.moviesWithTmdbRelativePaths}`);
  console.log(`Movies Without Poster Asset:     ${result.moviesWithoutPosterAsset}`);
  console.log(`Invalid / Malformed Poster URLs: ${result.invalidMalformedUrls}`);
  console.log(`Enrichment Candidates (tmdbId+): ${result.enrichmentCandidates}`);
  console.log('============================================================\n');

  console.log('--- SAMPLE RECORDS ---');
  for (const r of result.records.slice(0, 15)) {
    console.log(
      `[${r.category}] ${r.title} (${r.releaseYear}) -> raw: "${r.rawPosterAsset ?? 'null'}" | resolved: "${r.resolvedUrl ?? 'NONE'}"`
    );
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
