import { NextRequest, NextResponse } from 'next/server';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(_req: NextRequest) {
  try {
    const report = await catalogCoverageService.getCoverageReport();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
