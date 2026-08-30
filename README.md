# AAta Chusthava (Indian Movie Deduction Game)

> **Spotle for Indian Cinema — Telugu (Tollywood) & Hindi (Bollywood), 2002 → Present**

A production-ready web application built upon the architectural philosophy:
**One canonical normalized movie database → one clue engine → one game engine → multiple game modes (Daily, Friend Challenge, Historical Archive).**

---

## 🌟 Key Features

1. **Daily Movie Game**: A new handpicked Indian blockbuster every 24 hours. Guess the film in 10 attempts using 11 dynamic clues.
2. **Challenge a Friend**: Pick any movie from the 2002–Present catalog and generate a secret, opaque 6-character link (e.g. `8F4K9Q`).
3. **11 Smart Clues**: Language, Director, Studio/Banner, Release Year, Box Office, IMDb/TMDB Rating, Lead Actor, Lead Actress, Supporting Cast, Music Director, and Genres.
4. **Target Privacy**: The hidden target is strictly evaluated on the server and never revealed to the client until the game is won or lost.
5. **Hint System**: Progressive unlock milestones at Attempt 5 (Director Clue) and Attempt 8 (Era & Genre Clue).
6. **Spoiler-Safe Sharing**: Generate emoji matrix cards (e.g. `🟩 🟨 ⬛ 🟨`) to share results without spoiling the movie title.
7. **Historical Archive**: Play past daily puzzles with full clue evaluation.
8. **Dynamic Ingestion**: Continuous discovery of future releases with raw payload retention, deduplication, and quality validation.
9. **Admin Control Center**: System health overview, review queue, movie curation, duplicate merging, puzzle scheduler, and audit logging.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router), React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Custom CSS Variables (Tollywood gold, neon emerald, glassmorphism)
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest (Unit & Integration tests)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- PostgreSQL running locally or in the cloud

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is configured:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/aata_chusthava"
ADMIN_API_SECRET="your_admin_secret_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
```bash
npx prisma db push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

Run the complete Vitest test suite covering the 11 Clue Evaluators, Game Engine, and Integration Flows:
```bash
npm test
```

---

## 📂 Project Architecture

```text
src/
  ├── app/                  # Next.js App Router (Player, Admin, API routes)
  │   ├── (player)/         # Home, Play, Create, Challenge, Archive, Results
  │   ├── admin/            # Operations Control Plane
  │   └── api/              # REST API endpoints
  ├── domain/               # Domain models, Clue types, Errors
  ├── modules/
  │   ├── movies/           # Movie Repository & Internal Search
  │   ├── clues/            # 11 Clue Evaluators & Clue Registry
  │   ├── games/            # Authoritative Game Engine & Session Manager
  │   ├── daily/            # Daily Puzzle Scheduler & Archive
  │   ├── challenges/       # Friend Challenge Service
  │   ├── ingestion/        # TMDB Adapter & Dynamic Importer
  │   └── admin/            # Admin Services & Audit Logger
  ├── components/           # UI Components (GameBoard, ClueCell, Search, Modals)
  └── infrastructure/       # DB client, Cache, Queue, External Sources
```

---

## 📖 Documentation

- [Master Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE-SCHEMA.md)
- [Game Rules & Clue Matrix](docs/GAME-RULES.md)
- [REST API Specification](docs/API-SPECIFICATION.md)
- [Ingestion & Refresh Specification](docs/INGESTION-SPECIFICATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
