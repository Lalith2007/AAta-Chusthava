import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@/modules/games/game-engine';
import { movieRepository } from '@/modules/movies/movie-repository';
import { prisma } from '@/infrastructure/db/client';
import { formatErrorResponse, AppError } from '@/domain/errors';

function generateSpoilerSafeShareText(
  mode: string,
  attemptsUsed: number,
  maxAttempts: number,
  isWon: boolean,
  guesses: any[]
): string {
  const modeTitle =
    mode === 'DAILY'
      ? 'Daily AAta Chusthava'
      : mode === 'CHALLENGE'
      ? 'Friend Challenge AAta Chusthava'
      : 'AAta Chusthava';

  const scoreText = isWon ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`;
  let matrix = '';

  for (const g of guesses) {
    const clues = (g.evaluation?.clues || {}) as Record<string, any>;
    let row = '';
    for (const key of Object.keys(clues)) {
      const status = clues[key]?.status;
      if (status === 'EXACT') row += '🟩';
      else if (status === 'CLOSE') row += '🟨';
      else if (status === 'PARTIAL') row += '🟧';
      else if (status === 'UNAVAILABLE') row += '⬜';
      else row += '⬛';
    }
    matrix += `${row}\n`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aatachusthava.com';
  return `🎬 ${modeTitle} ${scoreText}\n\n${matrix}\nPlay at: ${appUrl}`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        game: {
          include: {
            ruleset: true,
            dailyPuzzle: true,
            challenge: true,
          },
        },
        guesses: { orderBy: { attemptNumber: 'asc' } },
      },
    });

    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Game session not found.', 404);
    }

    const isCompleted = session.status === 'WON' || session.status === 'LOST';
    if (!isCompleted) {
      throw new AppError(
        'FORBIDDEN',
        'Game result is only available after completing the game.',
        403
      );
    }

    const targetMovie = await movieRepository.findById(session.game.targetMovieId);
    if (!targetMovie) {
      throw new AppError('INTERNAL_ERROR', 'Target movie not found.', 500);
    }

    const shareText = generateSpoilerSafeShareText(
      session.game.mode,
      session.attemptsUsed,
      session.game.maxAttempts,
      session.status === 'WON',
      session.guesses
    );

    return NextResponse.json({
      sessionId: session.id,
      gameId: session.gameId,
      mode: session.game.mode,
      status: session.status,
      isWon: session.status === 'WON',
      attemptsUsed: session.attemptsUsed,
      maxAttempts: session.game.maxAttempts,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      target: GameEngine.formatRevealedTarget(targetMovie),
      shareText,
      puzzleDate: session.game.dailyPuzzle?.puzzleDate,
      challengeCode: session.game.challenge?.publicCode,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
