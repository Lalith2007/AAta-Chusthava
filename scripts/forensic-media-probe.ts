import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';
import { mediaIdentityValidator } from '../src/modules/enrichment/media-identity-validator';
import { posterDiscoveryProvider } from '../src/modules/enrichment/poster-discovery-provider';

async function main() {
  console.log('============================================================');
  console.log('PHASE 1 FORENSIC INVESTIGATION: MEDIA ACQUISITION AUDIT');
  console.log('============================================================\n');

  // Check 1: Is Google Provider actually making requests?
  console.log('--- 1. GOOGLE PROVIDER IMPLEMENTATION AUDIT ---');
  console.log('Reviewing PosterDiscoveryProvider.discoverPoster implementation:');
  console.log('Step 3 in PosterDiscoveryProvider currently does:');
  console.log('  return { status: "MANUAL_REVIEW_REQUIRED", posterUrl: null, source: "NONE", googleSearchUrl }');
  console.log('Finding: The provider was only generating the Google search URL and routing to MANUAL_REVIEW_REQUIRED.\n');

  // Check 2: Direct Google Web Search request test (does Google block or return CAPTCHA?)
  console.log('--- 2. DIRECT HTTP GOOGLE SCRAPING TEST ---');
  const testQuery = encodeURIComponent('"Baahubali" "2015" movie poster');
  const googleUrl = `https://www.google.com/search?q=${testQuery}`;
  try {
    const res = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    console.log(`Google HTTP Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    const isCaptcha = text.includes('detected unusual traffic') || text.includes('recaptcha') || text.includes('sorry/index');
    console.log(`Google Blocked/CAPTCHA detected: ${isCaptcha ? 'YES (HTTP 429/CAPTCHA block)' : 'NO (HTML received)'}`);
    console.log(`Response length: ${text.length} bytes`);
  } catch (err: any) {
    console.log(`Google fetch error: ${err?.message}`);
  }
  console.log('');

  // Check 3: 10 Representative Candidates Across Catalog
  console.log('--- 3. TESTING 10 REPRESENTATIVE MISSING POSTER MOVIES ---');

  // Pick candidates:
  // 1. Telugu new
  // 2. Telugu old
  // 3. Hindi new
  // 4. Hindi old
  // 5. Ambiguous title
  // 6. With TMDB ID missing poster
  // 7. Target-playable Telugu missing poster
  // 8. Target-playable Hindi missing poster
  // 9. Classic Telugu
  // 10. Kalki 2898 AD (regression check)
  const candidateQueries = [
    { label: 'Kalki 2898 AD (2024)', where: { primaryTitle: 'Kalki 2898 AD', releaseYear: 2024 } },
    { label: 'With TMDB ID missing poster', where: { tmdbId: { not: null }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Telugu New Target (2023-2025)', where: { supportedLanguages: { has: 'TELUGU' }, releaseYear: { gte: 2023 }, eligibility: { playableAsTarget: true }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Telugu Old (1970-1990)', where: { supportedLanguages: { has: 'TELUGU' }, releaseYear: { gte: 1970, lte: 1990 }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Hindi New Target (2020-2025)', where: { supportedLanguages: { has: 'HINDI' }, releaseYear: { gte: 2020 }, eligibility: { playableAsTarget: true }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Hindi Old (1970-1990)', where: { supportedLanguages: { has: 'HINDI' }, releaseYear: { gte: 1970, lte: 1990 }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Ambiguous short title', where: { primaryTitle: { in: ['Hero', 'Champion', 'Anand', 'Shiva', 'Dharma'] }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Telugu 2000s Target', where: { supportedLanguages: { has: 'TELUGU' }, releaseYear: { gte: 2000, lte: 2010 }, eligibility: { playableAsTarget: true }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Hindi 2000s Target', where: { supportedLanguages: { has: 'HINDI' }, releaseYear: { gte: 2000, lte: 2010 }, eligibility: { playableAsTarget: true }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
    { label: 'Vintage Classic (Pre-1970)', where: { releaseYear: { lte: 1970 }, OR: [{ posterAsset: null }, { posterAsset: '' }] } },
  ];

  let sampleCount = 0;
  for (const q of candidateQueries) {
    const movie = await prisma.movie.findFirst({
      where: q.where as any,
      select: { id: true, primaryTitle: true, releaseYear: true, tmdbId: true, supportedLanguages: true, posterAsset: true },
    });

    if (!movie) {
      console.log(`[${q.label}] No movie found matching criteria`);
      continue;
    }

    sampleCount++;
    console.log(`\nSample ${sampleCount}: [${q.label}]`);
    console.log(`  Movie: "${movie.primaryTitle}" (${movie.releaseYear}) | ID: ${movie.id} | TMDB ID: ${movie.tmdbId ?? 'NONE'}`);
    console.log(`  Languages: ${movie.supportedLanguages.join(', ')} | Current Poster: ${movie.posterAsset ?? 'null'}`);

    // Try TMDB search by Title + Year
    let tmdbSearchResult: any = null;
    try {
      const search = await tmdbAdapter.searchMovies(movie.primaryTitle, { year: movie.releaseYear });
      tmdbSearchResult = search.results;
      console.log(`  TMDB searchMovies results count: ${search.results?.length ?? 0}`);
      if (search.results && search.results.length > 0) {
        const top = search.results[0];
        console.log(`  Top TMDB Match: "${top.title}" (${top.release_date}) | ID: ${top.id} | poster_path: ${top.poster_path ?? 'null'}`);

        if (top.poster_path) {
          const validation = mediaIdentityValidator.scorePosterCandidate(
            { title: movie.primaryTitle, releaseYear: movie.releaseYear, tmdbId: top.id },
            {
              imageUrl: top.poster_path,
              source: 'TMDB',
              candidateTitle: top.title,
              candidateYear: top.release_date ? parseInt(top.release_date.split('-')[0], 10) : undefined,
              tmdbId: top.id,
              sourceDomain: 'themoviedb.org',
            }
          );
          console.log(`  Identity Score: ${validation.score} | Confidence: ${validation.confidence} | Acceptable: ${validation.isAcceptableForAutoEnrich}`);
        }
      }
    } catch (err: any) {
      console.log(`  TMDB search error: ${err?.message}`);
    }

    // Check PosterDiscoveryProvider result
    const discovery = await posterDiscoveryProvider.discoverPoster({
      id: movie.id,
      title: movie.primaryTitle,
      releaseYear: movie.releaseYear,
      tmdbId: movie.tmdbId,
    });
    console.log(`  Discovery Result: status=${discovery.status}, source=${discovery.source}, posterUrl=${discovery.posterUrl ?? 'null'}`);
  }

  console.log('\n============================================================');
  console.log('END FORENSIC INVESTIGATION');
  console.log('============================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
