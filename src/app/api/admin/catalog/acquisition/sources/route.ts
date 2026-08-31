import { NextResponse } from 'next/server';
import { AcquisitionSourceRegistry } from '@/infrastructure/external-sources/acquisition-source';

export async function GET() {
  try {
    const registry = AcquisitionSourceRegistry.getInstance();
    const sources = registry.getRegisteredSources();

    return NextResponse.json({
      success: true,
      sources,
      supportedFormats: ['CSV', 'JSON', 'NDJSON', 'API', 'BULK_FILE'],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch acquisition sources' },
      { status: 500 }
    );
  }
}
