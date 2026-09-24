import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';
import { personEnrichmentService } from '../src/modules/enrichment/person-enrichment-service';

async function main() {
  console.log('Running Person Data & Profile Image Audit...');
  const stats = await personEnrichmentService.auditPersons();

  console.log('\n============================================================');
  console.log('PERSON ASSET & IDENTITY AUDIT REPORT');
  console.log('============================================================');
  console.log(`Total Person Records:            ${stats.totalPersons}`);
  console.log(`Persons in Active Movies:        ${stats.personsInActiveMovies}`);
  console.log(`Persons in Target Playable:      ${stats.personsInTargetPlayable}`);
  console.log('------------------------------------------------------------');
  console.log(`With Valid Image:                ${stats.withImage} (${((stats.withImage / stats.totalPersons) * 100).toFixed(1)}%)`);
  console.log(`Without Image:                   ${stats.withoutImage}`);
  console.log(`With TMDB ID:                    ${stats.withTmdbId} (${((stats.withTmdbId / stats.totalPersons) * 100).toFixed(1)}%)`);
  console.log(`Without TMDB ID:                 ${stats.withoutTmdbId}`);
  console.log('------------------------------------------------------------');
  console.log(`Lead Cast Persons:               ${stats.leadCastCount} (With Image: ${stats.leadCastWithImage})`);
  console.log(`Directors:                       ${stats.directorsCount} (With Image: ${stats.directorsWithImage})`);
  console.log(`Supporting Cast (CastTile):      ${stats.supportingCastCount} (With Image: ${stats.supportingCastWithImage})`);
  console.log('------------------------------------------------------------');
  console.log('PLAYER-VISIBLE PERSONS (Lead Cast, Director, Supporting Cast)');
  console.log('------------------------------------------------------------');
  console.log(`Player-Visible Total:            ${stats.playerVisibleTotal}`);
  console.log(`Verified Images:                 ${stats.playerVisibleWithImage} (${((stats.playerVisibleWithImage / stats.playerVisibleTotal) * 100).toFixed(1)}%)`);
  console.log(`Missing Images (Manual Review):  ${stats.playerVisibleWithoutImage}`);
  console.log(`Enrichment Candidates (tmdbId+): ${stats.enrichmentCandidates}`);
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
