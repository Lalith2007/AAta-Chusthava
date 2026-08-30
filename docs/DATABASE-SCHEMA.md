# AAta Chusthava — Database Schema Documentation

The application uses PostgreSQL with Prisma ORM adhering to high normal-form principles. Relationships between movies, persons, genres, production houses, and release events are explicitly modeled with composite keys, foreign keys, and indexes.

## Core Relational Models

### 1. `Movie`
Canonical representation of an Indian film.
- `id` (UUID Primary Key)
- `slug` (Unique Slug)
- `primaryTitle`, `originalTitle`, `alternativeTitles` (String[])
- `supportedLanguages` (`MovieLanguage[]`: TELUGU, HINDI, TAMIL, etc.)
- `industries` (`MovieIndustry[]`: TOLLYWOOD, BOLLYWOOD, etc.)
- `releaseDate`, `releaseYear`, `canonicalIndiaReleaseDate`
- `certification` (e.g. U, U/A, A)
- `budget`, `budgetCurrency`
- `boxOffice`, `boxOfficeCurrency`, `boxOfficeStatus` (UNKNOWN, ESTIMATED, REPORTED, FINAL)
- `rating`, `ratingVoteCount`, `ratingSource`, `ratingUpdatedAt`
- `posterAsset`, `backdropAsset`, `franchise`
- `lifecycleStatus` (ACTIVE, DISCOVERED, INGESTING, NORMALIZED, VALIDATION_REQUIRED, DISABLED, MERGED)
- `tmdbId` (Unique), `imdbId`, `wikidataId`

### 2. `Person` & `MoviePerson`
Normalized artist entity and relationship.
- `Person`: `id`, `canonicalName`, `alternateNames[]`, `tmdbId`, `imdbId`, `image`
- `MoviePerson`: `movieId`, `personId`, `relationType` (CAST, CREW), `roleType` (DIRECTOR, MUSIC_DIRECTOR, LEAD, SUPPORTING, CAMEO, SPECIAL_APPEARANCE, etc.), `characterName`, `billingOrder`, `job`, `department`.

### 3. `ProductionHouse` & `MovieProductionHouse`
Normalized studio/banner entity supporting parent-company hierarchies without string hacks.

### 4. `Genre` & `MovieGenre`
Normalized genres.

### 5. `GameEligibility`
Explicit playability flags:
- `playableAsGuess`: boolean
- `playableAsTarget`: boolean
- `minimumMetadataComplete`: boolean
- `reviewStatus` (APPROVED, PENDING, REJECTED, FLAGGED)

### 6. `Game`, `GameSession`, `GameGuess`, `GameRuleset`
Authoritative game records:
- `Game`: Playable puzzle reference (`mode`: DAILY, CHALLENGE, PRACTICE, `targetMovieId`, `maxAttempts`)
- `GameSession`: Player game session (`status`: NOT_STARTED, IN_PROGRESS, WON, LOST, EXPIRED, `attemptsUsed`)
- `GameGuess`: Persisted guess with JSON evaluation snapshot (`attemptNumber`, `isCorrect`, `clientRequestId`)
- `DailyPuzzle`: Pre-scheduled daily puzzles (`puzzleDate` Unique "YYYY-MM-DD", `status`, `targetSnapshot`)
- `Challenge`: Custom friend challenges (`publicCode` Unique 6-char opaque, `expiresAt`)
- `SessionHint`: Unlocked session hints with progressive disclosure
- `AuditLog`: Security and administrative audit trail
