import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const MergeDuplicateSchema = z.object({
  duplicateMovieId: z.string().min(1),
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
    return NextResponse.json({
      primaryMovie: detail.movie,
      suspectedDuplicates: detail.suspectedDuplicates,
    });
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
    const { movieId: primaryMovieId } = await context.params;
    const body = await req.json();
    const { duplicateMovieId, reason } = MergeDuplicateSchema.parse(body);

    const result = await adminService.mergeMovies(
      primaryMovieId,
      duplicateMovieId,
      admin.id,
      reason || 'Duplicate curation merge from review queue'
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
