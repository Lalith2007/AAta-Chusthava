import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initialAudit() {
  const totalMovies = await prisma.movie.count();
  const activeMovies = await prisma.movie.count({ where: { lifecycleStatus: 'ACTIVE' } });
  const validationRequired = await prisma.movie.count({ where: { lifecycleStatus: 'VALIDATION_REQUIRED' } });
  const disabled = await prisma.movie.count({ where: { lifecycleStatus: 'DISABLED' } });
  const merged = await prisma.movie.count({ where: { lifecycleStatus: 'MERGED' } });

  const totalCandidates = await prisma.ingestionCandidate.count();
  const discovered = await prisma.ingestionCandidate.count({ where: { status: 'DISCOVERED' } });
  const ingesting = await prisma.ingestionCandidate.count({ where: { status: 'PROCESSING' } });
  const normalized = await prisma.ingestionCandidate.count({ where: { status: 'NORMALIZED' } });
  const rejected = await prisma.ingestionCandidate.count({ where: { status: 'REJECTED' } });

  const allMovies = await prisma.movie.findMany({
    include: {
      eligibility: true,
      genres: { include: { genre: true } },
    },
    orderBy: { releaseYear: 'asc' },
  });

  const playableAsGuess = allMovies.filter((m) => m.eligibility?.playableAsGuess).length;
  const playableAsTarget = allMovies.filter((m) => m.eligibility?.playableAsTarget).length;
  const playableBoth = allMovies.filter(
    (m) => m.eligibility?.playableAsGuess && m.eligibility?.playableAsTarget
  ).length;
  const needsReview = allMovies.filter((m) => m.eligibility?.reviewStatus === 'PENDING').length;

  console.log('=== 1. INITIAL DATABASE AUDIT ===');
  console.log(`Total Movie records: ${totalMovies}`);
  console.log(`Total ACTIVE: ${activeMovies}`);
  console.log(`Total DISCOVERED: ${discovered}`);
  console.log(`Total INGESTING: ${ingesting}`);
  console.log(`Total NORMALIZED: ${normalized}`);
  console.log(`Total VALIDATION_REQUIRED: ${validationRequired}`);
  console.log(`Total REJECTED: ${rejected}`);
  console.log(`Total DISABLED: ${disabled}`);
  console.log(`Total MERGED: ${merged}`);
  console.log(`Playable as Guess: ${playableAsGuess}`);
  console.log(`Playable as Target: ${playableAsTarget}`);
  console.log(`Playable Both: ${playableBoth}`);
  console.log(`Needs Review: ${needsReview}`);

  // Group by Language
  const byLang: Record<string, number> = {};
  for (const m of allMovies) {
    for (const l of m.supportedLanguages) {
      byLang[l] = (byLang[l] || 0) + 1;
    }
  }
  console.log('\n--- Grouped by Language ---');
  console.log(JSON.stringify(byLang, null, 2));

  // Group by Industry
  const byIndustry: Record<string, number> = {};
  for (const m of allMovies) {
    for (const ind of m.industries) {
      byIndustry[ind] = (byIndustry[ind] || 0) + 1;
    }
  }
  console.log('\n--- Grouped by Industry ---');
  console.log(JSON.stringify(byIndustry, null, 2));

  // Group by Release Year
  const byYear: Record<number, number> = {};
  for (const m of allMovies) {
    byYear[m.releaseYear] = (byYear[m.releaseYear] || 0) + 1;
  }
  console.log('\n--- Grouped by Release Year ---');
  console.log(JSON.stringify(byYear, null, 2));
}

initialAudit()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
