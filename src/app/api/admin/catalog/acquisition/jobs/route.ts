import { NextRequest, NextResponse } from 'next/server';
import { catalogAcquisitionService } from '@/modules/acquisition/catalog-acquisition-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const sourceCode = searchParams.get('sourceCode') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const jobs = await catalogAcquisitionService.getImportJobs({ status, sourceCode, limit });
    return NextResponse.json({ success: true, jobs });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const body = await req.json();
    const { sourceCode, sourceType, format, inputReference, payloadContent, runImmediately, dryRun } =
      body;

    if (!sourceCode || !inputReference) {
      return NextResponse.json(
        { error: { message: "Missing required fields 'sourceCode' and 'inputReference'", code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    const job = await catalogAcquisitionService.createImportJob({
      sourceCode,
      sourceType: sourceType || 'CSV',
      format: format || 'CSV',
      inputReference,
    });

    if (runImmediately && payloadContent) {
      const outcome = await catalogAcquisitionService.runImportJob(job.id, payloadContent, {
        dryRun: Boolean(dryRun),
      });
      return NextResponse.json({ success: true, job, outcome });
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

