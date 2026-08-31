import { DiscoverySourceStatus } from './discovery-source';

export type AcquisitionSourceType =
  | 'API'
  | 'BULK_FILE'
  | 'JSON_FEED'
  | 'CSV'
  | 'STRUCTURED_DATASET';

export interface StructuredCastMember {
  name: string;
  role?: string;
  order?: number;
}

export interface StructuredCrewMember {
  name: string;
  job: string;
  department?: string;
}

export interface StructuredImportMovieRecord {
  sourceId: string;
  title: string;
  originalTitle?: string;
  alternativeTitles?: string[];
  releaseDate?: string; // YYYY-MM-DD
  releaseYear: number;
  languages: string[]; // e.g. ['TELUGU'], ['HINDI']
  countries?: string[];
  industry?: string;
  directors: string[];
  musicDirectors?: string[];
  cast: StructuredCastMember[];
  crew?: StructuredCrewMember[];
  productionHouses?: string[];
  genres: string[];
  rating?: number;
  voteCount?: number;
  budget?: number;
  boxOffice?: number;
  externalIds?: {
    tmdbId?: string;
    wikidataId?: string;
    imdbId?: string;
    customSourceId?: string;
    [key: string]: string | undefined;
  };
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  runtime?: number;
  certification?: string;
}

export interface AcquisitionSourceInfo {
  name: string;
  code: string;
  sourceType: AcquisitionSourceType;
  supportedFormats: string[];
  isImplemented: boolean;
  status: DiscoverySourceStatus;
  description: string;
  maxBatchSize: number;
}

export interface MovieAcquisitionSource {
  readonly sourceCode: string;
  readonly sourceName: string;
  readonly sourceType: AcquisitionSourceType;
  readonly supportedFormats: string[];
  readonly isImplemented: boolean;
  readonly status: DiscoverySourceStatus;
  readonly description: string;
}

export class GenericCsvAcquisitionSource implements MovieAcquisitionSource {
  readonly sourceCode = 'GENERIC_CSV';
  readonly sourceName = 'Generic Structured CSV Dataset';
  readonly sourceType = 'CSV';
  readonly supportedFormats = ['CSV'];
  readonly isImplemented = true;
  readonly status: DiscoverySourceStatus = 'ACTIVE';
  readonly description =
    'Ingests structured RFC-4180 compliant CSV files with headers for title, year, language, cast, and directors.';
}

export class GenericJsonAcquisitionSource implements MovieAcquisitionSource {
  readonly sourceCode = 'GENERIC_JSON';
  readonly sourceName = 'Generic Structured JSON / NDJSON Feed';
  readonly sourceType = 'JSON_FEED';
  readonly supportedFormats = ['JSON', 'NDJSON'];
  readonly isImplemented = true;
  readonly status: DiscoverySourceStatus = 'ACTIVE';
  readonly description =
    'Ingests structured JSON array files or newline-delimited JSON (NDJSON) streaming feeds conforming to StructuredImportMovieRecord.';
}

export class ImdbBulkDatasetAcquisitionSource implements MovieAcquisitionSource {
  readonly sourceCode = 'IMDB_BULK_DATASET';
  readonly sourceName = 'IMDb Official Non-Commercial TSV Dumps';
  readonly sourceType = 'BULK_FILE';
  readonly supportedFormats = ['TSV', 'TSV_GZ'];
  readonly isImplemented = false;
  readonly status: DiscoverySourceStatus = 'NOT_IMPLEMENTED';
  readonly description =
    'Bulk ingestion adapter for title.basics and title.principals from datasets.imdbws.com (awaiting dedicated background ETL worker).';
}

export class AcquisitionSourceRegistry {
  private static instance: AcquisitionSourceRegistry;
  private sources: Map<string, MovieAcquisitionSource> = new Map();

  private constructor() {
    this.register(new GenericCsvAcquisitionSource());
    this.register(new GenericJsonAcquisitionSource());
    this.register(new ImdbBulkDatasetAcquisitionSource());
  }

  static getInstance(): AcquisitionSourceRegistry {
    if (!AcquisitionSourceRegistry.instance) {
      AcquisitionSourceRegistry.instance = new AcquisitionSourceRegistry();
    }
    return AcquisitionSourceRegistry.instance;
  }

  register(source: MovieAcquisitionSource): void {
    this.sources.set(source.sourceCode.toUpperCase(), source);
  }

  getSource(code: string): MovieAcquisitionSource | undefined {
    return this.sources.get(code.toUpperCase());
  }

  getRegisteredSources(): AcquisitionSourceInfo[] {
    return [
      {
        name: 'Generic Structured CSV Dataset',
        code: 'GENERIC_CSV',
        sourceType: 'CSV',
        supportedFormats: ['CSV'],
        isImplemented: true,
        status: 'ACTIVE',
        description:
          'Ingests structured RFC-4180 compliant CSV files with headers for title, year, language, cast, and directors.',
        maxBatchSize: 100,
      },
      {
        name: 'Generic Structured JSON / NDJSON Feed',
        code: 'GENERIC_JSON',
        sourceType: 'JSON_FEED',
        supportedFormats: ['JSON', 'NDJSON'],
        isImplemented: true,
        status: 'ACTIVE',
        description:
          'Ingests structured JSON array files or newline-delimited JSON (NDJSON) streaming feeds conforming to StructuredImportMovieRecord.',
        maxBatchSize: 200,
      },
      {
        name: 'IMDb Official Non-Commercial TSV Dumps',
        code: 'IMDB_BULK_DATASET',
        sourceType: 'BULK_FILE',
        supportedFormats: ['TSV', 'TSV_GZ'],
        isImplemented: false,
        status: 'NOT_IMPLEMENTED',
        description:
          'Bulk ingestion adapter for title.basics and title.principals from datasets.imdbws.com (awaiting dedicated background ETL worker).',
        maxBatchSize: 500,
      },
    ];
  }
}
