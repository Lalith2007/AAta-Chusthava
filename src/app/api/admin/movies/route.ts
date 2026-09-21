import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const movies = await prisma.movie.findMany({
      where: q
        ? {
            OR: [
              { primaryTitle: { contains: q, mode: 'insensitive' } },
              { originalTitle: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      include: {
        eligibility: true,
        people: {
          include: { person: true },
          take: 3,
        },
      },
      orderBy: { releaseYear: 'desc' },
      take: limit,
    });

    return NextResponse.json({ movies });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

