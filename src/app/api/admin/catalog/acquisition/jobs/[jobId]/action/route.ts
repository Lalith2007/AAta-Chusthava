import { NextRequest, NextResponse } from 'next/server';
import { catalogAcquisitionService } from '@/modules/acquisition/catalog-acquisition-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const { jobId } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, payloadContent, dryRun, batchSize } = body;

    const job = await catalogAcquisitionService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: { message: 'Job not found', code: 'NOT_FOUND' } }, { status: 404 });
    }

    if (action === 'pause') {
      const paused = await catalogAcquisitionService.pauseJob(jobId);
      return NextResponse.json({ success: true, job: paused });
    }

    if (action === 'run' || action === 'resume' || action === 'retry') {
      if (!payloadContent) {
        return NextResponse.json(
          { error: { message: "Action requires 'payloadContent' to process data", code: 'INVALID_INPUT' } },
          { status: 400 }
        );
      }

      const outcome = await catalogAcquisitionService.runImportJob(jobId, payloadContent, {
        dryRun: Boolean(dryRun),
        batchSize: batchSize ? parseInt(batchSize, 10) : undefined,
      });

      return NextResponse.json({ success: true, outcome });
    }

    return NextResponse.json(
      { error: { message: `Unsupported action '${action}'. Use 'run', 'pause', 'resume', or 'retry'`, code: 'INVALID_INPUT' } },
      { status: 400 }
    );
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

