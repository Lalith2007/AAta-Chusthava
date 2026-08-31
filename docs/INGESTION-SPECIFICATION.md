# AAta Chusthava — Ingestion & Catalog Acquisition Specification

## 1. Multi-Source Pipeline Overview

```text
DISCOVERY (API) / ACQUISITION (Bulk File / Feed)
   ↓
CANDIDATE CREATION (IngestionCandidate / CatalogImportJob)
   ↓
DEDUPLICATION & CROSS-SOURCE IDENTITY RECONCILIATION
   ├─ High Confidence Match ──→ Match / Enrich Existing Canonical Record (DUPLICATE)
   └─ Unique Candidate      ──→ New Canonical Ingestion
   ↓
ENRICHMENT (Details, Credits, Releases, Titles, External IDs)
   ↓
RAW DATA STORAGE (RawSourceRecord / Checkpoint Ledger)
   ↓
NORMALIZATION (Person, ProductionHouse, Genre, Languages, Release Year)
   ↓
QUALITY VALIDATION & GAME ELIGIBILITY
   ├─ PASS (High Confidence) ──→ ACTIVE + Playable (Guess & Target)
   ├─ REVIEW (Missing Data)  ──→ Admin Review Queue
   └─ REJECT (< 2002 / Junk) ──→ REJECTED
```

## 2. Discovery Sources vs Acquisition Sources

The system explicitly distinguishes between two complementary ingestion streams:

1. **Discovery Sources (`MovieDiscoverySource`)**:
   - Continuous, paginated API-based exploration (e.g. TMDB, Wikidata SPARQL/MediaWiki).
   - Stateful per-year pagination checkpoints (`DiscoveryCheckpoint`).
   - Discovers new historical releases and updates existing catalog entries.

2. **Acquisition Sources (`MovieAcquisitionSource`)**:
   - Bulk ingestion of structured files, feeds, and dumps (`CSV`, `JSON`, `NDJSON`, `BULK_FILE`, `STRUCTURED_DATASET`).
   - Chunked batch processing with row-level checkpointing (`CatalogImportJob`).
   - Isolated malformed row error handling so single row failures do not crash the entire import job.
   - Provider-neutral contract (`StructuredImportMovieRecord`) ensuring all incoming records enter the canonical deduplication, normalization, and validation lifecycle.

## 3. Source Status Classifications

All external sources in `DiscoverySourceRegistry` and `AcquisitionSourceRegistry` are classified with strict truthfulness:

- **`ACTIVE`**: Verified, implemented, and actively communicating with live endpoints/readers (e.g. TMDB, Wikidata, Generic CSV, Generic JSON).
- **`SOURCE_CANDIDATE`**: Evaluated as a potential source for title lookup or enrichment (e.g. OMDb).
- **`NOT_IMPLEMENTED`**: Interface registered; awaiting commercial licensing or dedicated background ETL worker (e.g. IMDb REST API, IMDb Bulk TSV Dumps, NFDC/CBFC Portals).
- **`NOT_APPROVED`**: Evaluated but rejected due to anti-bot WAF restrictions or incompatible terms of service (e.g. Indiancine.ma, Commercial Streaming Portals).
- **`TEST_FIXTURE`**: Isolated synthetic data for automated unit/integration tests; strictly barred from production canonical insertion.

## 4. Import Job Lifecycle & Resumability

Import jobs are tracked via `CatalogImportJob` with state machine:
`QUEUED` → `RUNNING` ⇄ `PAUSED` → `COMPLETED` | `PARTIAL` | `FAILED`

- **Row Checkpoint**: Persists `checkpointRow` after each batch, enabling seamless pause/resume.
- **Idempotency**: Re-running the same dataset verifies existing slugs/IDs and produces zero duplicate canonical movie records.
