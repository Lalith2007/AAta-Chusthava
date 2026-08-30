import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { formatErrorResponse, AppError } from '@/domain/errors';

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string; hintId: string }> }
) {
  try {
    const { sessionId, hintId } = await context.params;

    const hint = await prisma.sessionHint.findFirst({
      where: { id: hintId, sessionId },
    });

    if (!hint) {
      throw new AppError('HINT_NOT_AVAILABLE', 'Hint not found for this session.', 404);
    }

    const updated = await prisma.sessionHint.update({
      where: { id: hint.id },
      data: { revealedAt: new Date() },
    });

    return NextResponse.json({
      id: updated.id,
      hintType: updated.hintType,
      hintContent: updated.hintContent,
      revealedAt: updated.revealedAt?.toISOString(),
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
