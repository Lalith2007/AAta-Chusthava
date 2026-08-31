import { NextRequest, NextResponse } from 'next/server';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const source = (body.source || 'WIKIDATA').toUpperCase();
    const startYear = body.startYear ? Number(body.startYear) : 2002;
    const endYear = body.endYear ? Number(body.endYear) : 2026;

    const ingestionSummary = await ingestionService.runSecondaryHistoricalIngestion(
      source,
      startYear,
      endYear
    );

    const updatedReport = await catalogCoverageService.getCoverageReport();

    return NextResponse.json({
      success: true,
      data: {
        summary: ingestionSummary,
        coverageReport: updatedReport,
      },
    });
  } catch (error: unknown) {
    console.error('Secondary discovery API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to run secondary discovery';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
