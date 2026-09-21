import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { DailyPuzzleSelector } from '../daily-puzzle-selector';
import { dailyPuzzleService } from '../daily-puzzle-service';
import { authenticateAdmin, requireAdminAuth } from '@/infrastructure/auth/admin-auth';
import { GET as previewHandler } from '@/app/api/admin/puzzles/preview/route';
import { POST as overrideHandler } from '@/app/api/admin/puzzles/override/route';
import { POST as scheduleHandler } from '@/app/api/admin/puzzles/schedule/route';
import { GET as listHandler } from '@/app/api/admin/puzzles/route';
import { AppError } from '@/domain/errors';

describe('PR #22 Security Hardening: Admin Authorization & Secret Management', () => {
  const TEST_DATE = '2035-11-12';
  const TEST_SECRET = 'test-security-secret-key-12345';
  const VALID_ADMIN_SECRET = 'aata_chusthava_admin_secret_key_2026';

  beforeEach(async () => {
    process.env.ADMIN_API_SECRET = VALID_ADMIN_SECRET;
    process.env.DAILY_PUZZLE_SECRET = TEST_SECRET;

    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: TEST_DATE },
    });
    await prisma.auditLog.deleteMany({
      where: { entityId: TEST_DATE },
    });
  });

  afterEach(async () => {
    await prisma.dailyPuzzle.deleteMany({
      where: { puzzleDate: TEST_DATE },
    });
    await prisma.auditLog.deleteMany({
      where: { entityId: TEST_DATE },
    });
  });

  // BLOCKER 1: ADMIN API AUTHORIZATION TESTS
  describe('Blocker 1 — Admin API Authorization & Target Protection', () => {
    it('A. rejects unauthenticated admin preview with 401 UNAUTHORIZED without leaking target data', async () => {
      const unauthReq = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`);
      const res = await previewHandler(unauthReq);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.preview).toBeUndefined();
    });

    it('B. rejects unauthenticated admin override with 401 UNAUTHORIZED', async () => {
      const unauthReq = new NextRequest('http://localhost:3000/api/admin/puzzles/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          puzzleDate: TEST_DATE,
          movieId: 'some-movie-id',
          overrideReason: 'Unauthorized attempt',
        }),
      });

      const res = await overrideHandler(unauthReq);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.puzzle).toBeUndefined();
    });

    it('C. rejects non-admin caller with 403 FORBIDDEN when insufficient permissions', async () => {
      // Create a test user with MODERATOR role
      const modUser = await prisma.adminUser.upsert({
        where: { username: 'test-moderator' },
        create: {
          username: 'test-moderator',
          email: 'mod@aatachusthava.com',
          passwordHash: 'hashed_pw',
          role: 'MODERATOR',
        },
        update: { role: 'MODERATOR' },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/puzzles/override', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${modUser.id}`,
        },
        body: JSON.stringify({
          puzzleDate: TEST_DATE,
          movieId: 'some-movie-id',
          overrideReason: 'Moderator attempt',
        }),
      });

      const res = await overrideHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('D. accepts authenticated administrator with valid Bearer secret or header', async () => {
      const authReq = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: {
          authorization: `Bearer ${VALID_ADMIN_SECRET}`,
        },
      });

      const res = await previewHandler(authReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.preview).toBeDefined();
      expect(data.preview.puzzleDate).toBe(TEST_DATE);
    });

    it('E. ignores caller-supplied adminId in request body and derives actor from authenticated identity', async () => {
      const activeMovie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });
      expect(activeMovie).not.toBeNull();

      const spoofingReq = new NextRequest('http://localhost:3000/api/admin/puzzles/override', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${VALID_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          puzzleDate: TEST_DATE,
          movieId: activeMovie!.id,
          overrideReason: 'Valid override with attempted spoofing',
          adminId: 'spoofed-fake-admin-id', // Attacker trying to spoof actor
        }),
      });

      const res = await overrideHandler(spoofingReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify the actor ID in override metadata is derived from authenticated context ('super-admin-root'), NOT the spoofed payload
      expect(data.puzzle.selectionMetadata.overriddenBy).toBe('super-admin-root');
      expect(data.puzzle.selectionMetadata.overriddenBy).not.toBe('spoofed-fake-admin-id');
    });

    it('F. writes audit log using authenticated actor ID and actor role', async () => {
      const activeMovie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/puzzles/override', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${VALID_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          puzzleDate: TEST_DATE,
          movieId: activeMovie!.id,
          overrideReason: 'Audit Log Verification',
        }),
      });

      await overrideHandler(req);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'OVERRIDE_DAILY_PUZZLE_TARGET',
          entityId: TEST_DATE,
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.actorId).toBe('super-admin-root');
      expect(auditLog!.actorRole).toBe('SUPER_ADMIN');
    });

    it('protects admin puzzle schedule and puzzle list endpoints against unauthenticated access', async () => {
      const unauthScheduleReq = new NextRequest('http://localhost:3000/api/admin/puzzles/schedule', {
        method: 'POST',
        body: JSON.stringify({ daysAhead: 3 }),
      });
      const scheduleRes = await scheduleHandler(unauthScheduleReq);
      expect(scheduleRes.status).toBe(401);

      const unauthListReq = new NextRequest('http://localhost:3000/api/admin/puzzles');
      const listRes = await listHandler(unauthListReq);
      expect(listRes.status).toBe(401);
    });
  });

  // BLOCKER 2: SECRET MANAGEMENT & INJECTION TESTS
  describe('Blocker 2 — Daily Puzzle Secret Validation & Determinism', () => {
    it('G. fails clearly with fatal error if DAILY_PUZZLE_SECRET is missing in production mode', () => {
      const oldEnv = process.env.NODE_ENV;
      const oldSecret = process.env.DAILY_PUZZLE_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.DAILY_PUZZLE_SECRET;

        expect(() => new DailyPuzzleSelector()).toThrow(/FATAL: Missing required environment variable DAILY_PUZZLE_SECRET/);
      } finally {
        process.env.NODE_ENV = oldEnv;
        process.env.DAILY_PUZZLE_SECRET = oldSecret;
      }
    });

    it('H. supports explicit dependency injection of secret in constructor for test isolation', async () => {
      const customSecret = 'custom-injected-test-secret-999';
      const selector = new DailyPuzzleSelector(customSecret);

      const result1 = await selector.selectDailyTarget(TEST_DATE);
      const result2 = await selector.selectDailyTarget(TEST_DATE);

      expect(result1.selectedMovieId).toBe(result2.selectedMovieId);
      expect(result1.metadata.deterministicPriority).toBe(result2.metadata.deterministicPriority);
    });

    it('I. verifies secret never leaks into response payloads, selection metadata, or client sessions', async () => {
      const selector = new DailyPuzzleSelector(TEST_SECRET);
      const result = await selector.selectDailyTarget(TEST_DATE);

      const serializedMeta = JSON.stringify(result.metadata);
      expect(serializedMeta).not.toContain(TEST_SECRET);
      expect(serializedMeta).not.toContain(VALID_ADMIN_SECRET);

      const preview = await dailyPuzzleService.previewDailyTarget(TEST_DATE);
      const serializedPreview = JSON.stringify(preview);
      expect(serializedPreview).not.toContain(TEST_SECRET);
      expect(serializedPreview).not.toContain(VALID_ADMIN_SECRET);
    });

    it('J. verifies public Daily Game session remains 100% target-secret-safe', async () => {
      const sessionState = await dailyPuzzleService.getDailySession(TEST_DATE, {
        anonymousPlayerId: 'public-player-security-audit',
      });

      expect(sessionState.revealedTarget).toBeNull();
      expect(sessionState.isCompleted).toBe(false);
      expect((sessionState as any).targetMovieId).toBeUndefined();
      expect((sessionState as any).targetMovie).toBeUndefined();
    });
  });
});
