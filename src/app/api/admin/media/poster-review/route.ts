import { NextRequest, NextResponse } from 'next/server';
import { posterReviewService } from '@/modules/enrichment/poster-review-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const targetOnly = searchParams.get('targetOnly') === 'true';
    const sortBy = (searchParams.get('sortBy') as any) || undefined;

    const data = await posterReviewService.getPosterReviewQueue({ page, pageSize, search, targetOnly, sortBy });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch poster review queue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, movieId, posterUrl, adminId = 'ADMIN', reason } = body;

    if (!movieId) {
      return NextResponse.json({ error: 'movieId is required' }, { status: 400 });
    }

    if (action === 'discover') {
      const result = await posterReviewService.discoverCandidate(movieId);
      return NextResponse.json(result);
    }

    if (action === 'approve' || action === 'submitManual') {
      if (!posterUrl) {
        return NextResponse.json({ error: 'posterUrl is required' }, { status: 400 });
      }
      const result = await posterReviewService.approvePosterCandidate(movieId, posterUrl, adminId);
      return NextResponse.json(result);
    }

    if (action === 'reject') {
      const result = await posterReviewService.rejectPosterCandidate(movieId, adminId, reason);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process poster review action' },
      { status: 500 }
    );
  }
}
