import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { adminService } from '@/modules/admin/admin-service';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const OverrideSchema = z.object({
  puzzleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  movieId: z.string().min(1, 'movieId is required'),
  overrideReason: z.string().min(3, 'overrideReason must be at least 3 characters'),
  adminId: z.string().optional().default('super-admin'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = OverrideSchema.parse(body);

    const result = await dailyPuzzleService.overrideDailyTarget(parsed);

    await adminService.logAudit(
      parsed.adminId,
      'OVERRIDE_DAILY_PUZZLE_TARGET',
      'DailyPuzzle',
      parsed.puzzleDate,
      null,
      {
        puzzleDate: parsed.puzzleDate,
        movieId: parsed.movieId,
        movieTitle: result.movie.primaryTitle,
        reason: parsed.overrideReason,
      },
      parsed.overrideReason
    );

    return NextResponse.json({
      success: true,
      puzzle: result,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
