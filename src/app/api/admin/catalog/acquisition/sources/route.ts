import { NextRequest, NextResponse } from 'next/server';
import { AcquisitionSourceRegistry } from '@/infrastructure/external-sources/acquisition-source';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const registry = AcquisitionSourceRegistry.getInstance();
    const sources = registry.getRegisteredSources();

    return NextResponse.json({
      success: true,
      sources,
      supportedFormats: ['CSV', 'JSON', 'NDJSON', 'API', 'BULK_FILE'],
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

