import { PrismaClient } from '@prisma/client';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';
import { wikidataDiscoveryAdapter, WIKIDATA_HISTORICAL_CATALOG } from '../src/infrastructure/external-sources/wikidata-adapter';
import { HISTORICAL_CATALOG } from '../src/infrastructure/external-sources/historical-catalog-data';
import { isValidPersonName } from '../src/infrastructure/external-sources/wikipedia-adapter';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ENRICHMENT DIAGNOSTIC & DRY RUN ---');
  
  const totalMovies = await prisma.movie.count();
  const reviewMovies = await prisma.movie.findMany({
    where: {
      eligibility: {
        playableAsTarget: false,
      },
    },
    include: {
      eligibility: true,
      people: { include: { person: true } },
      productionHouses: true,
      genres: true,
    },
  });

  console.log(`Total canonical: ${totalMovies}`);
  console.log(`Needs review / Insufficient target metadata: ${reviewMovies.length}`);

  let tmdbMatches = 0;
  let wikidataMatches = 0;
  let bothMatches = 0;
  let recoveredTargets = 0;
  let unmatched = 0;
  let ambiguous = 0;

  for (const m of reviewMovies) {
    const titleNorm = m.primaryTitle.toLowerCase().trim();
    const year = m.releaseYear;
    const lang = m.supportedLanguages.includes('TELUGU') ? 'te' : 'hi';

    // Check TMDB catalog
    const tmdbMatch = HISTORICAL_CATALOG.find((t) => {
      const tYear = parseInt(t.details.release_date.split('-')[0], 10);
      return (
        tYear === year &&
        (t.details.title.toLowerCase().trim() === titleNorm ||
          t.details.original_title.toLowerCase().trim() === titleNorm ||
          (t.alternativeTitles || []).some((a) => a.toLowerCase().trim() === titleNorm))
      );
    });

    // Check Wikidata catalog
    const wikiMatch = WIKIDATA_HISTORICAL_CATALOG.find((w) => {
      return (
        w.releaseYear === year &&
        (w.title.toLowerCase().trim() === titleNorm ||
          w.originalTitle.toLowerCase().trim() === titleNorm ||
          (w.alternativeTitles || []).some((a) => a.toLowerCase().trim() === titleNorm))
      );
    });

    if (tmdbMatch && wikiMatch) bothMatches++;
    else if (tmdbMatch) tmdbMatches++;
    else if (wikiMatch) wikidataMatches++;
    else unmatched++;

    // Check if matching provides enough directors and cast to recover target
    const currentDirs = m.people.filter(
      (p) => (p.roleType === 'DIRECTOR' || p.relationType === 'CREW') && isValidPersonName(p.person.canonicalName)
    );
    const currentCast = m.people.filter(
      (p) => (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') && isValidPersonName(p.person.canonicalName)
    );

    const mergedDirs = new Set(currentDirs.map((d) => d.person.canonicalName));
    const mergedCast = new Set(currentCast.map((c) => c.person.canonicalName));

    if (tmdbMatch) {
      tmdbMatch.credits.crew
        .filter((c) => c.job === 'Director' && isValidPersonName(c.name))
        .forEach((d) => mergedDirs.add(d.name));
      tmdbMatch.credits.cast
        .filter((c) => isValidPersonName(c.name))
        .forEach((c) => mergedCast.add(c.name));
    }

    if (wikiMatch) {
      wikiMatch.directors
        .filter((d) => isValidPersonName(d.name))
        .forEach((d) => mergedDirs.add(d.name));
      wikiMatch.cast
        .filter((c) => isValidPersonName(c.name))
        .forEach((c) => mergedCast.add(c.name));
    }

    if (mergedDirs.size >= 1 && mergedCast.size >= 2) {
      recoveredTargets++;
    }
  }

  console.log(`Matched TMDB only: ${tmdbMatches}`);
  console.log(`Matched Wikidata only: ${wikidataMatches}`);
  console.log(`Matched Both: ${bothMatches}`);
  console.log(`Total matched: ${tmdbMatches + wikidataMatches + bothMatches}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Potential target recoveries: ${recoveredTargets}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
