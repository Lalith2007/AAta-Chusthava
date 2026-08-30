import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { adminService } from '@/modules/admin/admin-service';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const ScheduleSchema = z.object({
  daysAhead: z.number().min(1).max(30).optional().default(7),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { daysAhead } = ScheduleSchema.parse(body);

    const count = await dailyPuzzleService.ensureUpcomingPuzzlesScheduled(daysAhead);
    await adminService.logAudit(
      'admin',
      'SCHEDULE_FUTURE_PUZZLES',
      'DailyPuzzle',
      'batch',
      null,
      { count, daysAhead }
    );

    return NextResponse.json({ success: true, scheduledCount: count });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
