import { describe, it, expect, afterAll } from 'vitest';
import { DiscoverySourceRegistry } from '@/infrastructure/external-sources/discovery-source';
import { wikipediaDiscoveryAdapter, WikipediaDiscoveryAdapter } from '@/infrastructure/external-sources/wikipedia-adapter';
import { ingestionService } from '@/modules/ingestion/ingestion-service';
import { catalogCoverageService } from '@/modules/catalog/catalog-coverage-service';
import { prisma } from '@/infrastructure/db/client';

describe('Wikipedia Filmography Discovery Source (CC BY-SA 4.0)', () => {
  afterAll(async () => {
    await prisma.ingestionCandidate.deleteMany({
      where: {
        source: 'WIKIPEDIA',
        sourceMovieId: { in: ['WIKI_TE_2002_manmadhudu', 'WIKI_TE_2023_waltair-veerayya', 'WIKI_TE_1995_old-film'] },
      },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'WIKIPEDIA',
        sourceRecordId: { in: ['WIKI_TE_2002_manmadhudu', 'WIKI_TE_2023_waltair-veerayya', 'WIKI_TE_1995_old-film'] },
      },
    });
  });

  it('1. Is registered as ACTIVE in DiscoverySourceRegistry', () => {
    const registry = DiscoverySourceRegistry.getInstance();
    const source = registry.getSource('WIKIPEDIA');

    expect(source).toBeDefined();
    expect(source?.sourceName).toBe('WIKIPEDIA');
    expect(source?.isImplemented).toBe(true);
    expect(source?.status).toBe('ACTIVE');

    const infoList = registry.getRegisteredSources();
    const wikiInfo = infoList.find((s) => s.code === 'WIKIPEDIA');
    expect(wikiInfo).toBeDefined();
    expect(wikiInfo?.status).toBe('ACTIVE');
    expect(wikiInfo?.capabilities.discovery).toBe(true);
  });

  it('2. Discovers Telugu and Hindi candidate summaries for historical years', async () => {
    const teResult = await wikipediaDiscoveryAdapter.discover({
      language: 'te',
      year: 2002,
      page: 1,
      limit: 50,
    });

    expect(teResult.results.length).toBeGreaterThanOrEqual(10);
    expect(teResult.results[0].title).toBeDefined();
    expect(teResult.results[0].originalLanguage).toBe('te');

    const hiResult = await wikipediaDiscoveryAdapter.discover({
      language: 'hi',
      year: 2002,
      page: 1,
      limit: 50,
    });

    expect(hiResult.results.length).toBeGreaterThanOrEqual(10);
    expect(hiResult.results[0].title).toBeDefined();
    expect(hiResult.results[0].originalLanguage).toBe('hi');
  });

  it('3. Extracts candidate identity with language, year, and source', async () => {
    const identity = await wikipediaDiscoveryAdapter.getCandidateIdentity('WIKI_TE_2002_manmadhudu');

    expect(identity.source).toBe('WIKIPEDIA');
    expect(identity.title).toBe('Manmadhudu');
    expect(identity.releaseYear).toBe(2002);
    expect(identity.primaryLanguage).toBe('TELUGU');
  });

  it('4. Retains source provenance and CC BY-SA 4.0 attribution in metadata', async () => {
    const metadata = await wikipediaDiscoveryAdapter.getMetadata('WIKI_TE_2002_manmadhudu');

    expect(metadata.overview).toContain('CC BY-SA 4.0');
    expect(Array.isArray(metadata.genres)).toBe(true);
    expect(metadata.runtime).toBeUndefined();
  });

  it('5. Ingests and deduplicates Wikipedia candidate against existing canonical catalog', async () => {
    const candidateId = `test-wiki-cand-${Date.now()}`;
    const sourceMovieId = 'WIKI_TE_2002_manmadhudu';

    await prisma.ingestionCandidate.upsert({
      where: {
        source_sourceMovieId: {
          source: 'WIKIPEDIA',
          sourceMovieId,
        },
      },
      create: {
        id: candidateId,
        source: 'WIKIPEDIA',
        sourceMovieId,
        status: 'DISCOVERED',
        discoveryReason: 'Wikipedia Filmography Test Discovery',
      },
      update: {
        status: 'DISCOVERED',
      },
    });

    const cand = await prisma.ingestionCandidate.findUnique({
      where: {
        source_sourceMovieId: {
          source: 'WIKIPEDIA',
          sourceMovieId,
        },
      },
    });

    const res = await ingestionService.processCandidate(cand!.id);

    expect(res.candidateId).toBe(cand!.id);
    expect(res.status).toBe('PROCESSED');
    expect(res.isDuplicate).toBe(true);

    const savedCand = await prisma.ingestionCandidate.findUnique({
      where: { id: cand!.id },
    });
    expect(savedCand?.status).toBe('DUPLICATE');
    expect(savedCand?.resolutionReason).toBe('DUPLICATE_CANONICAL_MATCH');
    expect(savedCand?.duplicateOfMovieId).toBeDefined();
  });

  it('6. Isolates malformed records and rejects invalid release years prior to 2002', async () => {
    const candidateId = `test-wiki-old-${Date.now()}`;
    const sourceMovieId = 'WIKI_TE_1995_old-film';

    await prisma.ingestionCandidate.upsert({
      where: {
        source_sourceMovieId: {
          source: 'WIKIPEDIA',
          sourceMovieId,
        },
      },
      create: {
        id: candidateId,
        source: 'WIKIPEDIA',
        sourceMovieId,
        status: 'DISCOVERED',
        discoveryReason: 'Wikipedia Out of Scope Test',
      },
      update: {
        status: 'DISCOVERED',
      },
    });

    const cand = await prisma.ingestionCandidate.findUnique({
      where: {
        source_sourceMovieId: {
          source: 'WIKIPEDIA',
          sourceMovieId,
        },
      },
    });

    const res = await ingestionService.processCandidate(cand!.id);
    expect(res.status).toBe('SKIPPED');

    const updated = await prisma.ingestionCandidate.findUnique({
      where: { id: cand!.id },
    });
    expect(updated?.status).toBe('REJECTED');
    expect(updated?.resolutionReason).toBe('REJECTED_YEAR_BEFORE_2002');
  });

  it('7. Catalog coverage service reports reconciled candidate accounting for Wikipedia', async () => {
    const report = await catalogCoverageService.getCoverageReport();

    const wikiCoverage = report.sourceBreakdown.find((s) => s.code === 'WIKIPEDIA');
    expect(wikiCoverage).toBeDefined();
    expect(wikiCoverage?.isImplemented).toBe(true);
    expect(wikiCoverage?.status).toBe('ACTIVE');
    expect(wikiCoverage?.candidateOutcomeReconciled).toBe(true);
    expect(wikiCoverage?.candidateOutcomeSum).toBe(wikiCoverage?.candidatesDiscovered);
    expect(report.coverageStatus).toBe('PARTIAL');
  });

  it('8. Clean wikilink stripping handles complex references, templates, and formatted text', () => {
    const raw = `| ''[[Indra (2002 film)|''Indra'']]'' <ref>{{Cite web |title=Indra |url=https://example.com}}</ref>`;
    const cleaned = wikipediaDiscoveryAdapter.cleanWikilink(raw);
    expect(cleaned).toBe('| Indra');
  });

  it('9. Reject placeholder strings from becoming directors or cast', async () => {
    const rawWikiTable = `
{| class="wikitable"
|-
! Title !! Director !! Cast
|-
| Test Unknown Movie || Director || Lead Actor, Supporting Actor
|}
`;
    const parsed = wikipediaDiscoveryAdapter.parseWikitextFilmography(rawWikiTable, 'te', 2024, 'List_of_Telugu_films_of_2024');
    expect(parsed.length).toBe(1);
    expect(parsed[0].directors).toEqual([]);
    expect(parsed[0].cast).toEqual([]);
  });

  it('10. Movies with missing director/cast are playable as guess but NOT playable as target', async () => {
    const candidateId = `test-wiki-incomplete-${Date.now()}`;
    const sourceMovieId = `WIKI_TE_2024_incomplete-sample-${Date.now()}`;

    // Seed temporary cache item with no director or cast
    (wikipediaDiscoveryAdapter as any).cache.set(sourceMovieId, {
      id: sourceMovieId,
      title: 'Incomplete Sample Film',
      originalTitle: 'Incomplete Sample Film',
      language: 'te',
      releaseYear: 2024,
      directors: [],
      cast: [],
      sourceArticleUrl: 'https://en.wikipedia.org/wiki/Test',
      attribution: 'Test CC BY-SA 4.0',
    });

    await prisma.ingestionCandidate.create({
      data: {
        id: candidateId,
        source: 'WIKIPEDIA',
        sourceMovieId,
        status: 'DISCOVERED',
        discoveryReason: 'Incomplete Test Discovery',
      },
    });

    const res = await ingestionService.processCandidate(candidateId);
    expect(res.status).toBe('REVIEW_REQUIRED');

    const movie = await prisma.movie.findFirst({
      where: { primaryTitle: 'Incomplete Sample Film' },
      include: { eligibility: true },
    });

    expect(movie).toBeDefined();
    expect(movie?.eligibility?.playableAsGuess).toBe(true);
    expect(movie?.eligibility?.playableAsTarget).toBe(false);
    expect(movie?.eligibility?.minimumMetadataComplete).toBe(false);
    expect(movie?.eligibility?.reviewStatus).toBe('PENDING');

    // Cleanup
    if (movie) {
      await prisma.gameEligibility.deleteMany({ where: { movieId: movie.id } });
      await prisma.movie.delete({ where: { id: movie.id } });
    }
    await prisma.ingestionCandidate.deleteMany({ where: { id: candidateId } });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'WIKIPEDIA',
        sourceRecordId: sourceMovieId,
      },
    });
  });
});
