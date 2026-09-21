import { NextRequest, NextResponse } from 'next/server';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const body = await req.json().catch(() => ({}));
    const { startYear, endYear, sources, languages, resume } = body;

    const result = await ingestionService.runHistoricalCatalogExpansion({
      startYear: startYear ? parseInt(startYear, 10) : 2002,
      endYear: endYear ? parseInt(endYear, 10) : 2026,
      sources: Array.isArray(sources) ? sources : ['TMDB', 'WIKIDATA'],
      languages: Array.isArray(languages) ? languages : ['te', 'hi'],
      resume: resume !== undefined ? Boolean(resume) : true,
    });

    return NextResponse.json({
      success: true,
      message: 'Historical catalog expansion completed successfully',
      data: result,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

