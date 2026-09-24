import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { mediaIdentityValidator } from '@/modules/enrichment/media-identity-validator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const search = searchParams.get('search') || undefined;
    const playerVisibleOnly = searchParams.get('playerVisibleOnly') !== 'false';
    const roleFilter = searchParams.get('role') as 'LEAD' | 'DIRECTOR' | 'SUPPORTING' | undefined;

    const baseWhere: any = {
      OR: [{ image: null }, { image: '' }, { image: 'null' }, { image: 'undefined' }],
    };

    if (search) {
      baseWhere.canonicalName = { contains: search, mode: 'insensitive' };
    }

    if (playerVisibleOnly) {
      const allowedRoles = roleFilter ? [roleFilter] : ['LEAD', 'DIRECTOR', 'SUPPORTING'];
      baseWhere.movies = {
        some: {
          roleType: { in: allowedRoles },
          movie: {
            lifecycleStatus: 'ACTIVE',
            eligibility: { playableAsTarget: true },
          },
        },
      };
    } else if (roleFilter) {
      baseWhere.movies = {
        some: {
          roleType: roleFilter,
          movie: { lifecycleStatus: 'ACTIVE' },
        },
      };
    } else {
      baseWhere.movies = {
        some: {
          movie: { lifecycleStatus: 'ACTIVE' },
        },
      };
    }

    const total = await prisma.person.count({ where: baseWhere });
    const playerVisibleTotal = await prisma.person.count({
      where: {
        OR: [{ image: null }, { image: '' }, { image: 'null' }, { image: 'undefined' }],
        movies: {
          some: {
            roleType: { in: ['LEAD', 'DIRECTOR', 'SUPPORTING'] },
            movie: {
              lifecycleStatus: 'ACTIVE',
              eligibility: { playableAsTarget: true },
            },
          },
        },
      },
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const persons = await prisma.person.findMany({
      where: baseWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ tmdbId: { sort: 'desc', nulls: 'last' } }, { canonicalName: 'asc' }],
      include: {
        movies: {
          take: 5,
          where: {
            movie: { lifecycleStatus: 'ACTIVE' },
          },
          include: {
            movie: {
              select: { primaryTitle: true, releaseYear: true, eligibility: { select: { playableAsTarget: true } } },
            },
          },
        },
      },
    });

    const items = persons.map((p) => {
      const targetMovie = p.movies.find((m) => m.movie.eligibility?.playableAsTarget) || p.movies[0];
      const associatedMovieTitle = targetMovie?.movie.primaryTitle || null;
      const associatedMovieYear = targetMovie?.movie.releaseYear || null;
      const primaryRole = targetMovie?.roleType || 'LEAD';

      const associatedMovies = p.movies.map(
        (m) => `${m.movie.primaryTitle} (${m.movie.releaseYear}) [${m.roleType}]`
      );

      const googleSearchUrl = mediaIdentityValidator.buildPersonGoogleSearchUrl(p.canonicalName, {
        associatedMovie: associatedMovieTitle || undefined,
        movieYear: associatedMovieYear || undefined,
        role: primaryRole,
      });

      return {
        id: p.id,
        name: p.canonicalName,
        role: primaryRole,
        tmdbId: p.tmdbId,
        currentImage: p.image,
        associatedMovieTitle,
        associatedMovieYear,
        associatedMovies,
        googleSearchUrl,
        candidateSource: p.tmdbId ? 'TMDB_PENDING_REVIEW' : 'GOOGLE_SEARCH_PENDING',
        confidence: p.tmdbId ? 'MEDIUM' : 'LOW',
        matchEvidence: {
          nameMatch: 'EXACT',
          movieCorroboration: associatedMovieTitle ? 'MATCH' : 'UNKNOWN',
          tmdbIdPresent: Boolean(p.tmdbId),
        },
      };
    });

    return NextResponse.json({
      items,
      total,
      playerVisibleTotal,
      page,
      pageSize,
      totalPages,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch person review queue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, personId, imageUrl, adminId = 'ADMIN', reason } = body;

    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 });
    }

    if (action === 'approve' || action === 'submitManual') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
      }

      const check = mediaIdentityValidator.validateImageUrl(imageUrl);
      if (!check.isValid || !check.normalizedUrl) {
        return NextResponse.json(
          { error: `Invalid image URL: ${check.reason || 'Validation failed'}` },
          { status: 400 }
        );
      }

      const person = await prisma.person.findUnique({
        where: { id: personId },
        select: { id: true, canonicalName: true, image: true },
      });

      if (!person) {
        return NextResponse.json({ error: 'Person not found' }, { status: 404 });
      }

      await prisma.person.update({
        where: { id: personId },
        data: { image: check.normalizedUrl },
      });

      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'ADMIN',
          action: 'PERSON_IMAGE_ASSIGNED',
          entityType: 'Person',
          entityId: personId,
          before: { image: person.image },
          after: { image: check.normalizedUrl, source: 'ADMIN_MANUAL_VERIFIED' },
          reason: `Admin verified profile image for ${person.canonicalName}`,
        },
      });

      return NextResponse.json({ success: true, normalizedUrl: check.normalizedUrl });
    }

    if (action === 'reject') {
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'ADMIN',
          action: 'PERSON_IMAGE_REJECTED',
          entityType: 'Person',
          entityId: personId,
          reason: reason || 'Candidate profile image rejected by admin',
        },
      });

      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process person review action' },
      { status: 500 }
    );
  }
}
