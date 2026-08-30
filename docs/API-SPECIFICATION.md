# AAta Chusthava — REST API Specification

All endpoints return structured JSON with consistent error formatting:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Public Gameplay Endpoints

### 1. `GET /api/games/daily`
Retrieves or creates today's Daily Game session.
- **Query Params**: `date` (optional "YYYY-MM-DD")
- **Target Secrecy**: `revealedTarget` is `null` until game is completed.

### 2. `POST /api/games/start`
Starts or resumes a session.
- **Body**: `{ mode: "DAILY" | "CHALLENGE" | "ARCHIVE", date?: string, publicCode?: string }`

### 3. `POST /api/games/[sessionId]/guesses`
Submits a movie guess.
- **Body**: `{ movieId: string, clientRequestId?: string }`
- **Response**: `{ attemptNumber, isCorrect, status, attemptsRemaining, evaluation, revealedTarget, unlockedHint }`

### 4. `POST /api/games/[sessionId]/hints/[hintId]/use`
Reveals an unlocked hint.

### 5. `GET /api/games/[sessionId]/result`
Returns post-game statistics, revealed target summary, and copyable spoiler-safe emoji matrix.

### 6. `GET /api/movies/search`
Internal movie database search.
- **Query Params**: `q` (string), `mode` (`guess` or `target`), `limit` (default 15)

### 7. `POST /api/challenges`
Creates a friend challenge.
- **Body**: `{ movieId: string, creatorName?: string }`
- **Response**: `{ challengeId, publicCode, shareUrl, targetMovieTitle, expiresAt }`

### 8. `GET /api/challenges/[publicCode]`
Retrieves public challenge metadata (safe; target is never exposed).

### 9. `GET /api/archive`
Lists available historical daily puzzles.

### 10. `GET /api/health` & `GET /api/ready`
Liveness and PostgreSQL readiness probes.

## Admin Operations Endpoints

- `GET /api/admin/stats`: Dashboard overview metrics.
- `GET /api/admin/review-queue`: Pending ingestion review items.
- `POST /api/admin/review-queue/[candidateId]/action`: Approve / Reject candidate.
- `GET /api/admin/puzzles`: List upcoming scheduled daily puzzles.
- `POST /api/admin/puzzles/schedule`: Pre-schedule future daily puzzles.
- `GET /api/admin/movies`: Filter internal movie records.
- `POST /api/admin/movies/merge`: Reconcile and merge duplicate movies safely.
- `GET /api/admin/audit-logs`: Audit log feed.
