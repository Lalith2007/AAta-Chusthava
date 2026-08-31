import { NextRequest, NextResponse } from 'next/server';
import { ingestionService } from '@/modules/ingestion/ingestion-service';

export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('API Error in /api/admin/catalog/expand-historical:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to execute historical catalog expansion',
      },
      { status: 500 }
    );
  }
}
