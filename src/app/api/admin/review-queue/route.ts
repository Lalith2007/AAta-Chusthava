import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const queue = await adminService.getReviewQueue();
    return NextResponse.json(queue);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

