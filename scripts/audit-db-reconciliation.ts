import { prisma } from '../src/infrastructure/db/client';

async function audit() {
  console.log('=== DIRECT DATABASE AUDIT ===');
  
  const allMovies = await prisma.movie.findMany({
    include: {
      eligibility: true,
    },
    orderBy: {
      releaseYear: 'asc',
    },
  });
  
  console.log(`Total Movies in DB: ${allMovies.length}`);
  
  const allCandidates = await prisma.ingestionCandidate.findMany({
    orderBy: { discoveredAt: 'asc' },
  });
  
  console.log(`\nCandidates List:`);
  for (const c of allCandidates) {
    console.log(`  [${c.source}] ${c.sourceMovieId} - status=${c.status}, reason=${c.resolutionReason || 'NONE'}, dupOf=${c.duplicateOfMovieId || 'NONE'}`);
  }

  const wikidataCandidates = allCandidates.filter(c => c.source.toUpperCase() === 'WIKIDATA');
  const tmdbCandidates = allCandidates.filter(c => c.source.toUpperCase() === 'TMDB');

  console.log(`\nWikidata Candidates Total: ${wikidataCandidates.length}`);
  console.log(`  - Validated / New canonical: ${wikidataCandidates.filter(c => c.status === 'VALIDATED').length}`);
  console.log(`  - Duplicate of existing:    ${wikidataCandidates.filter(c => c.status === 'DUPLICATE').length}`);
  console.log(`  - Review required:          ${wikidataCandidates.filter(c => c.status === 'PROCESSING').length}`);
  console.log(`  - Rejected:                 ${wikidataCandidates.filter(c => c.status === 'REJECTED').length}`);

  console.log(`\nTMDB Candidates Total: ${tmdbCandidates.length}`);
  console.log(`  - Validated: ${tmdbCandidates.filter(c => c.status === 'VALIDATED').length}`);
  console.log(`  - Duplicate: ${tmdbCandidates.filter(c => c.status === 'DUPLICATE').length}`);
  console.log(`  - Review:    ${tmdbCandidates.filter(c => c.status === 'PROCESSING').length}`);
  console.log(`  - Rejected:  ${tmdbCandidates.filter(c => c.status === 'REJECTED').length}`);

  console.log('\n--- All Movies with details ---');
  for (const m of allMovies) {
    const langs = m.supportedLanguages.join(',');
    const tmdb = m.tmdbId ?? 'NONE';
    const wikidata = m.wikidataId ?? 'NONE';
    const guess = m.eligibility?.playableAsGuess ? 'Y' : 'N';
    const target = m.eligibility?.playableAsTarget ? 'Y' : 'N';
    const review = m.eligibility?.reviewStatus ?? 'NONE';
    console.log(`[${m.releaseYear}] "${m.primaryTitle}" (id=${m.id.slice(0, 8)}, slug=${m.slug}, lang=${langs}, tmdb=${tmdb}, wikidata=${wikidata}, guess=${guess}, target=${target}, review=${review})`);
  }

  // Check any movie with missing eligibility or non-target
  const nonTargetMovies = allMovies.filter(m => !m.eligibility?.playableAsTarget);
  console.log(`\nNon-target playable movies count: ${nonTargetMovies.length}`);
  for (const m of nonTargetMovies) {
    console.log(`Non-target: "${m.primaryTitle}" (${m.releaseYear}) - reviewStatus: ${m.eligibility?.reviewStatus}`);
  }

  // Check source breakdown of movies:
  const tmdbOnly = allMovies.filter(m => m.tmdbId !== null && m.wikidataId === null);
  const wikidataOnly = allMovies.filter(m => m.tmdbId === null && m.wikidataId !== null);
  const bothSources = allMovies.filter(m => m.tmdbId !== null && m.wikidataId !== null);
  const neitherSource = allMovies.filter(m => m.tmdbId === null && m.wikidataId === null);

  console.log(`\nMovie Source Breakdown:`);
  console.log(`TMDB only: ${tmdbOnly.length}`);
  console.log(`Wikidata only: ${wikidataOnly.length}`);
  console.log(`Both TMDB & Wikidata: ${bothSources.length}`);
  console.log(`Neither (Initial seed without external IDs): ${neitherSource.length}`);

  if (neitherSource.length > 0) {
    console.log('Movies with neither TMDB nor Wikidata ID:');
    for (const m of neitherSource) {
      console.log(`  - "${m.primaryTitle}" (${m.releaseYear})`);
    }
  }

  if (wikidataOnly.length > 0) {
    console.log('\nMovies with Wikidata only ID:');
    for (const m of wikidataOnly) {
      console.log(`  - "${m.primaryTitle}" (${m.releaseYear}, wikidataId=${m.wikidataId})`);
    }
  }

  await prisma.$disconnect();
}

audit().catch(console.error);
