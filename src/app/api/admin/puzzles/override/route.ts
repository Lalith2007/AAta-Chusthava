import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const OverrideSchema = z.object({
  puzzleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  movieId: z.string().min(1, 'movieId is required'),
  overrideReason: z.string().min(3, 'overrideReason must be at least 3 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const body = await req.json().catch(() => ({}));
    const parsed = OverrideSchema.parse(body);

    const result = await dailyPuzzleService.overrideDailyTarget({
      puzzleDate: parsed.puzzleDate,
      movieId: parsed.movieId,
      overrideReason: parsed.overrideReason,
      adminId: admin.id,
    });

    await adminService.logAudit(
      admin.id,
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
      parsed.overrideReason,
      admin.role
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

