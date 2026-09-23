import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';

async function main() {
  console.log('Fetching Persons with Missing Images in Target-Playable Movies...\n');

  const persons = await prisma.person.findMany({
    where: {
      OR: [{ image: null }, { image: '' }],
      movies: {
        some: {
          roleType: { in: ['LEAD', 'DIRECTOR'] },
          movie: {
            lifecycleStatus: 'ACTIVE',
            eligibility: { playableAsTarget: true },
          },
        },
      },
    },
    take: 50,
    orderBy: { canonicalName: 'asc' },
    select: {
      id: true,
      canonicalName: true,
      tmdbId: true,
      movies: {
        where: {
          movie: { lifecycleStatus: 'ACTIVE' },
        },
        take: 3,
        select: {
          roleType: true,
          movie: {
            select: {
              primaryTitle: true,
              releaseYear: true,
            },
          },
        },
      },
    },
  });

  console.log('============================================================');
  console.log(`SAMPLE PERSONS MISSING IMAGES (Target Playable Leads/Directors)`);
  console.log('============================================================');
  for (const p of persons) {
    const moviesSummary = p.movies
      .map((m) => `${m.movie.primaryTitle} (${m.movie.releaseYear}) [${m.roleType}]`)
      .join(', ');
    console.log(
      `- ${p.canonicalName} (TMDB ID: ${p.tmdbId ?? 'NONE'}) -> Movies: ${moviesSummary || 'None'}`
    );
  }
  console.log('============================================================\n');
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
