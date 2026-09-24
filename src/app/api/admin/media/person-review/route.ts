import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { mediaIdentityValidator } from '@/modules/enrichment/media-identity-validator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);
    const search = searchParams.get('search') || undefined;
    const targetOnly = searchParams.get('targetOnly') === 'true';

    const where: any = {
      OR: [{ image: null }, { image: '' }, { image: 'null' }, { image: 'undefined' }],
    };

    if (search) {
      where.canonicalName = { contains: search, mode: 'insensitive' };
    }

    if (targetOnly) {
      where.movies = {
        some: {
          movie: {
            lifecycleStatus: 'ACTIVE',
            eligibility: { playableAsTarget: true },
          },
        },
      };
    } else {
      where.movies = {
        some: {
          movie: { lifecycleStatus: 'ACTIVE' },
        },
      };
    }

    const total = await prisma.person.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const persons = await prisma.person.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { canonicalName: 'asc' },
      include: {
        movies: {
          take: 3,
          include: {
            movie: {
              select: { primaryTitle: true, releaseYear: true },
            },
          },
        },
      },
    });

    const items = persons.map((p) => {
      const associatedMovies = p.movies.map((m) => `${m.movie.primaryTitle} (${m.movie.releaseYear})`);
      const googleSearchUrl = mediaIdentityValidator.buildPersonGoogleSearchUrl(p.canonicalName);

      return {
        id: p.id,
        name: p.canonicalName,
        tmdbId: p.tmdbId,
        currentImage: p.image,
        associatedMovies,
        googleSearchUrl,
        candidateSource: p.tmdbId ? 'TMDB_PENDING_REVIEW' : 'GOOGLE_SEARCH_PENDING',
        confidence: p.tmdbId ? 'MEDIUM' : 'LOW',
      };
    });

    return NextResponse.json({
      items,
      total,
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
