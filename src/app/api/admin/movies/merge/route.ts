import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const MergeSchema = z.object({
  primaryMovieId: z.string().min(1),
  duplicateMovieId: z.string().min(1),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { primaryMovieId, duplicateMovieId, reason } = MergeSchema.parse(body);

    const result = await adminService.mergeMovies(
      primaryMovieId,
      duplicateMovieId,
      'admin',
      reason
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
