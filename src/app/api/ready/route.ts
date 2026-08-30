import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';

export async function GET() {
  try {
    // Check PostgreSQL connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: 'not_ready',
        database: 'disconnected',
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
