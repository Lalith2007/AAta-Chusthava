import { NextRequest, NextResponse } from 'next/server';
import { dailyPuzzleService } from '@/modules/daily/daily-puzzle-service';
import { challengeService } from '@/modules/challenges/challenge-service';
import { getPlayerIdentifier, PLAYER_ID_COOKIE } from '@/lib/player-session';
import { formatErrorResponse, AppError } from '@/domain/errors';
import { z } from 'zod';

const StartGameSchema = z.object({
  mode: z.enum(['DAILY', 'CHALLENGE', 'ARCHIVE']),
  date: z.string().optional(),
  publicCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartGameSchema.parse(body);
    const player = getPlayerIdentifier(req);

    let sessionState;

    if (parsed.mode === 'DAILY' || parsed.mode === 'ARCHIVE') {
      sessionState = await dailyPuzzleService.getDailySession(parsed.date, player);
    } else if (parsed.mode === 'CHALLENGE') {
      if (!parsed.publicCode) {
        throw new AppError('VALIDATION_ERROR', 'Challenge code is required for challenge mode.', 400);
      }
      sessionState = await challengeService.getChallengeSession(parsed.publicCode, player);
    } else {
      throw new AppError('VALIDATION_ERROR', 'Unsupported game mode.', 400);
    }

    const response = NextResponse.json(sessionState);
    response.cookies.set(PLAYER_ID_COOKIE, player.anonymousPlayerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
