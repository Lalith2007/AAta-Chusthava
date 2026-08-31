import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DatasetParser } from '../dataset-parser';
import { catalogAcquisitionService } from '../catalog-acquisition-service';
import { AcquisitionSourceRegistry } from '@/infrastructure/external-sources/acquisition-source';
import { prisma } from '@/infrastructure/db/client';

describe('Generic Catalog Acquisition Framework', () => {
  describe('1. Dataset Parser (CSV & JSON Parsing & Error Isolation)', () => {
    it('parses RFC-4180 compliant CSV with headers and arrays', () => {
      const csv = `title,releaseYear,languages,directors,cast,genres,overview
"Test Movie 1",2020,"TELUGU","Director One","Actor A, Actor B","Action, Drama","A test synopsis"
"Test Movie 2",2021,"HINDI","Director Two","Actor C, Actor D","Comedy","Another synopsis"`;

      const result = DatasetParser.parseCsv(csv);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.records[0].title).toBe('Test Movie 1');
      expect(result.records[0].releaseYear).toBe(2020);
      expect(result.records[0].languages).toEqual(['TELUGU']);
      expect(result.records[0].directors).toEqual(['Director One']);
      expect(result.records[0].cast.length).toBe(2);
      expect(result.records[0].genres).toEqual(['Action', 'Drama']);
    });

    it('isolates malformed CSV rows without aborting valid records', () => {
      const csv = `title,releaseYear,languages,directors,cast,genres
"Valid Movie A",2019,"TELUGU","Director A","Actor A1, Actor A2","Drama"
"",2020,"TELUGU","Director B","Actor B1, Actor B2","Action"
"Valid Movie C",1800,"TELUGU","Director C","Actor C1, Actor C2","Action"
"Valid Movie D",2022,"HINDI","Director D","Actor D1, Actor D2","Comedy"`;

      const result = DatasetParser.parseCsv(csv);
      expect(result.totalRows).toBe(4);
      expect(result.validCount).toBe(2); // Movie A and Movie D
      expect(result.invalidCount).toBe(2); // Missing title and Year 1800 (< 1900)
      expect(result.malformedRows.length).toBe(2);
      expect(result.malformedRows[0].error).toContain('title');
      expect(result.malformedRows[1].error).toContain('releaseYear');
      expect(result.records[0].title).toBe('Valid Movie A');
      expect(result.records[1].title).toBe('Valid Movie D');
    });

    it('parses structured JSON array and isolates invalid items', () => {
      const json = JSON.stringify([
        {
          title: 'JSON Movie 1',
          releaseYear: 2018,
          languages: ['TELUGU'],
          directors: ['Director Alpha'],
          cast: ['Lead 1', 'Lead 2'],
          genres: ['Thriller'],
        },
        {
          // missing title
          releaseYear: 2018,
          directors: ['Director Beta'],
          cast: ['Lead 1'],
        },
        {
          title: 'JSON Movie 3',
          releaseYear: 2023,
          languages: ['HINDI'],
          directors: ['Director Gamma'],
          cast: ['Star 1', 'Star 2'],
          genres: ['Romance'],
        },
      ]);

      const result = DatasetParser.parseJson(json);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(1);
      expect(result.records[0].title).toBe('JSON Movie 1');
      expect(result.records[1].title).toBe('JSON Movie 3');
      expect(result.malformedRows[0].error).toContain('title');
    });

    it('parses NDJSON (Newline Delimited JSON) streams', () => {
      const ndjson = `{"title": "NDJSON Movie 1", "releaseYear": 2015, "languages": ["TELUGU"], "directors": ["Dir 1"], "cast": ["Cast 1", "Cast 2"], "genres": ["Action"]}
{"invalid json line
{"title": "NDJSON Movie 2", "releaseYear": 2016, "languages": ["HINDI"], "directors": ["Dir 2"], "cast": ["Cast 3", "Cast 4"], "genres": ["Drama"]}`;

      const result = DatasetParser.parseJson(ndjson);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(1);
      expect(result.records[0].title).toBe('NDJSON Movie 1');
      expect(result.records[1].title).toBe('NDJSON Movie 2');
    });
  });

  describe('2. Acquisition Source Registry', () => {
    it('registers standard acquisition sources and formats', () => {
      const registry = AcquisitionSourceRegistry.getInstance();
      const sources = registry.getRegisteredSources();

      expect(sources.length).toBeGreaterThanOrEqual(2);

      const csvSource = sources.find((s) => s.code === 'GENERIC_CSV');
      expect(csvSource).toBeDefined();
      expect(csvSource?.status).toBe('ACTIVE');
      expect(csvSource?.supportedFormats).toContain('CSV');

      const jsonSource = sources.find((s) => s.code === 'GENERIC_JSON');
      expect(jsonSource).toBeDefined();
      expect(jsonSource?.status).toBe('ACTIVE');
      expect(jsonSource?.supportedFormats).toContain('JSON');
      expect(jsonSource?.supportedFormats).toContain('NDJSON');

      const imdbSource = sources.find((s) => s.code === 'IMDB_BULK_DATASET');
      expect(imdbSource).toBeDefined();
      expect(imdbSource?.status).toBe('NOT_IMPLEMENTED');
    });
  });

  describe('3. Catalog Acquisition Service (Job Lifecycle & Resumability)', () => {
    let createdJobId: string | null = null;
    const testMovieSlug = 'fixture-test-movie-acquisition-2024';

    afterAll(async () => {
      // Clean up any test fixtures from database
      if (createdJobId) {
        await prisma.catalogImportJob.deleteMany({ where: { id: createdJobId } });
      }
      const testMovie = await prisma.movie.findUnique({ where: { slug: testMovieSlug } });
      if (testMovie) {
        await prisma.gameEligibility.deleteMany({ where: { movieId: testMovie.id } });
        await prisma.moviePerson.deleteMany({ where: { movieId: testMovie.id } });
        await prisma.movie.delete({ where: { id: testMovie.id } });
      }
      await prisma.ingestionCandidate.deleteMany({
        where: { source: 'TEST_FIXTURE' },
      });
    });

    it('creates an import job with QUEUED status', async () => {
      const job = await catalogAcquisitionService.createImportJob({
        sourceCode: 'TEST_FIXTURE',
        sourceType: 'CSV',
        format: 'CSV',
        inputReference: 'test_dataset.csv',
      });

      createdJobId = job.id;
      expect(job).toBeDefined();
      expect(job.status).toBe('QUEUED');
      expect(job.sourceCode).toBe('TEST_FIXTURE');
      expect(job.recordsDiscovered).toBe(0);
      expect(job.checkpointRow).toBe(0);
    });

    it('executes dry-run simulation mode without mutating the canonical database', async () => {
      const initialMovieCount = await prisma.movie.count();
      const csv = `title,releaseYear,languages,directors,cast,genres
"Simulation Film",2022,"TELUGU","Simulation Director","Actor 1, Actor 2","Sci-Fi"`;

      const outcome = await catalogAcquisitionService.runImportJob(createdJobId!, csv, {
        dryRun: true,
      });

      expect(outcome.status).toBe('DRY_RUN_SUCCESS');
      expect(outcome.recordsDiscovered).toBe(1);
      expect(outcome.recordsAccepted).toBe(1);

      const afterMovieCount = await prisma.movie.count();
      expect(afterMovieCount).toBe(initialMovieCount); // Unchanged
    });

    it('processes batch import with deduplication and candidate provenance', async () => {
      const existingSlug = 'fixture-preexisting-movie-2020';
      // Ensure existing movie is present in DB for deduplication verification
      await prisma.movie.upsert({
        where: { slug: existingSlug },
        create: {
          slug: existingSlug,
          primaryTitle: 'Fixture Preexisting Movie',
          originalTitle: 'Fixture Preexisting Movie',
          releaseYear: 2020,
          supportedLanguages: ['TELUGU'],
          industries: ['TOLLYWOOD'],
          countries: ['IN'],
          lifecycleStatus: 'ACTIVE',
        },
        update: {},
      });

      // Row 1: Duplicate of the preexisting canonical movie
      // Row 2: Malformed row
      // Row 3: New isolated test candidate
      const csv = `title,releaseYear,languages,directors,cast,genres,overview
"Fixture Preexisting Movie",2020,"TELUGU","Existing Director","Actor A, Actor B","Drama","Existing canonical movie"
"",2020,"TELUGU","Bad Director","Actor","Malformed Row"
"Fixture Test Movie Acquisition",2024,"TELUGU","Fixture Director","Actor 1, Actor 2","Action","Test movie"`;

      const outcome = await catalogAcquisitionService.runImportJob(createdJobId!, csv, {
        batchSize: 2,
      });

      expect(outcome.status).toBe('PARTIAL'); // Because 1 row was malformed
      expect(outcome.recordsDiscovered).toBe(3);
      expect(outcome.recordsProcessed).toBe(2);
      expect(outcome.recordsDuplicated).toBeGreaterThanOrEqual(1); // Preexisting movie matched existing
      expect(outcome.recordsAccepted).toBe(1); // Fixture movie created
      expect(outcome.recordsFailed).toBe(1); // Malformed row
      expect(outcome.checkpointRow).toBe(2); // Processed both valid records

      // Verify deduplication candidate in IngestionCandidate
      const duplicateCandidate = await prisma.ingestionCandidate.findFirst({
        where: { source: 'TEST_FIXTURE', status: 'DUPLICATE' },
      });
      expect(duplicateCandidate).toBeDefined();
      expect(duplicateCandidate?.resolutionReason).toBe('DUPLICATE_CANONICAL_MATCH');

      // Verify new movie created with GameEligibility
      const newMovie = await prisma.movie.findUnique({
        where: { slug: testMovieSlug },
        include: { eligibility: true },
      });
      expect(newMovie).toBeDefined();
      expect(newMovie?.primaryTitle).toBe('Fixture Test Movie Acquisition');
      expect(newMovie?.eligibility?.playableAsGuess).toBe(true);
      expect(newMovie?.eligibility?.playableAsTarget).toBe(true);

      // Clean up preexisting fixture movie
      const preExisting = await prisma.movie.findUnique({ where: { slug: existingSlug } });
      if (preExisting) {
        await prisma.gameEligibility.deleteMany({ where: { movieId: preExisting.id } });
        await prisma.moviePerson.deleteMany({ where: { movieId: preExisting.id } });
        await prisma.movie.delete({ where: { id: preExisting.id } });
      }
    });

    it('demonstrates idempotency: re-running the same import job produces zero duplicates', async () => {
      const csv = `title,releaseYear,languages,directors,cast,genres
"Fixture Test Movie Acquisition",2024,"TELUGU","Fixture Director","Actor 1, Actor 2","Action"`;

      // Reset checkpoint to 0 to re-run from start
      await prisma.catalogImportJob.update({
        where: { id: createdJobId! },
        data: { checkpointRow: 0, status: 'RUNNING' },
      });

      const outcome = await catalogAcquisitionService.runImportJob(createdJobId!, csv);

      expect(outcome.status).toBe('COMPLETED');
      expect(outcome.recordsProcessed).toBeGreaterThanOrEqual(1);
      // Now that Fixture Test Movie Acquisition already exists, it is matched as duplicate
      expect(outcome.recordsDuplicated).toBeGreaterThanOrEqual(1);

      // Verify database still has exactly one record with that slug
      const movies = await prisma.movie.findMany({
        where: { slug: testMovieSlug },
      });
      expect(movies.length).toBe(1);
    });
  });
});
