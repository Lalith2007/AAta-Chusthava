import { StructuredImportMovieRecord } from '@/infrastructure/external-sources/acquisition-source';

export interface MalformedRowError {
  rowNumber: number;
  raw: string;
  error: string;
}

export interface ParsedDatasetResult {
  records: StructuredImportMovieRecord[];
  malformedRows: MalformedRowError[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

export class DatasetParser {
  /**
   * Parses an RFC 4180 compliant CSV string into validated structured movie records.
   * Isolates malformed rows so a single bad row never aborts the import.
   */
  static parseCsv(csvContent: string, options?: { delimiter?: string }): ParsedDatasetResult {
    const delimiter = options?.delimiter || ',';
    const lines = this.splitCsvLines(csvContent);

    if (lines.length === 0) {
      return { records: [], malformedRows: [], totalRows: 0, validCount: 0, invalidCount: 0 };
    }

    const headerLine = lines[0];
    const headers = this.parseCsvRow(headerLine, delimiter).map((h) =>
      h.trim().toLowerCase().replace(/[\s_-]+/g, '')
    );

    const records: StructuredImportMovieRecord[] = [];
    const malformedRows: MalformedRowError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip empty lines

      try {
        const values = this.parseCsvRow(line, delimiter);
        const rowMap: Record<string, string> = {};
        headers.forEach((header, idx) => {
          rowMap[header] = values[idx] !== undefined ? values[idx].trim() : '';
        });

        const record = this.mapRowToStructuredRecord(rowMap, i + 1);
        records.push(record);
      } catch (err: any) {
        malformedRows.push({
          rowNumber: i + 1,
          raw: line.length > 200 ? line.slice(0, 200) + '...' : line,
          error: err?.message || 'Unknown parsing error',
        });
      }
    }

    return {
      records,
      malformedRows,
      totalRows: records.length + malformedRows.length,
      validCount: records.length,
      invalidCount: malformedRows.length,
    };
  }

  /**
   * Parses JSON array or NDJSON (Newline Delimited JSON) into structured movie records.
   */
  static parseJson(jsonContent: string): ParsedDatasetResult {
    const trimmed = jsonContent.trim();
    const records: StructuredImportMovieRecord[] = [];
    const malformedRows: MalformedRowError[] = [];

    if (!trimmed) {
      return { records: [], malformedRows: [], totalRows: 0, validCount: 0, invalidCount: 0 };
    }

    // Try parsing as standard JSON array first
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
          throw new Error('Root JSON payload must be an array of movie records');
        }

        parsed.forEach((item: any, idx: number) => {
          try {
            const record = this.validateAndNormalizeJsonRecord(item, idx + 1);
            records.push(record);
          } catch (err: any) {
            malformedRows.push({
              rowNumber: idx + 1,
              raw: JSON.stringify(item).slice(0, 200),
              error: err?.message || 'Invalid record structure',
            });
          }
        });

        return {
          records,
          malformedRows,
          totalRows: records.length + malformedRows.length,
          validCount: records.length,
          invalidCount: malformedRows.length,
        };
      } catch (err: any) {
        // If JSON array parse failed, attempt NDJSON line-by-line fallback
      }
    }

    // Parse as NDJSON (Newline Delimited JSON)
    const lines = trimmed.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const l = line.trim();
      if (!l) return;
      try {
        const parsed = JSON.parse(l);
        const record = this.validateAndNormalizeJsonRecord(parsed, idx + 1);
        records.push(record);
      } catch (err: any) {
        malformedRows.push({
          rowNumber: idx + 1,
          raw: l.slice(0, 200),
          error: err?.message || 'Invalid JSON syntax',
        });
      }
    });

    return {
      records,
      malformedRows,
      totalRows: records.length + malformedRows.length,
      validCount: records.length,
      invalidCount: malformedRows.length,
    };
  }

  // --- Internal Helper Methods ---

  private static splitCsvLines(csv: string): string[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && csv[i + 1] === '\n') {
          i++; // skip \n of \r\n
        }
        if (current.trim()) {
          lines.push(current);
        }
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      lines.push(current);
    }
    return lines;
  }

  private static parseCsvRow(row: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private static mapRowToStructuredRecord(
    row: Record<string, string>,
    rowNumber: number
  ): StructuredImportMovieRecord {
    const title = row['title'] || row['primarytitle'] || row['movietitle'] || row['name'];
    if (!title || title.trim().length === 0) {
      throw new Error(`Row ${rowNumber}: Missing required field 'title'`);
    }

    const yearStr =
      row['releaseyear'] || row['year'] || row['releasedate']?.slice(0, 4) || row['yearofrelease'];
    const releaseYear = parseInt(yearStr, 10);
    if (isNaN(releaseYear) || releaseYear < 1900 || releaseYear > 2100) {
      throw new Error(
        `Row ${rowNumber}: Invalid 'releaseYear' (${yearStr}). Must be an integer between 1900 and 2100`
      );
    }

    const sourceId =
      row['sourceid'] || row['id'] || row['movieid'] || `REC_${releaseYear}_${rowNumber}`;

    const rawLang = row['languages'] || row['language'] || row['originallanguage'] || 'TELUGU';
    const languages = this.normalizeLanguages(rawLang);

    const rawDirectors = row['directors'] || row['director'] || row['directedby'] || '';
    const directors = this.splitList(rawDirectors);
    if (directors.length === 0) {
      throw new Error(`Row ${rowNumber}: Movie must have at least one director listed`);
    }

    const rawCast = row['cast'] || row['actors'] || row['starring'] || '';
    const castNames = this.splitList(rawCast);
    const cast = castNames.map((name, idx) => ({
      name,
      order: idx,
    }));

    const rawGenres = row['genres'] || row['genre'] || 'Drama';
    const genres = this.splitList(rawGenres);

    const budgetStr = row['budget'];
    const budget = budgetStr ? parseFloat(budgetStr.replace(/[^0-9.]/g, '')) : undefined;

    const boxOfficeStr = row['boxoffice'] || row['revenue'];
    const boxOffice = boxOfficeStr ? parseFloat(boxOfficeStr.replace(/[^0-9.]/g, '')) : undefined;

    const ratingStr = row['rating'] || row['voteaverage'] || row['score'];
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;

    const voteCountStr = row['votecount'] || row['votes'];
    const voteCount = voteCountStr ? parseInt(voteCountStr, 10) : undefined;

    const tmdbId = row['tmdbid'] || undefined;
    const wikidataId = row['wikidataid'] || undefined;
    const imdbId = row['imdbid'] || undefined;

    return {
      sourceId,
      title: title.trim(),
      originalTitle: row['originaltitle']?.trim() || undefined,
      alternativeTitles: row['alternativetitles']
        ? this.splitList(row['alternativetitles'])
        : undefined,
      releaseDate: row['releasedate'] || `${releaseYear}-01-01`,
      releaseYear,
      languages,
      directors,
      musicDirectors: row['musicdirectors'] || row['musicdirector']
        ? this.splitList(row['musicdirectors'] || row['musicdirector'])
        : undefined,
      cast,
      genres,
      overview: row['overview'] || row['synopsis'] || row['description'] || undefined,
      runtime: row['runtime'] ? parseInt(row['runtime'], 10) : undefined,
      budget: budget && !isNaN(budget) ? budget : undefined,
      boxOffice: boxOffice && !isNaN(boxOffice) ? boxOffice : undefined,
      rating: rating && !isNaN(rating) ? rating : undefined,
      voteCount: voteCount && !isNaN(voteCount) ? voteCount : undefined,
      externalIds: {
        tmdbId,
        wikidataId,
        imdbId,
      },
      posterUrl: row['posterurl'] || row['poster'] || undefined,
      backdropUrl: row['backdropurl'] || row['backdrop'] || undefined,
    };
  }

  private static validateAndNormalizeJsonRecord(
    record: any,
    rowNumber: number
  ): StructuredImportMovieRecord {
    if (!record || typeof record !== 'object') {
      throw new Error(`Record ${rowNumber}: Must be a valid JSON object`);
    }

    const title = record.title || record.primaryTitle || record.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new Error(`Record ${rowNumber}: Missing required string property 'title'`);
    }

    const releaseYear =
      typeof record.releaseYear === 'number'
        ? record.releaseYear
        : parseInt(record.releaseYear || record.year, 10);
    if (isNaN(releaseYear) || releaseYear < 1900 || releaseYear > 2100) {
      throw new Error(`Record ${rowNumber}: Invalid 'releaseYear'. Must be between 1900 and 2100`);
    }

    const sourceId = String(record.sourceId || record.id || `JSON_${releaseYear}_${rowNumber}`);

    const languages = Array.isArray(record.languages)
      ? record.languages.map((l: string) => this.normalizeLanguageEnum(l))
      : this.normalizeLanguages(record.language || record.primaryLanguage || 'TELUGU');

    const directors = Array.isArray(record.directors)
      ? record.directors.map((d: any) => (typeof d === 'string' ? d.trim() : d.name)).filter(Boolean)
      : this.splitList(String(record.director || record.directedBy || ''));

    if (directors.length === 0) {
      throw new Error(`Record ${rowNumber}: Movie must have at least one director listed`);
    }

    let cast: { name: string; role?: string; order?: number }[] = [];
    if (Array.isArray(record.cast)) {
      cast = record.cast.map((c: any, idx: number) => ({
        name: typeof c === 'string' ? c.trim() : String(c.name || '').trim(),
        role: typeof c === 'object' && c.role ? String(c.role) : undefined,
        order: typeof c === 'object' && typeof c.order === 'number' ? c.order : idx,
      }));
    } else if (typeof record.cast === 'string') {
      cast = this.splitList(record.cast).map((name, idx) => ({ name, order: idx }));
    }

    const genres = Array.isArray(record.genres)
      ? record.genres.map((g: any) => (typeof g === 'string' ? g.trim() : g.name)).filter(Boolean)
      : this.splitList(String(record.genre || 'Drama'));

    return {
      sourceId,
      title: title.trim(),
      originalTitle: record.originalTitle ? String(record.originalTitle).trim() : undefined,
      alternativeTitles: Array.isArray(record.alternativeTitles)
        ? record.alternativeTitles.map(String)
        : undefined,
      releaseDate: record.releaseDate ? String(record.releaseDate) : `${releaseYear}-01-01`,
      releaseYear,
      languages,
      directors,
      musicDirectors: Array.isArray(record.musicDirectors)
        ? record.musicDirectors.map(String)
        : record.musicDirector
        ? this.splitList(String(record.musicDirector))
        : undefined,
      cast,
      genres,
      overview: record.overview ? String(record.overview) : undefined,
      runtime: typeof record.runtime === 'number' ? record.runtime : undefined,
      budget: typeof record.budget === 'number' ? record.budget : undefined,
      boxOffice: typeof record.boxOffice === 'number' ? record.boxOffice : undefined,
      rating: typeof record.rating === 'number' ? record.rating : undefined,
      voteCount: typeof record.voteCount === 'number' ? record.voteCount : undefined,
      externalIds: typeof record.externalIds === 'object' ? record.externalIds : undefined,
      posterUrl: record.posterUrl ? String(record.posterUrl) : undefined,
      backdropUrl: record.backdropUrl ? String(record.backdropUrl) : undefined,
    };
  }

  private static splitList(str: string): string[] {
    if (!str || typeof str !== 'string') return [];
    return str
      .split(/[,|;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private static normalizeLanguages(raw: string): string[] {
    const items = this.splitList(raw);
    if (items.length === 0) return ['TELUGU'];
    return items.map((i) => this.normalizeLanguageEnum(i));
  }

  private static normalizeLanguageEnum(lang: string): string {
    const l = lang.trim().toUpperCase();
    if (l === 'TE' || l === 'TEL' || l.includes('TELUGU')) return 'TELUGU';
    if (l === 'HI' || l === 'HIN' || l.includes('HINDI')) return 'HINDI';
    if (l === 'TA' || l === 'TAM' || l.includes('TAMIL')) return 'TAMIL';
    if (l === 'ML' || l === 'MAL' || l.includes('MALAYALAM')) return 'MALAYALAM';
    if (l === 'KN' || l === 'KAN' || l.includes('KANNADA')) return 'KANNADA';
    if (l === 'EN' || l === 'ENG' || l.includes('ENGLISH')) return 'ENGLISH';
    return l;
  }
}
