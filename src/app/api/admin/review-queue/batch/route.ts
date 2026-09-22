import { NextRequest, NextResponse } from 'next/server';
import { catalogReviewService } from '@/modules/admin/catalog-review-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const BatchReviewSchema = z.object({
  action: z.enum(['RECALCULATE_PLAYABILITY', 'AUTO_APPROVE_COMPLETE']),
  dryRun: z.boolean().default(true),
  limit: z.number().min(1).max(100).default(20),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ['SUPER_ADMIN']);
    const body = await req.json();
    const { dryRun, limit } = BatchReviewSchema.parse(body);

    const report = await catalogReviewService.batchProcessEligibleMovies({
      dryRun,
      limit,
      actorId: admin.id,
    });

    return NextResponse.json(report);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
