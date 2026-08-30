# AAta Chusthava — Game Rules & Clue Specification

## 1. Gameplay Objective
Deduce the secret Indian movie (Telugu / Tollywood or Hindi / Bollywood, 2002 to present) within **10 attempts**.

## 2. Supported Game Modes
- **Daily Movie**: One shared daily puzzle across all players worldwide. New puzzle activated every 24 hours at 00:00.
- **Friend Challenge**: Custom movie selected by a user. Generates an opaque 6-character link (e.g. `8F4K9Q`).
- **Historical Archive**: Play any previously scheduled daily movie puzzle.

## 3. The 11 Deterministic Clues

| # | Clue Type | Evaluation Logic | Visual Feedback |
|---|---|---|---|
| 1 | **Language** | Normalized language sets comparison | 🟩 Exact match, 🟧 Partial overlap, ⬛ Disjoint |
| 2 | **Director** | Normalized Person ID match | 🟩 Exact match (shared filmmaker), ⬛ None |
| 3 | **Studio / Banner** | Canonical production company / parent match | 🟩 Exact match, ⬛ None |
| 4 | **Release Year** | Delta comparison (`diff = guess - target`) | 🟩 Exact (0 diff), 🟨 Close (±3 yrs) + ↑/↓, ⬛ None + ↑/↓ |
| 5 | **Box Office** | Numeric currency comparison (±100 Cr threshold) | 🟩 Exact, 🟨 Close + ↑/↓, ⬛ None, ⬜ Unavailable (never collapsed to 0) |
| 6 | **Rating** | Numeric comparison (±0.5 threshold) | 🟩 Exact, 🟨 Close + ↑/↓, ⬛ None + ↑/↓, ⬜ Unavailable |
| 7 | **Lead Actor** | Normalized Person IDs of lead actors | 🟩 Exact match, ⬛ None |
| 8 | **Lead Actress** | Normalized Person IDs of lead actresses | 🟩 Exact match, ⬛ None |
| 9 | **Supporting Cast** | Set intersection of supporting artists | 🟩 Exact (full set), 🟧 Partial (shares artists), ⬛ None |
| 10 | **Music Director** | Normalized Person ID of composers | 🟩 Exact match, ⬛ None |
| 11 | **Genres** | Set intersection of canonical genres | 🟩 Exact match, 🟧 Partial overlap, ⬛ Disjoint |

## 4. Hint System Milestones
- **Attempt 5**: Unlocks Director Clue Initial.
- **Attempt 8**: Unlocks Era Decade & Genre Clue.

## 5. Duplicate Guess Policy
Submitting a movie already guessed in the same session throws a `DUPLICATE_GUESS` rejection without consuming an attempt.
