import { PrismaClient } from '@prisma/client';
import { dailyPuzzleSelector } from '../src/modules/daily/daily-puzzle-selector';
import { addDaysToPuzzleDate, getIndianCalendarDate } from '../src/lib/date-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('14-CONSECUTIVE-DAY DETERMINISTIC DAILY PUZZLE PREVIEW');
  console.log('============================================================\n');

  const startDate = getIndianCalendarDate(new Date());
  const run1Results: any[] = [];
  const run2Results: any[] = [];

  console.log(`Starting Date (IST): ${startDate}\n`);
  console.log('--- RUN 1: Generating 14-Day Selection Preview ---');

  for (let i = 0; i < 14; i++) {
    const puzzleDate = addDaysToPuzzleDate(startDate, i);
    const result = await dailyPuzzleSelector.selectDailyTarget(puzzleDate);
    run1Results.push(result);
    console.log(
      `[${puzzleDate}] ID: ${result.selectedMovieId} | Movie: "${result.metadata.selectedTitle}" | Lang: ${result.metadata.language} | Tier: ${result.metadata.qualityTier} | Score: ${result.metadata.qualityScore} | Level: ${result.metadata.fallbackLevel}`
    );
  }

  console.log('\n--- RUN 2: Re-generating 14-Day Selection Preview (Determinism Proof) ---');
  let matchCount = 0;
  for (let i = 0; i < 14; i++) {
    const puzzleDate = addDaysToPuzzleDate(startDate, i);
    const result = await dailyPuzzleSelector.selectDailyTarget(puzzleDate);
    run2Results.push(result);

    const match =
      result.selectedMovieId === run1Results[i].selectedMovieId &&
      result.metadata.qualityScore === run1Results[i].metadata.qualityScore &&
      result.metadata.fallbackLevel === run1Results[i].metadata.fallbackLevel &&
      result.metadata.deterministicPriority === run1Results[i].metadata.deterministicPriority;

    if (match) matchCount++;
    console.log(
      `[${puzzleDate}] ID: ${result.selectedMovieId} | Movie: "${result.metadata.selectedTitle}" | Match Run 1: ${match ? 'EXACT MATCH' : 'MISMATCH'}`
    );
  }

  console.log('\n============================================================');
  console.log(`DETERMINISM VERIFICATION: ${matchCount === 14 ? 'PASS (14/14 EXACT MATCHES)' : 'FAIL'}`);
  console.log('============================================================\n');

  if (matchCount !== 14) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
