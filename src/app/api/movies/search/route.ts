import { NextRequest, NextResponse } from 'next/server';
import { movieRepository } from '@/modules/movies/movie-repository';
import { formatErrorResponse } from '@/domain/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const mode = searchParams.get('mode') || 'guess'; // 'guess' or 'target'
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 15;

    const results = await movieRepository.search(query, {
      playableAsGuessOnly: mode === 'guess',
      playableAsTargetOnly: mode === 'target',
      limit,
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (err: unknown) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
