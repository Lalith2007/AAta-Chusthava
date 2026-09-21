import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const checkpoints = await prisma.discoveryCheckpoint.findMany({
      orderBy: [{ year: 'asc' }, { source: 'asc' }, { language: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: checkpoints,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

