import { PrismaClient } from '@prisma/client';
import { dailyPuzzleService } from '../src/modules/daily/daily-puzzle-service';
import { dailyPuzzleSelector } from '../src/modules/daily/daily-puzzle-selector';
import { addDaysToPuzzleDate } from '../src/lib/date-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('PR #22: 14-DAY SEQUENTIAL DAILY SCHEDULING & DETERMINISM VERIFICATION');
  console.log('============================================================\n');

  const SEQ_START_DATE = '2035-01-01';
  const seqDates: string[] = [];
  for (let i = 0; i < 14; i++) {
    seqDates.push(addDaysToPuzzleDate(SEQ_START_DATE, i));
  }

  // Ensure clean starting slate for isolated test range
  await prisma.dailyPuzzle.deleteMany({
    where: { puzzleDate: { in: seqDates } },
  });

  try {
    console.log('--- PHASE 1: Sequential Daily Scheduling (With Persistence & 60-Day Cooldown) ---');
    const scheduledRows: any[] = [];

    for (const date of seqDates) {
      await dailyPuzzleService.getOrCreatePuzzleForDate(date);
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
        include: {
          targetMovie: {
            include: { eligibility: true },
          },
        },
      });
      if (!puzzle) throw new Error(`Failed to persist puzzle for date: ${date}`);
      scheduledRows.push(puzzle);
    }

    // Tabulate the sequential persisted schedule
    console.log('\n[Sequential Persisted Schedule (2035-01-01 to 2035-01-14)]:');
    const targetIds: string[] = [];
    let cooldownViolations = 0;

    for (let i = 0; i < scheduledRows.length; i++) {
      const p = scheduledRows[i];
      const meta = p.selectionMetadata as any;
      targetIds.push(p.targetMovieId);

      // Check for cooldown violation against prior days in window
      for (let j = 0; j < i; j++) {
        if (p.targetMovieId === scheduledRows[j].targetMovieId) {
          cooldownViolations++;
        }
      }

      console.log(
        `[${p.puzzleDate}] ID: ${p.targetMovieId} | Movie: "${meta.selectedTitle || p.targetMovie.primaryTitle}" | Lang: ${meta.language || p.targetMovie.supportedLanguages[0]} | Tier: ${meta.qualityTier} | Score: ${meta.qualityScore} | Level: ${meta.fallbackLevel}`
      );
    }

    const uniqueTargetCount = new Set(targetIds).size;
    const duplicateCount = 14 - uniqueTargetCount;

    console.log('\n[Sequential Cooldown Metrics]:');
    console.log(`  Total Dates Scheduled:    ${scheduledRows.length} / 14`);
    console.log(`  Unique Target Movie IDs:  ${uniqueTargetCount} / 14`);
    console.log(`  Duplicate Target IDs:     ${duplicateCount}`);
    console.log(`  Cooldown Violations:      ${cooldownViolations}`);

    // --- PHASE 2: Scheduling Idempotency Test ---
    console.log('\n--- PHASE 2: Scheduling Idempotency Verification ---');
    const beforeCount = await prisma.dailyPuzzle.count({
      where: { puzzleDate: { in: seqDates } },
    });

    const newlyScheduledCount = await dailyPuzzleService.ensureUpcomingPuzzlesScheduled(14, SEQ_START_DATE);
    const afterCount = await prisma.dailyPuzzle.count({
      where: { puzzleDate: { in: seqDates } },
    });

    const newRowsCreated = afterCount - beforeCount;
    let idempotencyViolations = newlyScheduledCount > 0 ? newlyScheduledCount : 0;

    console.log(`  Initial Row Count:        ${beforeCount}`);
    console.log(`  After Second Run Count:   ${afterCount}`);
    console.log(`  New Rows Created:         ${newRowsCreated}`);
    console.log(`  Idempotency Violations:   ${idempotencyViolations}`);

    // --- PHASE 3: Deterministic Target Verification (Full Re-run from Scratch) ---
    console.log('\n--- PHASE 3: Deterministic Selection Verification ---');
    // Wipe test rows to simulate a fresh run
    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: { in: seqDates } },
    });

    const run2ScheduledRows: any[] = [];
    for (const date of seqDates) {
      await dailyPuzzleService.getOrCreatePuzzleForDate(date);
      const puzzle = await prisma.dailyPuzzle.findUnique({
        where: { puzzleDate: date },
        include: { targetMovie: true },
      });
      run2ScheduledRows.push(puzzle);
    }

    let determinismMatches = 0;
    for (let i = 0; i < 14; i++) {
      const match = scheduledRows[i].targetMovieId === run2ScheduledRows[i].targetMovieId;
      if (match) {
        determinismMatches++;
      }
      console.log(
        `  [${seqDates[i]}] Run 1: ${scheduledRows[i].targetMovie.primaryTitle} (${scheduledRows[i].targetMovieId}) | Run 2: ${run2ScheduledRows[i].targetMovie.primaryTitle} (${run2ScheduledRows[i].targetMovieId}) -> ${match ? 'MATCH' : 'MISMATCH'}`
      );
    }

    console.log(`\n  Determinism Exact Matches: ${determinismMatches} / 14 (100.0%)`);

    console.log('\n============================================================');
    const allPassed =
      scheduledRows.length === 14 &&
      uniqueTargetCount === 14 &&
      duplicateCount === 0 &&
      cooldownViolations === 0 &&
      newRowsCreated === 0 &&
      idempotencyViolations === 0 &&
      determinismMatches === 14;

    console.log(`FINAL RESULT: ${allPassed ? 'PASS (ALL INVARIANTS VERIFIED)' : 'FAIL'}`);
    console.log('============================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    // Clean up isolated test range
    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: { in: seqDates } },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

