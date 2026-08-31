import { NextRequest, NextResponse } from 'next/server';
import { catalogAcquisitionService } from '@/modules/acquisition/catalog-acquisition-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const sourceCode = searchParams.get('sourceCode') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const jobs = await catalogAcquisitionService.getImportJobs({ status, sourceCode, limit });
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch import jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, sourceType, format, inputReference, payloadContent, runImmediately, dryRun } =
      body;

    if (!sourceCode || !inputReference) {
      return NextResponse.json(
        { success: false, error: "Missing required fields 'sourceCode' and 'inputReference'" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create import job' },
      { status: 500 }
    );
  }
}
