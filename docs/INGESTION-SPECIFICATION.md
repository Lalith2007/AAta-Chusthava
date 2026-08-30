# AAta Chusthava — Ingestion & Refresh Specification

## 1. Pipeline Overview

```text
DISCOVERY
   ↓
CANDIDATE CREATION (IngestionCandidate)
   ↓
DEDUPLICATION & SOURCE IDENTITY CHECK
   ↓
ENRICHMENT (Details, Credits, Releases, Titles)
   ↓
RAW DATA STORAGE (RawSourceRecord)
   ↓
NORMALIZATION (Person, ProductionHouse, Genre, Release)
   ↓
QUALITY VALIDATION
   ├─ PASS (High Confidence) ──→ ACTIVE + Target Eligible
   ├─ REVIEW (Missing Data)  ──→ Admin Review Queue
   └─ REJECT (< 2002 / Junk) ──→ REJECTED
```

## 2. Dynamic Discovery vs Refresh

- **Discovery Worker**: Scans for new Telugu & Hindi releases (2002 to present) via TMDB adapter. Stores candidates asynchronously in background queues.
- **Refresh Worker**: Periodically checks active movies for updated IMDb/TMDB ratings, vote counts, and box office revisions.
- **Reprocessing from Raw Payload**: All original JSON payloads are permanently stored in `RawSourceRecord` for zero-loss parser reprocessing.
