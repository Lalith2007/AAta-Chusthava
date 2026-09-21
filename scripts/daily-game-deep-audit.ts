import { PrismaClient } from '@prisma/client';
import { isValidPersonName } from '../src/infrastructure/external-sources/wikipedia-adapter';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('PHASE 1–14: DAILY GAME & TARGET QUALITY DEEP AUDIT');
  console.log('============================================================\n');

  // Load all 4,575 target-playable movies
  const targetMovies = await prisma.movie.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      eligibility: {
        playableAsTarget: true,
      },
    },
    include: {
      eligibility: true,
      people: { include: { person: true } },
      productionHouses: { include: { productionHouse: true } },
      genres: { include: { genre: true } },
    },
  });

  const totalTargets = targetMovies.length;
  console.log(`[Target Pool] Total playableAsTarget = true: ${totalTargets}\n`);

  // 1. 11-CLUE AVAILABILITY ACROSS TARGET POOL
  let langCount = 0;
  let dirCount = 0;
  let studioCount = 0;
  let yearCount = 0;
  let boxOfficeCount = 0;
  let ratingCount = 0;
  let leadActorCount = 0;
  let leadActressCount = 0;
  let suppCastCount = 0;
  let musicDirCount = 0;
  let genreCount = 0;

  // Metadata Richness Tiers
  let richMetadataCount = 0;    // >= 7 clues
  let mediumMetadataCount = 0;  // 5-6 clues
  let minimalMetadataCount = 0; // <= 4 clues

  // Clue availability per movie
  const clueCountHistogram: Record<number, number> = {};

  for (const m of targetMovies) {
    let availableClues = 0;

    const hasLang = m.supportedLanguages && m.supportedLanguages.length > 0;
    if (hasLang) { langCount++; availableClues++; }

    const hasDir = m.people.some(
      (p) => (p.roleType === 'DIRECTOR' || p.job === 'Director') && isValidPersonName(p.person.canonicalName)
    );
    if (hasDir) { dirCount++; availableClues++; }

    const hasStudio = m.productionHouses.length > 0;
    if (hasStudio) { studioCount++; availableClues++; }

    const hasYear = !!m.releaseYear;
    if (hasYear) { yearCount++; availableClues++; }

    const hasBoxOffice = !!m.boxOffice && m.boxOffice > 0;
    if (hasBoxOffice) { boxOfficeCount++; availableClues++; }

    const hasRating = !!m.rating && m.rating > 0;
    if (hasRating) { ratingCount++; availableClues++; }

    const hasLeadActor = m.people.some(
      (p) => p.roleType === 'LEAD' && isValidPersonName(p.person.canonicalName)
    );
    if (hasLeadActor) { leadActorCount++; availableClues++; }

    const hasLeadActress = m.people.some(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING') && isValidPersonName(p.person.canonicalName)
    );
    if (hasLeadActress) { leadActressCount++; availableClues++; }

    const hasSuppCast = m.people.some(
      (p) => p.roleType === 'SUPPORTING' && isValidPersonName(p.person.canonicalName)
    );
    if (hasSuppCast) { suppCastCount++; availableClues++; }

    const hasMusic = m.people.some(
      (p) =>
        (p.roleType === 'MUSIC_DIRECTOR' ||
          p.job === 'Music Director' ||
          p.job === 'Music' ||
          p.job === 'Original Music Composer') &&
        isValidPersonName(p.person.canonicalName)
    );
    if (hasMusic) { musicDirCount++; availableClues++; }

    const hasGenre = m.genres.length > 0;
    if (hasGenre) { genreCount++; availableClues++; }

    clueCountHistogram[availableClues] = (clueCountHistogram[availableClues] || 0) + 1;

    if (availableClues >= 7) {
      richMetadataCount++;
    } else if (availableClues >= 5) {
      mediumMetadataCount++;
    } else {
      minimalMetadataCount++;
    }
  }

  console.log(`[11-Clue Availability Across 4,575 Targets]:`);
  console.log(`  Language:        ${langCount} / ${totalTargets} (${((langCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Director:        ${dirCount} / ${totalTargets} (${((dirCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Studio:          ${studioCount} / ${totalTargets} (${((studioCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Release Year:    ${yearCount} / ${totalTargets} (${((yearCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Box Office:      ${boxOfficeCount} / ${totalTargets} (${((boxOfficeCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Rating:          ${ratingCount} / ${totalTargets} (${((ratingCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Lead Actor:      ${leadActorCount} / ${totalTargets} (${((leadActorCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Lead Actress:    ${leadActressCount} / ${totalTargets} (${((leadActressCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Supporting Cast: ${suppCastCount} / ${totalTargets} (${((suppCastCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Music Director:  ${musicDirCount} / ${totalTargets} (${((musicDirCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Genres:          ${genreCount} / ${totalTargets} (${((genreCount/totalTargets)*100).toFixed(1)}%)\n`);

  console.log(`[Metadata Richness Tiers]:`);
  console.log(`  Rich Metadata (>= 7 clues):    ${richMetadataCount} (${((richMetadataCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Medium Metadata (5-6 clues):   ${mediumMetadataCount} (${((mediumMetadataCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Minimal Metadata (<= 4 clues): ${minimalMetadataCount} (${((minimalMetadataCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Clue Count Breakdown:`, clueCountHistogram, '\n');

  // 2. LANGUAGE DISTRIBUTION
  let teluguCount = 0;
  let hindiCount = 0;
  let multilingualCount = 0;

  for (const m of targetMovies) {
    const isTelugu = m.supportedLanguages.includes('TELUGU');
    const isHindi = m.supportedLanguages.includes('HINDI');
    if (isTelugu && isHindi) {
      multilingualCount++;
    } else if (isTelugu) {
      teluguCount++;
    } else if (isHindi) {
      hindiCount++;
    }
  }

  console.log(`[Language Distribution Across Targets]:`);
  console.log(`  Telugu Only:   ${teluguCount} (${((teluguCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Hindi Only:    ${hindiCount} (${((hindiCount/totalTargets)*100).toFixed(1)}%)`);
  console.log(`  Multilingual:  ${multilingualCount} (${((multilingualCount/totalTargets)*100).toFixed(1)}%)\n`);

  // 3. ERA / YEAR DISTRIBUTION
  const eraCounts: Record<string, number> = {
    '2002–2005': 0,
    '2006–2010': 0,
    '2011–2015': 0,
    '2016–2020': 0,
    '2021–2026': 0,
  };
  const yearHistogram: Record<number, number> = {};

  for (const m of targetMovies) {
    const y = m.releaseYear;
    yearHistogram[y] = (yearHistogram[y] || 0) + 1;
    if (y >= 2002 && y <= 2005) eraCounts['2002–2005']++;
    else if (y >= 2006 && y <= 2010) eraCounts['2006–2010']++;
    else if (y >= 2011 && y <= 2015) eraCounts['2011–2015']++;
    else if (y >= 2016 && y <= 2020) eraCounts['2016–2020']++;
    else if (y >= 2021 && y <= 2026) eraCounts['2021–2026']++;
  }

  console.log(`[Era Distribution Across Targets]:`);
  for (const [era, count] of Object.entries(eraCounts)) {
    console.log(`  ${era}: ${count} (${((count/totalTargets)*100).toFixed(1)}%)`);
  }
  console.log(`  Year-by-Year Histogram:`, yearHistogram, '\n');

  // 4. DIFFICULTY PROXY SIGNALS
  const ratedMovies = targetMovies.filter((m) => m.rating && m.rating > 0);
  const avgRating = ratedMovies.length > 0
    ? ratedMovies.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMovies.length
    : 0;

  const moviesWithVoteCount = targetMovies.filter((m) => m.ratingVoteCount && m.ratingVoteCount > 0);
  const highPopularityMovies = targetMovies.filter((m) => (m.ratingVoteCount || 0) >= 50);

  console.log(`[Difficulty Proxy Signals Available in DB]:`);
  console.log(`  Movies with Ratings:          ${ratedMovies.length} (Avg: ${avgRating.toFixed(2)} ★)`);
  console.log(`  Movies with Vote Counts:      ${moviesWithVoteCount.length}`);
  console.log(`  High-Popularity (>= 50 votes): ${highPopularityMovies.length}`);
  console.log(`  Movies with Box Office data:  ${boxOfficeCount}\n`);

  // 5. EXISTING DAILY PUZZLES IN DB
  const existingDailyPuzzles = await prisma.dailyPuzzle.findMany({
    include: {
      targetMovie: true,
      game: { include: { sessions: true } },
    },
    orderBy: { puzzleDate: 'asc' },
  });

  console.log(`[Existing Daily Puzzles in Database]: ${existingDailyPuzzles.length}`);
  for (const dp of existingDailyPuzzles) {
    console.log(
      `  Date: ${dp.puzzleDate} | Movie: "${dp.targetMovie.primaryTitle}" (${dp.targetMovie.releaseYear}, ${dp.targetMovie.supportedLanguages.join('/')}) | Method: ${dp.selectionMethod} | Sessions: ${dp.game.sessions.length}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
