import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin/admin-service';
import { requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const language = searchParams.get('language') || undefined;
    const yearStr = searchParams.get('year');
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const reason = searchParams.get('reason') || undefined;
    const playableStatus = (searchParams.get('playableStatus') as any) || undefined;
    const hasPosterParam = searchParams.get('hasPoster');
    const hasPoster = hasPosterParam !== null ? hasPosterParam === 'true' : undefined;
    const hasTmdbIdParam = searchParams.get('hasTmdbId');
    const hasTmdbId = hasTmdbIdParam !== null ? hasTmdbIdParam === 'true' : undefined;
    const recoveryClass = (searchParams.get('recoveryClass') as any) || undefined;
    const sort = (searchParams.get('sort') as any) || 'newest';
    const pageStr = searchParams.get('page');
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const queue = await adminService.getReviewQueue({
      search,
      language,
      year,
      reason,
      playableStatus,
      hasPoster,
      hasTmdbId,
      recoveryClass,
      sort,
      page,
      limit,
    });

    return NextResponse.json(queue);
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}


