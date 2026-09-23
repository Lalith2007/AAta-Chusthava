import 'dotenv/config';
import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

async function main() {
  const args = process.argv.slice(2);
  const pageArg = args.find((a) => a.startsWith('--page='));
  const page = pageArg ? parseInt(pageArg.split('=')[1], 10) : 1;

  console.log('Fetching Poster Manual Review Queue...\n');
  const queue = await posterReviewService.getPosterReviewQueue({ page, pageSize: 25 });

  console.log('============================================================');
  console.log('POSTER MANUAL REVIEW QUEUE');
  console.log('============================================================');
  console.log(`Total Awaiting Review: ${queue.total}`);
  console.log(`Page:                  ${queue.page} of ${queue.totalPages}`);
  console.log('============================================================\n');

  for (const item of queue.items) {
    const director = item.directors.join(', ') || 'Unknown';
    const cast = item.leadCast.slice(0, 3).join(', ') || 'Unknown';
    console.log(
      `[${item.id.slice(0, 8)}] ${item.title} (${item.releaseYear}) [${item.languages.join('/')}]`
    );
    console.log(`   Dir: ${director} | Cast: ${cast} | TMDB: ${item.tmdbId ?? 'NONE'}`);
  }
  console.log('\n============================================================\n');
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
