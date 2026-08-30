# Changelog

All notable changes to **AAta Chusthava** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-31

### Added
- **Core Architecture**: One canonical normalized movie database $\rightarrow$ one clue engine $\rightarrow$ one game engine $\rightarrow$ multiple game modes.
- **11 Clue Evaluators**:
  - `LanguageClueEvaluator` (Exact, Partial, None)
  - `DirectorClueEvaluator` (Person ID matching)
  - `ProductionHouseClueEvaluator` (Studio & subsidiary matching)
  - `ReleaseYearClueEvaluator` (Exact, Close ±3 yrs, Higher/Lower direction)
  - `BoxOfficeClueEvaluator` (Exact, Close ±100 Cr, Higher/Lower direction, explicit Unavailable state)
  - `RatingClueEvaluator` (Exact, Close ±0.5, Higher/Lower direction)
  - `LeadActorClueEvaluator` & `LeadActressClueEvaluator` (Normalized artist matching)
  - `SupportingCastClueEvaluator` (Intersection with matched cast list)
  - `MusicDirectorClueEvaluator` (Composer matching)
  - `GenreClueEvaluator` (Canonical genre set intersection)
- **Authoritative Game Engine**:
  - Strict server-side target secrecy: target movie details are never sent to the client until game completion.
  - Transactional persistence in PostgreSQL with atomic `GameGuess` and `GameSession` updates.
  - Duplicate guess rejection under `REJECT_NO_PENALTY` policy without consuming an attempt.
  - Idempotency with `clientRequestId`.
- **Game Modes**:
  - **Daily Movie Game** (`/play`): Daily puzzle with progressive hint unlocks at attempts 5 & 8.
  - **Friend Challenge** (`/create` & `/challenge/[code]`): Custom challenges with opaque 6-character links (e.g. `8F4K9Q`).
  - **Historical Archive** (`/archive` & `/archive/[date]`): Full historical daily puzzle archive.
- **Admin Control Plane** (`/admin`):
  - System health monitoring, PostgreSQL and queue readiness probes.
  - Ingestion review queue for new movie candidates.
  - Movie catalog curation and duplicate reconciliation/merge tool.
  - Daily puzzle scheduler (+7 days pre-schedule).
  - Audit logging.
- **Dynamic Ingestion**:
  - TMDB source adapter with discovery worker and raw payload retention (`RawSourceRecord`).
- **UI & UX**:
  - Cinematic Tollywood & Bollywood theme with mobile-responsive horizontal scrolling clue board.
  - Resilient `MoviePoster` component with stylized fallback gradient badges.
  - Spoiler-free emoji share card generator.
- **CI/CD & Testing**:
  - Full GitHub Actions CI pipeline (`lint-and-typecheck`, `test`, `build`).
  - GitHub Actions CD pipeline with staging deploy and production promotion gates.
  - Vitest test suite covering all 11 evaluators, game engine, and API integration flows.
