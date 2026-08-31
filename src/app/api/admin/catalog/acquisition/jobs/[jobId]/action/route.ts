import { NextRequest, NextResponse } from 'next/server';
import { catalogAcquisitionService } from '@/modules/acquisition/catalog-acquisition-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, payloadContent, dryRun, batchSize } = body;

    const job = await catalogAcquisitionService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (action === 'pause') {
      const paused = await catalogAcquisitionService.pauseJob(jobId);
      return NextResponse.json({ success: true, job: paused });
    }

    if (action === 'run' || action === 'resume' || action === 'retry') {
      if (!payloadContent) {
        return NextResponse.json(
          { success: false, error: "Action requires 'payloadContent' to process data" },
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
      { success: false, error: `Unsupported action '${action}'. Use 'run', 'pause', 'resume', or 'retry'` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to perform job action' },
      { status: 500 }
    );
  }
}
