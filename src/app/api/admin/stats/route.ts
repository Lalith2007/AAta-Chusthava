import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(_req: NextRequest) {
  try {
    const stats = await adminService.getSystemOverview();
    return NextResponse.json(stats);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
