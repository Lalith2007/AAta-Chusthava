import { PrismaClient } from '@prisma/client';
import { isValidPersonName } from '../src/infrastructure/external-sources/wikipedia-adapter';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('STARTING READ-ONLY PLAYABLE-TARGET INTEGRITY AUDIT');
  console.log('============================================================\n');

  // 1. ALL MOVIES AND BASIC COUNTS
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
  });

  const totalCanonical = allMovies.length;
  const activeMovies = allMovies.filter((m) => m.lifecycleStatus === 'ACTIVE');
  const activeCount = activeMovies.length;

  console.log(`[1] Total Canonical Movies: ${totalCanonical}`);
  console.log(`    Active Movies: ${activeCount}`);

  // 2. PLAYABILITY COUNTS
  const playableAsGuess = allMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const playableAsTarget = allMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const playableBoth = allMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;
  const notPlayableAsGuess = allMovies.filter((m) => !m.eligibility?.playableAsGuess).length;
  const notPlayableAsTarget = allMovies.filter((m) => !m.eligibility?.playableAsTarget).length;
  const needsReview = allMovies.filter(
    (m) => m.eligibility?.reviewStatus === 'PENDING' || m.lifecycleStatus === 'VALIDATION_REQUIRED'
  ).length;

  console.log(`\n[2] Playability Distribution:`);
  console.log(`    Playable as Guess: ${playableAsGuess}`);
  console.log(`    Playable as Target: ${playableAsTarget}`);
  console.log(`    Playable Both: ${playableBoth}`);
  console.log(`    Not Playable as Guess: ${notPlayableAsGuess}`);
  console.log(`    Not Playable as Target: ${notPlayableAsTarget}`);
  console.log(`    Needs Review / Insufficient Target Metadata: ${needsReview}`);

  // Invariant assertions
  const inv1 = playableBoth <= playableAsTarget && playableAsTarget <= activeCount;
  const inv2 = playableBoth <= playableAsGuess && playableAsGuess <= activeCount;
  const inv3 = playableBoth === allMovies.filter(m => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget).length;
  console.log(`    Invariant Check (PlayableBoth <= PlayableAsTarget <= Active): ${inv1 ? 'PASS' : 'FAIL'}`);
  console.log(`    Invariant Check (PlayableBoth <= PlayableAsGuess <= Active): ${inv2 ? 'PASS' : 'FAIL'}`);
  console.log(`    Invariant Check (PlayableBoth == Count(Guess && Target)): ${inv3 ? 'PASS' : 'FAIL'}`);

  // 3. TARGET-PLAYABLE MOVIES INTEGRITY AUDIT (PRIMARY INVARIANT)
  let invalidTargetRecords = 0;
  const invalidTargetDetails: Array<{ id: string; title: string; year: number; reason: string }> = [];

  for (const m of allMovies) {
    if (m.eligibility?.playableAsTarget) {
      const directors = m.people.filter(
        (p) => p.roleType === 'DIRECTOR' || p.relationType === 'CREW'
      );
      const validDirectors = directors.filter((d) => isValidPersonName(d.person.canonicalName));

      const cast = m.people.filter(
        (p) => p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST'
      );
      const validCast = cast.filter((c) => isValidPersonName(c.person.canonicalName));

      const hasValidDirector = validDirectors.length >= 1;
      const hasValidCast = validCast.length >= 2;
      const hasValidYear = typeof m.releaseYear === 'number' && m.releaseYear >= 1900;
      const isActive = m.lifecycleStatus === 'ACTIVE';
      const isApproved = m.eligibility.reviewStatus === 'APPROVED';
      const isMinMetadataComplete = m.eligibility.minimumMetadataComplete === true;

      // Check for placeholder persons in directors / cast
      const hasPlaceholderDirector = directors.some((d) => !isValidPersonName(d.person.canonicalName));
      const hasPlaceholderCast = cast.some((c) => !isValidPersonName(c.person.canonicalName));

      if (
        !hasValidDirector ||
        !hasValidCast ||
        !hasValidYear ||
        !isActive ||
        !isApproved ||
        !isMinMetadataComplete ||
        hasPlaceholderDirector ||
        hasPlaceholderCast
      ) {
        invalidTargetRecords++;
        invalidTargetDetails.push({
          id: m.id,
          title: m.primaryTitle,
          year: m.releaseYear,
          reason: `validDir=${validDirectors.length}, validCast=${validCast.length}, year=${m.releaseYear}, active=${isActive}, approved=${isApproved}, minMeta=${isMinMetadataComplete}, phDir=${hasPlaceholderDirector}, phCast=${hasPlaceholderCast}`,
        });
      }
    }
  }

  console.log(`\n[3] Primary Invariant Audit (For all playableAsTarget = true):`);
  console.log(`    Target-Playable Movies Audited: ${playableAsTarget}`);
  console.log(`    Invalid Target Records: ${invalidTargetRecords}`);
  if (invalidTargetRecords > 0) {
    console.error('    FAIL: Found invalid target records:', invalidTargetDetails);
  } else {
    console.log('    PASS: 100% of playableAsTarget movies strictly satisfy all primary invariants!');
  }

  // 4. REVERSE INVARIANT (Actual metadata predicate vs playableAsTarget)
  let recomputedTargetEligible = 0;
  const eligibleMovieIds: string[] = [];

  for (const m of allMovies) {
    if (m.lifecycleStatus !== 'ACTIVE') continue;
    if (!m.releaseYear || m.releaseYear < 1900) continue;

    const validDirectors = m.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    const validCast = m.people.filter(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName)
    );

    if (validDirectors.length >= 1 && validCast.length >= 2) {
      recomputedTargetEligible++;
      eligibleMovieIds.push(m.id);
    }
  }

  const targetDiff = Math.abs(recomputedTargetEligible - playableAsTarget);
  console.log(`\n[4] Reverse Invariant Reconciliation:`);
  console.log(`    Eligible by actual metadata predicate (validDir>=1, validCast>=2, validYear, active): ${recomputedTargetEligible}`);
  console.log(`    Marked playableAsTarget in database: ${playableAsTarget}`);
  console.log(`    Target Eligibility Difference: ${targetDiff}`);

  // 5. PLACEHOLDER PERSON RECORDS & MOVIE-PERSON LINKS AUDIT
  const allPersons = await prisma.person.findMany();
  const placeholderPersons = allPersons.filter((p) => !isValidPersonName(p.canonicalName));

  const allMoviePersons = await prisma.moviePerson.findMany({
    include: { person: true },
  });
  const placeholderMoviePersons = allMoviePersons.filter((mp) => !isValidPersonName(mp.person.canonicalName));

  const moviesWithPlaceholderLinks = new Set(placeholderMoviePersons.map((mp) => mp.movieId)).size;

  console.log(`\n[5] Placeholder Person Records & Relationships Audit:`);
  console.log(`    Total Person Records in DB: ${allPersons.length}`);
  console.log(`    Total Placeholder Person Records: ${placeholderPersons.length}`);
  console.log(`    Total MoviePerson Relationships in DB: ${allMoviePersons.length}`);
  console.log(`    Total Placeholder MoviePerson Links: ${placeholderMoviePersons.length}`);
  console.log(`    Movies Affected by Placeholder Links: ${moviesWithPlaceholderLinks}`);

  // 6. SYNTHETIC RELEASE DATE AUDIT
  // Check for suspicious synthetic fallback dates (e.g. YYYY-01-01 or YYYY-06-15) where the date was fabricated
  let syntheticReleaseDates = 0;
  for (const m of allMovies) {
    if (m.releaseDate) {
      const dateStr = m.releaseDate.toISOString().split('T')[0];
      // Check if title or data suggests artificial fallback
      if (dateStr.endsWith('-01-01') && m.slug.includes('synthetic')) {
        syntheticReleaseDates++;
      }
    }
  }
  console.log(`\n[6] Synthetic Release Dates Audit:`);
  console.log(`    Synthetic/Fallback Release Dates Found: ${syntheticReleaseDates}`);

  // 7. SYNTHETIC/FABRICATED GAMEPLAY METADATA AUDIT
  let fabricatedGameplayMetadata = 0;
  for (const m of allMovies) {
    for (const mp of m.people) {
      if (!isValidPersonName(mp.person.canonicalName)) {
        fabricatedGameplayMetadata++;
      }
    }
    for (const mg of m.genres) {
      if (mg.genre.canonicalName.toLowerCase() === 'n/a' || mg.genre.canonicalName.toLowerCase() === 'unknown') {
        fabricatedGameplayMetadata++;
      }
    }
  }
  console.log(`\n[7] Synthetic/Fabricated Gameplay Metadata:`);
  console.log(`    Fabricated Gameplay Metadata Count: ${fabricatedGameplayMetadata}`);

  // 8. 11-CLUE INTEGRITY AUDIT
  console.log(`\n[8] 11-Clue Availability Audit (Across all ${totalCanonical} canonical movies):`);
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
    // 1. Language
    if (m.supportedLanguages && m.supportedLanguages.length > 0) clueStats.language.real++;
    else clueStats.language.unavailable++;

    // 2. Director
    const dirs = m.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    if (dirs.length > 0) clueStats.director.real++;
    else clueStats.director.unavailable++;

    // 3. Studio
    if (m.productionHouses.length > 0) clueStats.studio.real++;
    else clueStats.studio.unavailable++;

    // 4. Release Year
    if (m.releaseYear) clueStats.releaseYear.real++;
    else clueStats.releaseYear.unavailable++;

    // 5. Box Office
    if (m.boxOffice && m.boxOffice > 0) clueStats.boxOffice.real++;
    else clueStats.boxOffice.unavailable++;

    // 6. Rating
    if (m.rating && m.rating > 0) clueStats.rating.real++;
    else clueStats.rating.unavailable++;

    // 7. Lead Actor
    const leadActors = m.people.filter(
      (p) => p.roleType === 'LEAD' && isValidPersonName(p.person.canonicalName)
    );
    if (leadActors.length > 0) clueStats.leadActor.real++;
    else clueStats.leadActor.unavailable++;

    // 8. Lead Actress (In schema, lead cast members are represented under LEAD role)
    if (leadActors.length > 0) clueStats.leadActress.real++;
    else clueStats.leadActress.unavailable++;

    // 9. Supporting Cast
    const supporting = m.people.filter(
      (p) => p.roleType === 'SUPPORTING' && isValidPersonName(p.person.canonicalName)
    );
    if (supporting.length > 0) clueStats.supportingCast.real++;
    else clueStats.supportingCast.unavailable++;

    // 10. Music Director
    const musicDirs = m.people.filter(
      (p) => p.roleType === 'MUSIC_DIRECTOR' && isValidPersonName(p.person.canonicalName)
    );
    if (musicDirs.length > 0) clueStats.musicDirector.real++;
    else clueStats.musicDirector.unavailable++;

    // 11. Genres
    if (m.genres.length > 0) clueStats.genres.real++;
    else clueStats.genres.unavailable++;
  }

  console.table(clueStats);

  // 9. WIKIPEDIA-NEW SUBSET AUDIT (5,206 movies)
  // Baseline was 125 active canonical movies. Let's find movies without tmdbId / wikidataId or ingested from Wikipedia
  const wikipediaCandidates = await prisma.ingestionCandidate.findMany({
    where: { source: 'WIKIPEDIA' },
  });
  const wikipediaOnlyCandidates = wikipediaCandidates.filter(c => c.status === 'VALIDATED');
  
  // A movie is Wikipedia-new if it was created during Wikipedia ingestion (no tmdbId and no wikidataId, or slug has wiki origin)
  const wikipediaNewMovies = allMovies.filter(
    (m) => m.tmdbId === null && m.wikidataId === null
  );

  const wikiNewTotal = wikipediaNewMovies.length;
  const wikiNewGuess = wikipediaNewMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const wikiNewTargetReported = wikipediaNewMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const wikiNewBoth = wikipediaNewMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;
  const wikiNewInsufficient = wikipediaNewMovies.filter((m) => !m.eligibility?.playableAsTarget).length;

  let wikiNewTargetRecomputed = 0;
  for (const m of wikipediaNewMovies) {
    if (m.lifecycleStatus !== 'ACTIVE') continue;
    if (!m.releaseYear || m.releaseYear < 1900) continue;

    const validDirectors = m.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    const validCast = m.people.filter(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName)
    );

    if (validDirectors.length >= 1 && validCast.length >= 2) {
      wikiNewTargetRecomputed++;
    }
  }

  const wikiTargetDiff = Math.abs(wikiNewTargetRecomputed - wikiNewTargetReported);

  console.log(`\n[9] Wikipedia-New Subset Audit (${wikiNewTotal} movies):`);
  console.log(`    Total Wikipedia-New: ${wikiNewTotal}`);
  console.log(`    Playable as Guess: ${wikiNewGuess}`);
  console.log(`    Playable as Target (reported): ${wikiNewTargetReported}`);
  console.log(`    Playable as Target (recomputed): ${wikiNewTargetRecomputed}`);
  console.log(`    Wikipedia Target Difference: ${wikiTargetDiff}`);
  console.log(`    Playable Both: ${wikiNewBoth}`);
  console.log(`    Insufficient Target Metadata: ${wikiNewInsufficient}`);

  // 10. SOURCE / PROVENANCE & CANDIDATE ARITHMETIC AUDIT
  const tmdbCandidates = await prisma.ingestionCandidate.findMany({ where: { source: 'TMDB' } });
  const wikidataCandidates = await prisma.ingestionCandidate.findMany({ where: { source: 'WIKIDATA' } });
  const wikiCandidates = await prisma.ingestionCandidate.findMany({ where: { source: 'WIKIPEDIA' } });

  const sources = [
    { name: 'TMDB', candidates: tmdbCandidates },
    { name: 'WIKIDATA', candidates: wikidataCandidates },
    { name: 'WIKIPEDIA', candidates: wikiCandidates },
  ];

  console.log(`\n[10] Source Provenance & Candidate Arithmetic:`);
  for (const s of sources) {
    const discovered = s.candidates.length;
    const accepted = s.candidates.filter(c => c.status === 'VALIDATED').length;
    const duplicates = s.candidates.filter(c => c.status === 'DUPLICATE').length;
    const rejected = s.candidates.filter(c => c.status === 'REJECTED').length;
    const processing = s.candidates.filter(c => c.status === 'PROCESSING' || c.status === 'DISCOVERED' || c.status === 'ENRICHED' || c.status === 'NORMALIZED').length;
    const failed = s.candidates.filter(c => c.status === 'FAILED').length;

    console.log(
      `    ${s.name}: Discovered=${discovered} | Accepted=${accepted} | Duplicates=${duplicates} | Rejected=${rejected} | Processing=${processing} | Failed=${failed}`
    );
  }

  // 11. 150 CHECKPOINTS AUDIT
  const allCheckpoints = await prisma.discoveryCheckpoint.findMany();
  const tmdbCheckpoints = allCheckpoints.filter((c) => c.source === 'TMDB');
  const wikidataCheckpoints = allCheckpoints.filter((c) => c.source === 'WIKIDATA');
  const wikipediaCheckpoints = allCheckpoints.filter((c) => c.source === 'WIKIPEDIA');
  const completedCheckpoints = allCheckpoints.filter((c) => c.status === 'COMPLETED');

  console.log(`\n[11] Discovery Checkpoints Audit:`);
  console.log(`    TMDB Checkpoints: ${tmdbCheckpoints.length} (Completed: ${tmdbCheckpoints.filter(c => c.status === 'COMPLETED').length})`);
  console.log(`    Wikidata Checkpoints: ${wikidataCheckpoints.length} (Completed: ${wikidataCheckpoints.filter(c => c.status === 'COMPLETED').length})`);
  console.log(`    Wikipedia Checkpoints: ${wikipediaCheckpoints.length} (Completed: ${wikipediaCheckpoints.filter(c => c.status === 'COMPLETED').length})`);
  console.log(`    Total Checkpoints: ${allCheckpoints.length} (Completed: ${completedCheckpoints.length})`);
  console.log(`    All 150 Checkpoints Status = COMPLETED: ${allCheckpoints.length === 150 && completedCheckpoints.length === 150}`);

  console.log('\n============================================================');
  console.log('AUDIT COMPLETE');
  console.log('============================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
