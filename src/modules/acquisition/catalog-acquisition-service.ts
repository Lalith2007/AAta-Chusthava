import { prisma } from '@/infrastructure/db/client';
import { StructuredImportMovieRecord } from '@/infrastructure/external-sources/acquisition-source';
import { DatasetParser } from './dataset-parser';
import { MovieLanguage, MovieIndustry, RoleType } from '@/domain/movie/types';

export interface CreateImportJobParams {
  sourceCode: string;
  sourceType?: string;
  format?: 'CSV' | 'JSON' | 'NDJSON' | 'API';
  inputReference: string;
}

export interface RunImportJobOptions {
  batchSize?: number;
  dryRun?: boolean;
}

export interface AcquisitionJobOutcome {
  jobId: string;
  status: string;
  recordsDiscovered: number;
  recordsProcessed: number;
  recordsAccepted: number;
  recordsMatched: number;
  recordsDuplicated: number;
  recordsReviewed: number;
  recordsRejected: number;
  recordsFailed: number;
  checkpointRow: number;
  completedAt?: Date;
  errors: string[];
}

export class CatalogAcquisitionService {
  /**
   * Creates a new Catalog Import Job in the database.
   */
  async createImportJob(params: CreateImportJobParams) {
    return prisma.catalogImportJob.create({
      data: {
        sourceCode: params.sourceCode.toUpperCase(),
        sourceType: params.sourceType || 'CSV',
        format: params.format || 'CSV',
        inputReference: params.inputReference,
        status: 'QUEUED',
      },
    });
  }

