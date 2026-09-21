import { NextRequest, NextResponse } from 'next/server';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
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
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

