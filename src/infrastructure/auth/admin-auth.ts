import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/db/client';
import { AppError } from '@/domain/errors';
import { AdminRole } from '@prisma/client';

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  role: AdminRole | 'SUPER_ADMIN' | 'EDITOR' | 'MODERATOR';
  permissions: string[];
}

/**
 * Extracts the administrative authentication token or API key from request headers.
 * Supports:
 * - Authorization: Bearer <token>
 * - Authorization: <token>
 * - x-admin-key: <key>
 * - x-admin-secret: <secret>
 * - x-admin-api-key: <key>
 * - x-admin-token: <token>
 */
export function extractAdminToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.substring(7).trim();
    }
    return trimmed;
  }

  const customKey =
    req.headers.get('x-admin-key') ||
    req.headers.get('x-admin-secret') ||
    req.headers.get('x-admin-api-key') ||
    req.headers.get('x-admin-token');

  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }

  return null;
}

/**
 * Authenticates the caller as a valid admin identity.
 * Validates against server-configured ADMIN_API_SECRET and/or database AdminUser accounts.
 * Never trusts caller-supplied claims in the JSON body.
 */
export async function authenticateAdmin(req: NextRequest): Promise<AuthenticatedAdmin> {
  const token = extractAdminToken(req);

  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authentication required to access admin resources.', 401);
  }

  // 1. Check server-configured root admin secret
  const rootSecret = process.env.ADMIN_API_SECRET;
  if (rootSecret && rootSecret.trim().length > 0 && token === rootSecret.trim()) {
    return {
      id: 'super-admin-root',
      username: 'system-admin',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    };
  }

  // 2. Check registered AdminUser in database
  try {
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        OR: [{ id: token }, { username: token }],
      },
    });

    if (adminUser) {
      return {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        permissions: adminUser.permissions,
      };
    }
  } catch (_err) {
    // Database lookup failed or connection issue
  }

  throw new AppError('UNAUTHORIZED', 'Invalid admin authentication credentials.', 401);
}

/**
 * Authorizes the request requiring an active admin with permitted roles.
 * Rejects unauthenticated callers with 401 UNAUTHORIZED.
 * Rejects authenticated callers with insufficient roles with 403 FORBIDDEN.
 */
export async function requireAdminAuth(
  req: NextRequest,
  allowedRoles: (AdminRole | 'SUPER_ADMIN' | 'EDITOR' | 'MODERATOR')[] = ['SUPER_ADMIN', 'EDITOR']
): Promise<AuthenticatedAdmin> {
  const admin = await authenticateAdmin(req);

  if (allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    throw new AppError(
      'FORBIDDEN',
      `Forbidden: Caller role "${admin.role}" is not authorized for this operation.`,
      403
    );
  }

  return admin;
}
