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
  describe('Blocker 1 — Admin API Authorization & Credential Isolation', () => {
    it('1. ADMIN_API_SECRET via custom header (x-admin-key) -> PASS', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { 'x-admin-key': VALID_ADMIN_SECRET },
      });
      const auth = await authenticateAdmin(req);
      expect(auth.id).toBe('super-admin-root');
      expect(auth.role).toBe('SUPER_ADMIN');

      const res = await previewHandler(req);
      expect(res.status).toBe(200);
    });

    it('2. Bearer ADMIN_API_SECRET -> PASS', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { authorization: `Bearer ${VALID_ADMIN_SECRET}` },
      });
      const auth = await authenticateAdmin(req);
      expect(auth.id).toBe('super-admin-root');
      expect(auth.role).toBe('SUPER_ADMIN');

      const res = await previewHandler(req);
      expect(res.status).toBe(200);
    });

    it('3. Bearer "admin" -> MUST FAIL (401)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { authorization: 'Bearer admin' },
      });
      await expect(authenticateAdmin(req)).rejects.toThrow(AppError);
      const res = await previewHandler(req);
      expect(res.status).toBe(401);
    });

    it('4. Bearer known AdminUser ID -> MUST FAIL (401)', async () => {
      // Create a known admin user in DB
      const adminUser = await prisma.adminUser.upsert({
        where: { username: 'test-db-admin-user' },
        create: {
          username: 'test-db-admin-user',
          email: 'admin-db@aatachusthava.com',
          passwordHash: 'some_hash',
          role: 'SUPER_ADMIN',
        },
        update: { role: 'SUPER_ADMIN' },
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { authorization: `Bearer ${adminUser.id}` },
      });
      // AdminUser ID must NOT be accepted as a credential
      await expect(authenticateAdmin(req)).rejects.toThrow(AppError);
      const res = await previewHandler(req);
      expect(res.status).toBe(401);
    });

    it('5. Bearer known AdminUser email -> MUST FAIL (401)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { authorization: 'Bearer admin-db@aatachusthava.com' },
      });
      await expect(authenticateAdmin(req)).rejects.toThrow(AppError);
      const res = await previewHandler(req);
      expect(res.status).toBe(401);
    });

    it('6. random x-admin-key -> MUST FAIL (401)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { 'x-admin-key': 'random-unauthorized-key-xyz' },
      });
      await expect(authenticateAdmin(req)).rejects.toThrow(AppError);
      const res = await previewHandler(req);
      expect(res.status).toBe(401);
    });

    it('7. missing token -> 401 UNAUTHORIZED without leaking target data', async () => {
      const unauthReq = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`);
      await expect(authenticateAdmin(unauthReq)).rejects.toThrow(AppError);

      const res = await previewHandler(unauthReq);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.preview).toBeUndefined();
    });

    it('8. invalid token -> 401 UNAUTHORIZED', async () => {
      const invalidReq = new NextRequest(`http://localhost:3000/api/admin/puzzles/preview?date=${TEST_DATE}`, {
        headers: { authorization: 'Bearer completely-bogus-token' },
      });
      await expect(authenticateAdmin(invalidReq)).rejects.toThrow(AppError);

      const res = await previewHandler(invalidReq);
      expect(res.status).toBe(401);
    });

    it('9. valid token + insufficient role -> 403 FORBIDDEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/puzzles/preview', {
        headers: { authorization: `Bearer ${VALID_ADMIN_SECRET}` },
      });

      // requireAdminAuth with role requirement that excludes SUPER_ADMIN
      await expect(requireAdminAuth(req, ['MODERATOR'])).rejects.toThrow(AppError);

      try {
        await requireAdminAuth(req, ['MODERATOR']);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
      }
    });

    it('10. audit log uses authenticated root admin identity', async () => {
      const activeMovie = await prisma.movie.findFirst({
        where: { lifecycleStatus: 'ACTIVE', eligibility: { playableAsTarget: true } },
      });
      expect(activeMovie).not.toBeNull();

      const req = new NextRequest('http://localhost:3000/api/admin/puzzles/override', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${VALID_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          puzzleDate: TEST_DATE,
          movieId: activeMovie!.id,
          overrideReason: 'Audit Log Root Identity Verification',
          adminId: 'attempted-spoof-id', // Ignored!
        }),
      });

      const res = await overrideHandler(req);
      expect(res.status).toBe(200);

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
      const envObj = process.env as Record<string, string | undefined>;
      const oldEnv = envObj.NODE_ENV;
      const oldSecret = envObj.DAILY_PUZZLE_SECRET;
      try {
        envObj.NODE_ENV = 'production';
        delete envObj.DAILY_PUZZLE_SECRET;

        expect(() => new DailyPuzzleSelector().getSecretSalt()).toThrow(/FATAL: Missing required environment variable DAILY_PUZZLE_SECRET/);
      } finally {
        envObj.NODE_ENV = oldEnv;
        envObj.DAILY_PUZZLE_SECRET = oldSecret;
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
