import { NextRequest, NextResponse } from 'next/server';
import { challengeService } from '@/modules/challenges/challenge-service';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const CreateChallengeSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
  creatorName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateChallengeSchema.parse(body);

    const challenge = await challengeService.createChallenge(
      parsed.movieId,
      parsed.creatorName
    );

    return NextResponse.json(challenge);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
