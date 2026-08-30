import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalMovies = await prisma.movie.count();
  const activeMovies = await prisma.movie.count({
    where: { lifecycleStatus: 'ACTIVE' },
  });

  const allMovies = await prisma.movie.findMany({
    include: {
      eligibility: true,
      people: { include: { person: true } },
      productionHouses: true,
      genres: true,
    },
  });

  const playableAsGuess = allMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const playableAsTarget = allMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const playableBoth = allMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;

  const blockedFromGuess = allMovies.filter((m) => !m.eligibility?.playableAsGuess).length;
  const blockedFromTarget = allMovies.filter((m) => !m.eligibility?.playableAsTarget).length;

  const approved = allMovies.filter((m) => m.eligibility?.reviewStatus === 'APPROVED').length;
  const needsReview = allMovies.filter((m) => m.eligibility?.reviewStatus === 'PENDING' || m.lifecycleStatus === 'VALIDATION_REQUIRED').length;
  const disabledMergedRejected = allMovies.filter(
    (m) =>
      m.lifecycleStatus === 'DISABLED' ||
      m.lifecycleStatus === 'MERGED' ||
      m.eligibility?.reviewStatus === 'REJECTED'
  ).length;

  console.log('=== DATABASE PLAYABILITY AUDIT RESULTS ===');
  console.log(`1. Total movies in Movie table: ${totalMovies}`);
  console.log(`2. Total ACTIVE movies: ${activeMovies}`);
  console.log(`3. Total playableAsGuess = true: ${playableAsGuess}`);
  console.log(`4. Total playableAsTarget = true: ${playableAsTarget}`);
  console.log(`5. Total movies playable both as guess and target: ${playableBoth}`);
  console.log(`6. Total movies blocked from guessing: ${blockedFromGuess}`);
  console.log(`7. Total movies blocked from being targets: ${blockedFromTarget}`);
  console.log(`8. Total VALIDATED/APPROVED movies: ${approved}`);
  console.log(`9. Number of movies currently requiring review: ${needsReview}`);
  console.log(`10. Number of rejected/disabled/merged records: ${disabledMergedRejected}`);

  console.log('\n=== INDIVIDUAL MOVIE STATUS BREAKDOWN ===');
  for (const m of allMovies) {
    console.log(
      `- [${m.primaryTitle} (${m.releaseYear})]: Status=${m.lifecycleStatus}, Guess=${m.eligibility?.playableAsGuess ?? false}, Target=${m.eligibility?.playableAsTarget ?? false}, Review=${m.eligibility?.reviewStatus ?? 'NONE'}, Complete=${m.eligibility?.minimumMetadataComplete ?? false}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
