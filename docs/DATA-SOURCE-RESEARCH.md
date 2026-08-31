# AAta Chusthava — Real Large-Scale Movie Dataset Research & Acquisition Plan

## Executive Summary

To scale the AAta Chusthava canonical catalog from the 134-movie baseline toward thousands of Telugu and Hindi films (2002 to present), this research establishes a legal, technical, and architectural blueprint.

The core conclusion is that **no single external source provides both complete candidate coverage and exhaustive game-ready metadata under permissive licensing**. Therefore, the optimal strategy combines:
1. **Wikidata SPARQL / CC0 Dumps + Open Annual Filmography Feeds** for the **Candidate Universe** (broadest historical coverage, CC0 / CC BY-SA licensing).
2. **TMDB API & Daily Export Feeds** for **Metadata Enrichment** (ordered billing, character names, high-resolution poster assets, music composers).
3. **Catalog Acquisition Framework** for **Deduplication, Checkpointing, and Ingestion** into the canonical PostgreSQL database.

---

## 1. Candidate Source Evaluation & Ranking Table

| Rank | Source Name | Publisher / Owner | Format | Approx. Size | Telugu (2002+) | Hindi (2002+) | License / Terms | Commercial Use | Bulk Access | Role Classification | Approval Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | **Wikidata Knowledge Graph** | Wikimedia Foundation | SPARQL (JSON), Dumps | >450k films | High (~3.5k) | High (~4.5k) | CC0 1.0 Universal | Permitted (Unrestricted) | Yes (Dumps + SPARQL) | `CANDIDATE_UNIVERSE`, `IDENTITY`, `DISCOVERY` | **`APPROVED`** |
| **#2** | **The Movie Database (TMDB)** | JustWatch / TiVo | REST API, Daily ID Dumps | >900k titles | High (~2.5k) | Very High (~4k) | TMDB Terms of Use | Permitted (with attribution) | Yes (Daily ID exports) | `PRIMARY_METADATA`, `ENRICHMENT`, `VALIDATION` | **`APPROVED`** |
| **#3** | **Open Filmography Feeds** | Wikipedia Language Projects | CSV, JSON Tables | ~10k regional | High (~4.5k) | High (~6k) | CC BY-SA 4.0 / GFDL | Permitted (with attribution) | Yes (Extracted feeds) | `CANDIDATE_UNIVERSE`, `BULK_FILE` | **`APPROVED`** |
| **#4** | **OMDb API** | Brian Fritz | REST API (Per title) | Lookup proxy | Moderate | Moderate | API Key Terms | Commercial tier available | No (Single lookups only) | `ENRICHMENT` | **`SOURCE_CANDIDATE`** |
| **#5** | **IMDb Official Dumps** | IMDb.com, Inc. (Amazon) | Gzipped TSV Dumps | >10M titles | High (~5k) | Very High (~10k) | IMDb Non-Commercial | **Prohibited** from online DB publication | Yes (`datasets.imdbws.com`) | `IDENTITY` (Local verification only) | **`NOT_APPROVED`** (for canonical DB) |
| **#6** | **Indiancine.ma Archive** | Pad.ma / Public Media | Web Portal (No API) | ~40k titles | Moderate | Moderate | Academic / Restricted | Prohibited (WAF / robots.txt) | No | `SECONDARY_METADATA` | **`NOT_APPROVED`** |
| **#7** | **CBFC / NFDC Portals** | Govt. of India (MIB) | HTML / CAPTCHA | >100k records | Comprehensive | Comprehensive | Public Records | Unclear | No (Interactive portal) | `VALIDATION` | **`NOT_IMPLEMENTED`** |

---

## 2. In-Depth Analysis of Top Sources

### #1 Best Source: Wikidata Knowledge Graph (`APPROVED` / `ACTIVE`)
- **Publisher**: Wikimedia Foundation
- **Official URL**: `https://www.wikidata.org/` | **Query URL**: `https://query.wikidata.org/`
- **Licensing**: **Creative Commons CC0 1.0 Universal (Public Domain Dedication)**.
- **Why it is #1**:
  - **Universal Identity Graph**: Stores external cross-references including TMDB IDs (`P4985`), IMDb IDs (`P345`), and Freebase IDs.
  - **Unrestricted Licensing**: Allows complete commercial, game-engine, and offline storage rights.
  - **Deep Regional Coverage**: Excellent coverage of independent, historical, and lesser-known Telugu and Hindi cinema from 2002 to present.
  - **Multilingual Support**: Native labels in Telugu script (`te`), Devanagari script (`hi`), and Romanized English (`en`).
- **Limitations**:
  - Unordered cast lists (no billing order).
  - Sparse financial metrics (budget and box office in INR).
  - Complex SPARQL queries must be paginated by year to prevent 60-second gateway timeouts.

### #2 Second-Best Source: The Movie Database (TMDB) (`APPROVED` / `ACTIVE`)
- **Publisher**: JustWatch / TiVo
- **Official URL**: `https://www.themoviedb.org/` | **API Docs**: `https://developer.themoviedb.org/docs`
- **Licensing**: **TMDB API Terms of Use** (Free community/non-commercial access with attribution).
- **Why it is #2**:
  - **Exhaustive Metadata**: Provides structured cast billing order (`order: 0, 1, 2...`), character names, crew roles (Director, Music Composer, Cinematographer), genres, runtime, and high-resolution posters.
  - **Deterministic Game Clues**: Essential for AAta Chusthava's 11 clue evaluators.
- **Limitations**:
  - Regional Indian titles released before 2010 can sometimes lack full crew credits.
  - Paginated discovery queries are capped at 500 pages per request filter.

### #3 Rejected Source: IMDb Non-Commercial Datasets (`NOT_APPROVED`)
- **Publisher**: IMDb.com, Inc.
- **URL**: `https://datasets.imdbws.com/`
- **Reason for Rejection**:
  - Section 2 of IMDb's Terms of Use expressly states: *"The data can only be used for personal and non-commercial use and must not be altered/republished/resold/repurposed to create any kind of online/offline database of movie information (except for individual personal use)."*
  - Using IMDb's raw dumps to populate a production web game database violates their redistribution terms without a paid enterprise license from `developer.imdb.com`.

---

## 3. Dataset Import & Execution Plan

### Recommended Pipeline: Multi-Source Union & Enrichment

```text
[Wikidata QIDs + Wikipedia Feeds + TMDB Discover]
                     ↓
        Candidate Universe (CSV / JSON)
                     ↓
         CatalogImportJob Ingestion
                     ↓
   Deduplication (Slug, TMDB ID, Title + Year)
                     ↓
    TMDB & Wikidata Enrichment Workers
                     ↓
  Normalization (Person, Genre, Languages)
                     ↓
 Quality Validation & GameEligibility Computation
                     ↓
          Canonical Movie Table
```

### Ingestion Specifications
1. **Batch Size**: 50 records per chunk with transactional error isolation.
2. **Resumability**: Row-level checkpointing in `CatalogImportJob` (`checkpointRow`, `checkpointCursor`).
3. **Data Safety**:
   - Unknown box office is stored as `null` (`boxOfficeStatus: UNKNOWN`).
   - Unknown rating is stored as `null`.
   - Minimum metadata rule: A movie is `playableAsTarget` ONLY if it has $\ge 1$ Director, $\ge 2$ Cast members, and a valid `releaseYear`.
4. **Catalog Coverage Classification**: Retains classification as **`PARTIAL`** with year-by-year evidence tracking.