  /**
   * Executes a Catalog Import Job with chunking, checkpointing, and error isolation.
   */
  async runImportJob(
    jobId: string,
    payloadContent: string,
    options?: RunImportJobOptions
  ): Promise<AcquisitionJobOutcome> {
    const job = await prisma.catalogImportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`CatalogImportJob '${jobId}' not found`);
    }

    const batchSize = options?.batchSize || 25;
    const dryRun = options?.dryRun || false;

    // Parse input payload
    const parsed =
      job.format === 'JSON' || job.format === 'NDJSON'
        ? DatasetParser.parseJson(payloadContent)
        : DatasetParser.parseCsv(payloadContent);

    const totalDiscovered = parsed.totalRows;
    const isRestart = job.checkpointRow === 0;
    let recordsProcessed = isRestart ? 0 : job.recordsProcessed;
    let recordsAccepted = isRestart ? 0 : job.recordsAccepted;
    let recordsMatched = isRestart ? 0 : job.recordsMatched;
    let recordsDuplicated = isRestart ? 0 : job.recordsDuplicated;
    let recordsReviewed = isRestart ? 0 : job.recordsReviewed;
    let recordsRejected = isRestart ? 0 : job.recordsRejected;
    let recordsFailed = isRestart ? parsed.malformedRows.length : job.recordsFailed + parsed.malformedRows.length;
    let startRow = job.checkpointRow;
    const errors: string[] = parsed.malformedRows.map(
      (m) => `Row ${m.rowNumber}: ${m.error} | Raw: ${m.raw}`
    );

    if (!dryRun) {
      await prisma.catalogImportJob.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          recordsDiscovered: totalDiscovered,
          recordsFailed,
          startedAt: job.startedAt || new Date(),
        },
      });
    }

    // Process valid records in batches from checkpoint
    for (let i = startRow; i < parsed.records.length; i++) {
      const record = parsed.records[i];

      try {
        if (!dryRun) {
          const outcome = await this.processRecord(record, job.sourceCode);
          if (outcome === 'NEW_CANONICAL') {
            recordsAccepted++;
          } else if (outcome === 'MATCHED_EXISTING') {
            recordsMatched++;
            recordsDuplicated++;
          } else if (outcome === 'DUPLICATE') {
            recordsDuplicated++;
          } else if (outcome === 'REVIEW') {
            recordsReviewed++;
          } else if (outcome === 'REJECTED') {
            recordsRejected++;
          }
        } else {
          // Dry-run simulation mode
          recordsAccepted++;
        }
        recordsProcessed++;
      } catch (err: any) {
        recordsFailed++;
        errors.push(`Record ${record.sourceId} (${record.title}): ${err?.message || err}`);
      }

      // Checkpoint every batchSize or at the end
      if (!dryRun && ((i + 1) % batchSize === 0 || i === parsed.records.length - 1)) {
        await prisma.catalogImportJob.update({
          where: { id: jobId },
          data: {
            recordsProcessed,
            recordsAccepted,
            recordsMatched,
            recordsDuplicated,
            recordsReviewed,
            recordsRejected,
            recordsFailed,
            checkpointRow: i + 1,
            lastError: errors.length > 0 ? errors[errors.length - 1] : null,
            updatedAt: new Date(),
          },
        });
      }
    }

    const finalStatus =
      recordsFailed > 0 && recordsAccepted === 0
        ? 'FAILED'
        : recordsFailed > 0
        ? 'PARTIAL'
        : 'COMPLETED';

    const completedAt = new Date();

    if (!dryRun) {
      await prisma.catalogImportJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          recordsProcessed,
          recordsAccepted,
          recordsMatched,
          recordsDuplicated,
          recordsReviewed,
          recordsRejected,
          recordsFailed,
          checkpointRow: parsed.records.length,
          completedAt,
        },
      });
    }

    return {
      jobId,
      status: dryRun ? 'DRY_RUN_SUCCESS' : finalStatus,
      recordsDiscovered: totalDiscovered,
      recordsProcessed,
      recordsAccepted,
      recordsMatched,
      recordsDuplicated,
      recordsReviewed,
      recordsRejected,
      recordsFailed,
      checkpointRow: parsed.records.length,
      completedAt,
      errors,
    };
  }

  /**
   * Pauses an active job.
   */
  async pauseJob(jobId: string) {
    return prisma.catalogImportJob.update({
      where: { id: jobId },
      data: { status: 'PAUSED' },
    });
  }

  /**
   * Resumes a paused or partial job from its checkpoint.
   */
  async resumeJob(jobId: string, payloadContent: string, options?: RunImportJobOptions) {
    return this.runImportJob(jobId, payloadContent, options);
  }

  /**
   * Retrieves import jobs with optional filtering.
   */
  async getImportJobs(filters?: { status?: string; sourceCode?: string; limit?: number }) {
    return prisma.catalogImportJob.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.sourceCode ? { sourceCode: filters.sourceCode.toUpperCase() } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  /**
   * Retrieves a single import job by ID.
   */
  async getJobById(jobId: string) {
    return prisma.catalogImportJob.findUnique({ where: { id: jobId } });
  }

  // --- Internal Ingestion & Normalization Logic ---

  private async processRecord(
    record: StructuredImportMovieRecord,
    sourceCode: string
  ): Promise<'NEW_CANONICAL' | 'MATCHED_EXISTING' | 'DUPLICATE' | 'REVIEW' | 'REJECTED'> {
    // 1. Deduplication Check
    const existingMovie = await this.findExistingCanonicalMovie(record);

    if (existingMovie) {
      // Record candidate as DUPLICATE_CANONICAL_MATCH
      try {
        await prisma.ingestionCandidate.upsert({
          where: {
            source_sourceMovieId: {
              source: sourceCode,
              sourceMovieId: record.sourceId,
            },
          },
          create: {
            source: sourceCode,
            sourceMovieId: record.sourceId,
            status: 'DUPLICATE',
            processedAt: new Date(),
            resolutionReason: 'DUPLICATE_CANONICAL_MATCH',
            duplicateOfMovieId: existingMovie.id,
          },
          update: {
            status: 'DUPLICATE',
            processedAt: new Date(),
            resolutionReason: 'DUPLICATE_CANONICAL_MATCH',
            duplicateOfMovieId: existingMovie.id,
          },
        });
      } catch (e) {
        // P2002 safe handling
      }

      // Enrich existing movie with external IDs if present
      const updates: any = {};
      if (record.externalIds?.tmdbId && !existingMovie.tmdbId) {
        const parsedTmdb = parseInt(record.externalIds.tmdbId, 10);
        if (!isNaN(parsedTmdb)) updates.tmdbId = parsedTmdb;
      }
      if (record.externalIds?.wikidataId && !existingMovie.wikidataId) {
        updates.wikidataId = record.externalIds.wikidataId;
      }
      if (record.externalIds?.imdbId && !existingMovie.imdbId) {
        updates.imdbId = record.externalIds.imdbId;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: updates,
        });
        return 'MATCHED_EXISTING';
      }

      return 'DUPLICATE';
    }

    // 2. New Canonical Movie Ingestion
    const slug = this.slugify(record.title, record.releaseYear);
    const primaryLang = this.mapLanguage(record.languages[0] || 'TELUGU');
    const supportedLanguages = record.languages.map((l) => this.mapLanguage(l));
    const industry = this.mapIndustry(primaryLang);

    const tmdbIdNum = record.externalIds?.tmdbId
      ? parseInt(record.externalIds.tmdbId, 10)
      : null;

    const movie = await prisma.movie.create({
      data: {
        slug,
        primaryTitle: record.title,
        originalTitle: record.originalTitle || record.title,
        alternativeTitles: record.alternativeTitles || [],
        supportedLanguages: supportedLanguages.length > 0 ? supportedLanguages : [primaryLang],
        industries: [industry],
        countries: record.countries || ['IN'],
        releaseYear: record.releaseYear,
        releaseDate: record.releaseDate ? new Date(record.releaseDate) : null,
        canonicalIndiaReleaseDate: record.releaseDate ? new Date(record.releaseDate) : null,
        budget: record.budget || null,
        boxOffice: record.boxOffice || null,
        boxOfficeStatus: record.boxOffice ? 'REPORTED' : 'UNKNOWN',
        rating: record.rating || null,
        ratingVoteCount: record.voteCount || 0,
        posterAsset: record.posterUrl || null,
        backdropAsset: record.backdropUrl || null,
        tmdbId: tmdbIdNum && !isNaN(tmdbIdNum) ? tmdbIdNum : null,
        wikidataId: record.externalIds?.wikidataId || null,
        imdbId: record.externalIds?.imdbId || null,
        lifecycleStatus: 'ACTIVE',
      },
    });

    // 3. Ingest Genres
    if (record.genres && record.genres.length > 0) {
      for (const genreName of record.genres) {
        const gSlug = genreName.toLowerCase().replace(/[^\w]/g, '-');
        let genreRecord = await prisma.genre.findUnique({ where: { slug: gSlug } });
        if (!genreRecord) {
          genreRecord = await prisma.genre.create({
            data: { canonicalName: genreName, slug: gSlug },
          });
        }
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: { movieId: movie.id, genreId: genreRecord.id },
          },
          create: { movieId: movie.id, genreId: genreRecord.id },
          update: {},
        });
      }
    }

    // 4. Ingest Directors
    for (let i = 0; i < record.directors.length; i++) {
      const d = record.directors[i];
      let person = await prisma.person.findFirst({
        where: { canonicalName: { equals: d, mode: 'insensitive' } },
      });
      if (!person) {
        person = await prisma.person.create({
          data: { canonicalName: d },
        });
      }
      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'DIRECTOR',
            relationType: 'CREW',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'DIRECTOR',
          relationType: 'CREW',
          job: 'Director',
          department: 'Directing',
          billingOrder: i,
        },
        update: {},
      });
    }

    // 5. Ingest Music Directors
    if (record.musicDirectors) {
      for (let i = 0; i < record.musicDirectors.length; i++) {
        const md = record.musicDirectors[i];
        let person = await prisma.person.findFirst({
          where: { canonicalName: { equals: md, mode: 'insensitive' } },
        });
        if (!person) {
          person = await prisma.person.create({
            data: { canonicalName: md },
          });
        }
        await prisma.moviePerson.upsert({
          where: {
            movieId_personId_roleType_relationType: {
              movieId: movie.id,
              personId: person.id,
              roleType: 'MUSIC_DIRECTOR',
              relationType: 'CREW',
            },
          },
          create: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'MUSIC_DIRECTOR',
            relationType: 'CREW',
            job: 'Music Director',
            department: 'Sound',
            billingOrder: i + 1,
          },
          update: {},
        });
      }
    }

    // 6. Ingest Cast
    for (let i = 0; i < record.cast.length; i++) {
      const c = record.cast[i];
      let person = await prisma.person.findFirst({
        where: { canonicalName: { equals: c.name, mode: 'insensitive' } },
      });
      if (!person) {
        person = await prisma.person.create({
          data: { canonicalName: c.name },
        });
      }
      const roleType: RoleType = i < 2 ? 'LEAD' : 'SUPPORTING';
      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType,
            relationType: 'CAST',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType,
          relationType: 'CAST',
          characterName: c.role || (i < 2 ? 'Lead' : 'Supporting'),
          billingOrder: i,
        },
        update: {},
      });
    }

    // 7. Game Eligibility
    const hasDirector = record.directors.length > 0;
    const hasCast = record.cast.length >= 2;
    const isTargetPlayable = hasDirector && hasCast && !!movie.releaseYear;

    await prisma.gameEligibility.upsert({
      where: { movieId: movie.id },
      create: {
        movieId: movie.id,
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: hasDirector && hasCast,
        reviewStatus: isTargetPlayable ? 'APPROVED' : 'PENDING',
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: isTargetPlayable,
        minimumMetadataComplete: hasDirector && hasCast,
        reviewStatus: isTargetPlayable ? 'APPROVED' : 'PENDING',
      },
    });

    // 7. Provenance Ingestion Candidate Record
    try {
      await prisma.ingestionCandidate.upsert({
        where: {
          source_sourceMovieId: {
            source: sourceCode,
            sourceMovieId: record.sourceId,
          },
        },
        create: {
          source: sourceCode,
          sourceMovieId: record.sourceId,
          status: 'VALIDATED',
          processedAt: new Date(),
          resolutionReason: 'ACCEPTED_NEW_CANONICAL',
        },
        update: {
          status: 'VALIDATED',
          processedAt: new Date(),
          resolutionReason: 'ACCEPTED_NEW_CANONICAL',
        },
      });
    } catch (e) {
      // Safe fallback
    }

    return 'NEW_CANONICAL';
  }

  private async findExistingCanonicalMovie(record: StructuredImportMovieRecord) {
    // 1. Match by External IDs
    if (record.externalIds?.tmdbId) {
      const parsedTmdb = parseInt(record.externalIds.tmdbId, 10);
      if (!isNaN(parsedTmdb)) {
        const match = await prisma.movie.findFirst({
          where: { tmdbId: parsedTmdb },
        });
        if (match) return match;
      }
    }

    if (record.externalIds?.wikidataId) {
      const match = await prisma.movie.findFirst({
        where: { wikidataId: record.externalIds.wikidataId },
      });
      if (match) return match;
    }

    if (record.externalIds?.imdbId) {
      const match = await prisma.movie.findFirst({
        where: { imdbId: record.externalIds.imdbId },
      });
      if (match) return match;
    }

    // 2. Match by Slug (exact title + year)
    const slug = this.slugify(record.title, record.releaseYear);
    const matchBySlug = await prisma.movie.findUnique({
      where: { slug },
    });
    if (matchBySlug) return matchBySlug;

    // 3. Match by Title & Year
    const matchByTitleYear = await prisma.movie.findFirst({
      where: {
        primaryTitle: { equals: record.title.trim(), mode: 'insensitive' },
        releaseYear: record.releaseYear,
      },
    });
    if (matchByTitleYear) return matchByTitleYear;

    return null;
  }

  private slugify(title: string, year: number): string {
    const clean = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');
    return `${clean}-${year}`;
  }

  private mapLanguage(lang: string): MovieLanguage {
    const l = lang.trim().toUpperCase();
    if (l === 'TELUGU' || l === 'TE') return 'TELUGU';
    if (l === 'HINDI' || l === 'HI') return 'HINDI';
    if (l === 'TAMIL' || l === 'TA') return 'TAMIL';
    if (l === 'MALAYALAM' || l === 'ML') return 'MALAYALAM';
    if (l === 'KANNADA' || l === 'KN') return 'KANNADA';
    return 'OTHER';
  }

  private mapIndustry(lang: MovieLanguage): MovieIndustry {
    switch (lang) {
      case 'TELUGU':
        return 'TOLLYWOOD';
      case 'HINDI':
        return 'BOLLYWOOD';
      case 'TAMIL':
        return 'KOLLYWOOD';
      case 'MALAYALAM':
        return 'MOLLYWOOD';
      case 'KANNADA':
        return 'SANDALWOOD';
      default:
        return 'OTHER';
    }
  }
}

export const catalogAcquisitionService = new CatalogAcquisitionService();
