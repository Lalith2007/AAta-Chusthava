import { NextRequest, NextResponse } from 'next/server';
import { gameEngine } from '@/modules/games/game-engine';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const GuessSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
  clientRequestId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body = await req.json();
    const parsed = GuessSchema.parse(body);

    const result = await gameEngine.submitGuess(sessionId, parsed);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
