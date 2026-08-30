import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(_req: NextRequest) {
  try {
    const scheduled = await adminService.getScheduledPuzzles();
    return NextResponse.json({ scheduled });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
