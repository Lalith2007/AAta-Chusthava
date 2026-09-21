import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || undefined;
    const preview = await dailyPuzzleService.previewDailyTarget(dateParam);
    return NextResponse.json({ preview });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
