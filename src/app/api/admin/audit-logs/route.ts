import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
