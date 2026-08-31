# AAta Chusthava — Real Catalog Dataset Acquisition Evaluation

This document details the source research, licensing evaluation, technical capabilities, and legal compliance assessment for potential real external movie datasets for the AAta Chusthava catalog expansion (Telugu and Hindi cinema, 2002 to present).

---

## 1. Legal / Licensing Gate Matrix

| Source Name | Publisher / Owner | Format & Access | Coverage | License / Terms | Commercial & Redistribution | Classification | Status Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TMDB** | JustWatch / TiVo | Paginated REST API | Global (>900k titles, >25k Indian) | TMDB API Terms of Use | Permitted with attribution | **`APPROVED`** | Primary discovery source. Active and verified. |
| **Wikidata** | Wikimedia Foundation | SPARQL (JSON) & Dumps | Global (>400k films, >15k Indian) | CC0 1.0 Universal (Public Domain) | Full commercial & redistribution rights | **`APPROVED`** | Secondary discovery source. Active and verified. |
| **IMDb Non-Commercial Datasets** | IMDb.com, Inc. (Amazon) | TSV.GZ Bulk Dumps (`datasets.imdbws.com`) | Global (>10M titles) | IMDb Non-Commercial Terms | **Strictly prohibited** from republishing / creating online DB | **`NOT_APPROVED`** | Legal barrier: Terms forbid creating or publishing online database without enterprise license. |
| **Indiancine.ma Archive** | Pad.ma / Public Digital Media | Web Portal (No API) | Indian Historical (~40k films) | Academic / Research Archive | Blocked by robots.txt and anti-bot WAF | **`NOT_APPROVED`** | Technical & legal barrier: robots.txt `Disallow: /` and anti-bot WAF. |
| **CBFC / NFDC Portals** | Ministry of I&B (Govt. of India) | Web Search with CAPTCHA | Certified Indian Films | Public Government Records | No machine-readable API or bulk dump | **`NOT_IMPLEMENTED`** | Technical barrier: No machine-readable feed or export. |
| **OMDb API** | Brian Fritz | REST API (Per-title lookup) | Query-by-ID / Title | API Subscription Terms | Lookup proxy; no bulk discovery endpoint | **`SOURCE_CANDIDATE`** | Title-level enrichment only; incapable of bulk catalog discovery. |

---

## 2. In-Depth Candidate Source Analysis

### A. The Movie Database (TMDB) — `APPROVED` / `ACTIVE`
- **Publisher**: TiVo / JustWatch
- **URL**: `https://developer.themoviedb.org/docs`
- **Format**: JSON REST API with pagination cursors.
- **Available Fields**: Title, original title, release date, genres, directors, cast, music composers, production houses, budget, box office, poster/backdrop paths.
- **Licensing Compliance**: TMDB terms explicitly permit application integration and metadata storage with appropriate branding attribution.
- **Production Status**: Currently active in AAta Chusthava's discovery pipeline across 2002–2026.

### B. Wikidata Knowledge Graph — `APPROVED` / `ACTIVE`
- **Publisher**: Wikimedia Foundation
- **URL**: `https://query.wikidata.org/`
- **Format**: SPARQL 1.1 JSON Query Results & MediaWiki Entity API.
- **Available Fields**: QID, multilingual labels (`te`, `hi`, `en`), publication dates, directors (P57), screenwriters (P58), cast members (P161), genres (P136), country (P495), IMDb ID (P345), TMDB ID (P4985).
- **Licensing Compliance**: CC0 1.0 Universal allows unrestricted commercial, educational, and gaming utilization.
- **Production Status**: Currently active in secondary cross-source discovery and deduplication.

### C. IMDb Non-Commercial Datasets — `NOT_APPROVED` (for Canonical Ingestion)
- **Publisher**: IMDb.com, Inc. (Amazon.com subsidiary)
- **URL**: `https://datasets.imdbws.com/` / `https://developer.imdb.com/non-commercial-datasets/`
- **Format**: Gzipped TSV (`title.basics.tsv.gz`, `title.principals.tsv.gz`, `title.ratings.tsv.gz`, `title.akas.tsv.gz`).
- **Available Fields**: `tconst`, `primaryTitle`, `startYear`, `genres`, `averageRating`, `numVotes`, `directors`, `cast/crew principals`.
- **Licensing Assessment**: 
  - Section 2 of IMDb's Terms of Use specifies: *"The data can only be used for personal and non-commercial use and must not be altered/republished/resold/repurposed to create any kind of online/offline database of movie information (except for individual personal use)."*
  - Ingesting IMDb's bulk dump into a publicly accessible web game canonical database violates these redistribution terms unless a commercial license is obtained from `developer.imdb.com`.
- **Production Policy**: Adapter remains classified as `NOT_IMPLEMENTED` in `AcquisitionSourceRegistry`. Bulk data is **not** imported into production.

---

## 3. Production Acquisition Ingestion Policy

1. **Zero Fictional Sources**: No synthetic registries, fabricated datasets, or mock external providers will ever be inserted into the canonical database.
2. **Canonical Baseline Stability**: The canonical database remains at **134 verified movies** with `100% Playability` and coverage classified as **`PARTIAL`**.
3. **Onboarding Real Future Datasets**: When a verified, open-licensed (CC-BY, CC0, or formally licensed commercial) dataset for Indian cinema is approved:
   - The file is ingested via `CatalogImportJob` and `catalogAcquisitionService.runImportJob()`.
   - Records flow strictly through `DISCOVERED -> DEDUPLICATE -> ENRICH -> NORMALIZE -> VALIDATE -> PERSIST`.
   - Zero duplicate canonical movies are created.
