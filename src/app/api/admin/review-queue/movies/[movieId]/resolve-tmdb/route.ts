import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const ResolveTmdbSchema = z.object({
  dryRun: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ movieId: string }> }
) {
  try {
    const admin = await requireAdminAuth(req, ['SUPER_ADMIN', 'EDITOR']);
    const { movieId } = await context.params;
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }
    const { dryRun } = ResolveTmdbSchema.parse(body);

    const result = await adminService.resolveTmdbIdentity(movieId, {
      dryRun: dryRun !== false, // default to dryRun = true for safety
      actorId: admin.id,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
