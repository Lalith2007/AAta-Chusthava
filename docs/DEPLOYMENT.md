# AAta Chusthava — Deployment Guide

## Infrastructure Requirements

- **Runtime**: Node.js 18+ / 20+ / 24+
- **Database**: PostgreSQL 15+ / 16+ / 17+
- **Cache/Queue**: Redis 6+ / 7+ / 8+ (optional, fallback in-memory provider available)
- **Object Storage**: S3-compatible asset store (optional for local/external posters)

## Production Deployment Steps

1. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Set DATABASE_URL, TMDB_API_KEY, ADMIN_API_SECRET, NEXT_PUBLIC_APP_URL
   ```

2. **Database Migration & Seed**:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

3. **Build & Start Web Application**:
   ```bash
   npm run build
   npm run start
   ```

4. **Health Check Probes**:
   - Liveness: `GET /api/health`
   - Readiness: `GET /api/ready`
