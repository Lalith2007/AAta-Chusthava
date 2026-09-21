import { NextRequest, NextResponse } from 'next/server';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const body = await req.json();
    const { source, sourceMovieId, reason } = body;

    if (!source || !sourceMovieId) {
      return NextResponse.json(
        { error: { message: 'source and sourceMovieId are required', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    const result = await ingestionService.discoverAndIngestMissingCandidate(
      source,
      String(sourceMovieId),
      reason || 'Admin Manual Ingestion'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

