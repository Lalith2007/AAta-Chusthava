import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/client';

export async function GET() {
  try {
    const checkpoints = await prisma.discoveryCheckpoint.findMany({
      orderBy: [{ year: 'asc' }, { source: 'asc' }, { language: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: checkpoints,
    });
  } catch (error: any) {
    console.error('API Error in /api/admin/catalog/checkpoints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch discovery checkpoints',
      },
      { status: 500 }
    );
  }
}
