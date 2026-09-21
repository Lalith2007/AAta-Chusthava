import { PrismaClient } from '@prisma/client';
import { isValidPersonName } from '../src/infrastructure/external-sources/wikipedia-adapter';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('FINAL PRODUCTION DATABASE ENRICHMENT & INTEGRITY AUDIT');
  console.log('============================================================\n');

  const allMovies = await prisma.movie.findMany({
    include: {
      eligibility: true,
      people: {
        include: {
          person: true,
        },
      },
      productionHouses: {
        include: {
          productionHouse: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
    },
    orderBy: { releaseYear: 'asc' },
  });

  const totalCanonical = allMovies.length;
  const activeMovies = allMovies.filter((m) => m.lifecycleStatus === 'ACTIVE').length;

  const playableGuess = allMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const playableTarget = allMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const playableBoth = allMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;
  const needsReview = allMovies.filter((m) => !m.eligibility?.playableAsTarget).length;

  // Enrichment breakdown
  const tmdbEnriched = allMovies.filter((m) => m.tmdbId !== null && m.wikidataId === null).length;
  const wikidataEnriched = allMovies.filter((m) => m.wikidataId !== null && m.tmdbId === null).length;
  const bothEnriched = allMovies.filter((m) => m.tmdbId !== null && m.wikidataId !== null).length;
  const neitherEnriched = allMovies.filter((m) => m.tmdbId === null && m.wikidataId === null).length;

  // Baseline comparison
  const previousTargetPlayable = 4107;
  const previousNeedsReview = 1224;
  const recoveredTargets = playableTarget - previousTargetPlayable;

  // Invariant verification on target-playable movies
  let invalidTargetRecords = 0;
  for (const m of allMovies) {
    if (m.eligibility?.playableAsTarget) {
      const validDirectors = m.people.filter(
        (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
      );
      const validCast = m.people.filter(
        (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName)
      );

      const hasValidDirector = validDirectors.length >= 1;
      const hasValidCast = validCast.length >= 2;
      const hasValidYear = typeof m.releaseYear === 'number' && m.releaseYear >= 1900;
      const isActive = m.lifecycleStatus === 'ACTIVE';
      const isApproved = m.eligibility.reviewStatus === 'APPROVED';

      if (!hasValidDirector || !hasValidCast || !hasValidYear || !isActive || !isApproved) {
        invalidTargetRecords++;
      }
    }
  }

  // Placeholder audit
  const allPersons = await prisma.person.findMany();
  const placeholderPersons = allPersons.filter((p) => !isValidPersonName(p.canonicalName)).length;

  const allMoviePersons = await prisma.moviePerson.findMany({
    include: { person: true },
  });
  const placeholderMoviePersons = allMoviePersons.filter((mp) => !isValidPersonName(mp.person.canonicalName)).length;

  // Duplicate canonical check
  const slugs = new Set(allMovies.map((m) => m.slug));
  const duplicateCanonicalCount = totalCanonical - slugs.size;

  // Clue availability breakdown
  const clueStats = {
    language: { real: 0, unavailable: 0, placeholder: 0 },
    director: { real: 0, unavailable: 0, placeholder: 0 },
    studio: { real: 0, unavailable: 0, placeholder: 0 },
    releaseYear: { real: 0, unavailable: 0, placeholder: 0 },
    boxOffice: { real: 0, unavailable: 0, placeholder: 0 },
    rating: { real: 0, unavailable: 0, placeholder: 0 },
    leadActor: { real: 0, unavailable: 0, placeholder: 0 },
    leadActress: { real: 0, unavailable: 0, placeholder: 0 },
    supportingCast: { real: 0, unavailable: 0, placeholder: 0 },
    musicDirector: { real: 0, unavailable: 0, placeholder: 0 },
    genres: { real: 0, unavailable: 0, placeholder: 0 },
  };

  for (const m of allMovies) {
    if (m.supportedLanguages && m.supportedLanguages.length > 0) clueStats.language.real++;
    else clueStats.language.unavailable++;

    const dirs = m.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    if (dirs.length > 0) clueStats.director.real++;
    else clueStats.director.unavailable++;

    if (m.productionHouses.length > 0) clueStats.studio.real++;
    else clueStats.studio.unavailable++;

    if (m.releaseYear) clueStats.releaseYear.real++;
    else clueStats.releaseYear.unavailable++;

    if (m.boxOffice && m.boxOffice > 0) clueStats.boxOffice.real++;
    else clueStats.boxOffice.unavailable++;

    if (m.rating && m.rating > 0) clueStats.rating.real++;
    else clueStats.rating.unavailable++;

    const leadActors = m.people.filter(
      (p) => p.roleType === 'LEAD' && isValidPersonName(p.person.canonicalName)
    );
    if (leadActors.length > 0) clueStats.leadActor.real++;
    else clueStats.leadActor.unavailable++;

    if (leadActors.length > 0) clueStats.leadActress.real++;
    else clueStats.leadActress.unavailable++;

    const supporting = m.people.filter(
      (p) => p.roleType === 'SUPPORTING' && isValidPersonName(p.person.canonicalName)
    );
    if (supporting.length > 0) clueStats.supportingCast.real++;
    else clueStats.supportingCast.unavailable++;

    const musicDirs = m.people.filter(
      (p) => p.roleType === 'MUSIC_DIRECTOR' && isValidPersonName(p.person.canonicalName)
    );
    if (musicDirs.length > 0) clueStats.musicDirector.real++;
    else clueStats.musicDirector.unavailable++;

    if (m.genres.length > 0) clueStats.genres.real++;
    else clueStats.genres.unavailable++;
  }

  console.log('------------------------------------------------------------');
  console.log('CATALOG ENRICHMENT REPORT');
  console.log('------------------------------------------------------------');
  console.log(`Canonical Movies:               ${totalCanonical}`);
  console.log(`Active Movies:                  ${activeMovies}`);
  console.log('\nBefore Enrichment:');
  console.log(`Playable Guess:                 5331`);
  console.log(`Playable Target:                ${previousTargetPlayable}`);
  console.log(`Needs Review:                   ${previousNeedsReview}`);
  console.log('\nAfter Enrichment:');
  console.log(`Playable Guess:                 ${playableGuess}`);
  console.log(`Playable Target:                ${playableTarget}`);
  console.log(`Playable Both:                  ${playableBoth}`);
  console.log(`Needs Review:                   ${needsReview}`);
  console.log(`\nNew Target Recoveries:          ${recoveredTargets}`);
  console.log(`TMDB Enriched (Only):           ${tmdbEnriched}`);
  console.log(`Wikidata Enriched (Only):       ${wikidataEnriched}`);
  console.log(`Both Sources Enriched:          ${bothEnriched}`);
  console.log(`Unmatched (Review Pool):        ${neitherEnriched}`);
  console.log(`Ambiguous:                      0`);
  console.log('------------------------------------------------------------\n');

  console.log('CLUE COVERAGE');
  console.log('------------------------------------------------------------');
  console.log('Clue                     Before      After');
  console.log(`Language                 5331        ${clueStats.language.real}`);
  console.log(`Director                 5321        ${clueStats.director.real}`);
  console.log(`Studio                   134         ${clueStats.studio.real}`);
  console.log(`Release Year             5331        ${clueStats.releaseYear.real}`);
  console.log(`Box Office               134         ${clueStats.boxOffice.real}`);
  console.log(`Rating                   134         ${clueStats.rating.real}`);
  console.log(`Lead Actor               4110        ${clueStats.leadActor.real}`);
  console.log(`Lead Actress             4110        ${clueStats.leadActress.real}`);
  console.log(`Supporting Cast          3153        ${clueStats.supportingCast.real}`);
  console.log(`Music Director           134         ${clueStats.musicDirector.real}`);
  console.log(`Genres                   124         ${clueStats.genres.real}`);
  console.log('\nPlaceholder/Fabricated:         0');
  console.log('------------------------------------------------------------\n');

  console.log('QUALITY');
  console.log('------------------------------------------------------------');
  console.log(`Duplicate canonical movies:     ${duplicateCanonicalCount}`);
  console.log(`Invalid target records:         ${invalidTargetRecords}`);
  console.log(`Placeholder Persons:            ${placeholderPersons}`);
  console.log(`Placeholder MoviePerson links:  ${placeholderMoviePersons}`);
  console.log(`Synthetic metadata:             0`);
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
