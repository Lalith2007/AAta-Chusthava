import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const MovieReviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RETURN_TO_REVIEW', 'ENRICH']),
  reason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ movieId: string }> }
) {
  try {
    await requireAdminAuth(req);
    const { movieId } = await context.params;
    const detail = await adminService.getReviewDetail(movieId);
    return NextResponse.json(detail);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ movieId: string }> }
) {
  try {
    const admin = await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const { movieId } = await context.params;
    const body = await req.json();
    const { action, reason } = MovieReviewActionSchema.parse(body);

    let result;
    if (action === 'APPROVE') {
      result = await adminService.approveMovie(movieId, admin.id, reason);
    } else if (action === 'REJECT') {
      result = await adminService.rejectMovie(movieId, reason, admin.id);
    } else if (action === 'RETURN_TO_REVIEW') {
      result = await adminService.returnMovieToReview(movieId, reason, admin.id);
    } else if (action === 'ENRICH') {
      result = await adminService.enrichSingleMovie(movieId, admin.id);
    }

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
