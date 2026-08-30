import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { getPlayerIdentifier, PLAYER_ID_COOKIE } from '@/lib/player-session';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || undefined;
    const player = getPlayerIdentifier(req);

    const sessionState = await dailyPuzzleService.getDailySession(dateParam, player);

    const response = NextResponse.json(sessionState);
    response.cookies.set(PLAYER_ID_COOKIE, player.anonymousPlayerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
