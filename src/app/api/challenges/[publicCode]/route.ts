import { NextRequest, NextResponse } from 'next/server';
import { challengeService } from '@/modules/challenges/challenge-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ publicCode: string }> }
) {
  try {
    const { publicCode } = await context.params;
    const meta = await challengeService.getChallengeMeta(publicCode);
    return NextResponse.json(meta);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
