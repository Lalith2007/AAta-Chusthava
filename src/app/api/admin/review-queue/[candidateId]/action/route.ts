import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { formatErrorResponse } from '@/domain/errors';
import { z } from 'zod';

const ActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RETRY']),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await context.params;
    const body = await req.json();
    const { action, reason } = ActionSchema.parse(body);

    let result;
    if (action === 'APPROVE' || action === 'RETRY') {
      result = await adminService.approveCandidate(candidateId);
    } else if (action === 'REJECT') {
      result = await adminService.rejectCandidate(candidateId, reason || 'Rejected by admin');
    }

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
