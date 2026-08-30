import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const archives = await dailyPuzzleService.getArchivePuzzles(limit);
    return NextResponse.json({
      archives,
      count: archives.length,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
