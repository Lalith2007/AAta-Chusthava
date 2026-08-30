# AAta Chusthava — Architecture Specification

## 1. Core Architectural Hierarchy

The entire application adheres to the non-negotiable philosophy:

```text
Normalized Canonical Movie DB (PostgreSQL)
                   ↓
              Clue Engine (11 Deterministic Evaluators)
                   ↓
              Game Engine (Shared Authoritative Engine)
                   ↓
        Application & Ingestion Services
                   ↓
            Platform REST APIs
                   ↓
       Next.js 15+ Player & Admin UI
```

## 2. Target Secrecy & Server Authority

1. The frontend client is strictly untrusted.
2. The hidden target movie details (`id`, `title`, `poster`, `directors`, etc.) are never sent across the network until the player's game session concludes with status `WON` or `LOST`.
3. Clue evaluation is strictly computed on the server side using the deterministic `ClueEngine`.
4. Guess submissions are atomic and transactional, updating both `GameGuess` and `GameSession` records within a PostgreSQL transaction.
5. Duplicates are rejected under the `REJECT_NO_PENALTY` policy without consuming an attempt.
6. Idempotent guess requests sharing a `clientRequestId` return previous evaluation data without consuming extra attempts.

## 3. Modular Monolith Architecture

The application is structured cleanly within strong domain modules:

- `src/domain/`: Core types, interfaces, clue results, and domain error hierarchies.
- `src/modules/movies/`: Normalized movie & person repository, search indexing, and validation.
- `src/modules/clues/`: 11 deterministic clue evaluators and registry.
- `src/modules/games/`: Authoritative game engine, ruleset configurations, and transactional persistence.
- `src/modules/daily/`: Daily puzzle scheduling, target immutability, and historical archive lookup.
- `src/modules/challenges/`: Custom friend challenge creator with opaque non-sequential 6-character public codes.
- `src/modules/hints/`: Hint unlock milestones (Attempt 5 & Attempt 8).
- `src/modules/ingestion/`: TMDB external source adapter, discovery workers, raw source persistence, and normalization pipelines.
- `src/modules/admin/`: Operations control plane, review queues, duplicate merging, and audit logging.
