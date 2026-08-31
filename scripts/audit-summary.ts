import { prisma } from '../src/infrastructure/db/client';

async function auditSummary() {
  const allMovies = await prisma.movie.findMany({ include: { eligibility: true } });
  const allCandidates = await prisma.ingestionCandidate.findMany();

  console.log('=== CANONICAL MOVIES ===');
  console.log(`Total Movies: ${allMovies.length}`);
  console.log(`Active: ${allMovies.filter(m => m.lifecycleStatus === 'ACTIVE').length}`);
  console.log(`Playable Guess: ${allMovies.filter(m => m.eligibility?.playableAsGuess).length}`);
  console.log(`Playable Target: ${allMovies.filter(m => m.eligibility?.playableAsTarget).length}`);
  console.log(`Playable Both: ${allMovies.filter(m => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget).length}`);
  console.log(`Review Pending: ${allMovies.filter(m => m.eligibility?.reviewStatus === 'PENDING').length}`);
  console.log(`Review Approved: ${allMovies.filter(m => m.eligibility?.reviewStatus === 'APPROVED').length}`);

  console.log('\n=== CANDIDATES ACCOUNTING ===');
  const tmdb = allCandidates.filter(c => c.source.toUpperCase() === 'TMDB');
  const wikidata = allCandidates.filter(c => c.source.toUpperCase() === 'WIKIDATA');

  console.log(`TMDB Total Candidates: ${tmdb.length}`);
  console.log(`  - Validated: ${tmdb.filter(c => c.status === 'VALIDATED').length}`);
  console.log(`  - Duplicate: ${tmdb.filter(c => c.status === 'DUPLICATE').length}`);
  console.log(`  - Processing/Review: ${tmdb.filter(c => c.status === 'PROCESSING').length}`);
  console.log(`  - Rejected: ${tmdb.filter(c => c.status === 'REJECTED').length}`);

  console.log(`\nWikidata Total Candidates: ${wikidata.length}`);
  console.log(`  - Validated (New Movies Created): ${wikidata.filter(c => c.status === 'VALIDATED').length}`);
  console.log(`  - Duplicate (Merged with existing): ${wikidata.filter(c => c.status === 'DUPLICATE').length}`);
  console.log(`  - Processing/Review: ${wikidata.filter(c => c.status === 'PROCESSING').length}`);
  console.log(`  - Rejected: ${wikidata.filter(c => c.status === 'REJECTED').length}`);

  console.log('\n--- The 4 Validated Wikidata Candidates (New Movies) ---');
  for (const c of wikidata.filter(c => c.status === 'VALIDATED')) {
    console.log(`  QID: ${c.sourceMovieId} (Reason: ${c.resolutionReason})`);
  }

  console.log('\n--- The 11 Duplicate Wikidata Candidates (Merged) ---');
  for (const c of wikidata.filter(c => c.status === 'DUPLICATE')) {
    console.log(`  QID: ${c.sourceMovieId} -> dupOfMovieId: ${c.duplicateOfMovieId}`);
  }

  console.log('\n=== LANGUAGE BREAKDOWN (90 Movies) ===');
  let telugu = 0, hindi = 0, multi = 0, other = 0, unknown = 0;
  for (const m of allMovies) {
    const isTe = m.supportedLanguages.includes('TELUGU');
    const isHi = m.supportedLanguages.includes('HINDI');
    if (isTe && isHi) multi++;
    else if (isTe) telugu++;
    else if (isHi) hindi++;
    else if (m.supportedLanguages.length > 0) other++;
    else unknown++;
  }
  console.log(`Telugu Only:  ${telugu}`);
  console.log(`Hindi Only:   ${hindi}`);
  console.log(`Multilingual: ${multi}`);
  console.log(`Other:        ${other}`);
  console.log(`Unknown:      ${unknown}`);
  console.log(`Sum:          ${telugu + hindi + multi + other + unknown}`);

  await prisma.$disconnect();
}

auditSummary().catch(console.error);
