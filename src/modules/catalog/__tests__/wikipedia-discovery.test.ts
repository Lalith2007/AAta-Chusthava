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
        sourceMovieId: { in: ['WIKI_TE_2023_waltair-veerayya', 'WIKI_TE_1995_old-film'] },
      },
    });
    await prisma.rawSourceRecord.deleteMany({
      where: {
        source: 'WIKIPEDIA',
        sourceRecordId: { in: ['WIKI_TE_2023_waltair-veerayya', 'WIKI_TE_1995_old-film'] },
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
      year: 2023,
      page: 1,
      limit: 10,
    });

    expect(teResult.results.length).toBeGreaterThan(0);
    expect(teResult.results[0].title).toBeDefined();
    expect(teResult.results[0].originalLanguage).toBe('te');

    const hiResult = await wikipediaDiscoveryAdapter.discover({
      language: 'hi',
      year: 2023,
      page: 1,
      limit: 10,
    });

    expect(hiResult.results.length).toBeGreaterThan(0);
    expect(hiResult.results[0].title).toBeDefined();
    expect(hiResult.results[0].originalLanguage).toBe('hi');
  });

  it('3. Extracts candidate identity with language, year, and source', async () => {
    const identity = await wikipediaDiscoveryAdapter.getCandidateIdentity('WIKI_TE_2023_waltair-veerayya');

    expect(identity.source).toBe('WIKIPEDIA');
    expect(identity.title).toBe('Waltair Veerayya');
    expect(identity.releaseYear).toBe(2023);
    expect(identity.primaryLanguage).toBe('TELUGU');
  });

  it('4. Retains source provenance and CC BY-SA 4.0 attribution in metadata', async () => {
    const metadata = await wikipediaDiscoveryAdapter.getMetadata('WIKI_TE_2023_waltair-veerayya');

    expect(metadata.overview).toContain('CC BY-SA 4.0');
    expect(metadata.genres.length).toBeGreaterThan(0);
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
});
