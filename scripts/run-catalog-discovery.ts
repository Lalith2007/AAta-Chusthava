import 'dotenv/config';
import { tmdbAdapter } from '../src/infrastructure/external-sources/tmdb-adapter';

interface DiscoveryArgs {
  language: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  maxPages: number;
}

function parseArgs(): DiscoveryArgs {
  const args = process.argv.slice(2);
  let language = 'te';
  let year: number | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;
  let limit: number | undefined;
  let maxPages = 3;

  for (const arg of args) {
    if (arg.startsWith('--language=')) {
      language = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--year=')) {
      year = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--start-date=')) {
      startDate = arg.split('=')[1];
    } else if (arg.startsWith('--end-date=')) {
      endDate = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--max-pages=')) {
      maxPages = parseInt(arg.split('=')[1], 10);
    }
  }

  return { language, year, startDate, endDate, limit, maxPages };
}

async function main() {
  const { language, year, startDate, endDate, limit, maxPages } = parseArgs();

  console.log('============================================================');
  console.log('🔍 TMDB CATALOG DISCOVERY (READ-ONLY)');
  console.log('============================================================');
  console.log(`Language:    ${language.toUpperCase()}`);
  if (year) console.log(`Year:        ${year}`);
  if (startDate) console.log(`Start Date:  ${startDate}`);
  if (endDate) console.log(`End Date:    ${endDate}`);
  console.log(`Max Pages:   ${maxPages}`);
  if (limit) console.log(`Result Limit: ${limit}`);
  console.log(`Configured:  ${tmdbAdapter.isConfigured() ? 'LIVE TMDB API' : 'OFFLINE FIXTURES'}`);
  console.log('============================================================\n');

  let totalDiscovered = 0;
  const discoveredRecords: any[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const res = await tmdbAdapter.discover({
        language,
        year,
        startDate,
        endDate,
        page,
      });

      console.log(`[Page ${page}/${res.totalPages}] Found ${res.results.length} movies (Total available: ${res.totalResults})`);

      for (const item of res.results) {
        if (limit && totalDiscovered >= limit) break;
        discoveredRecords.push(item);
        totalDiscovered++;
      }

      if (page >= res.totalPages || (limit && totalDiscovered >= limit)) {
        break;
      }
    } catch (err: unknown) {
      console.error(`Error on page ${page}:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  console.log('\n============================================================');
  console.log(`DISCOVERY RESULTS (${discoveredRecords.length} records)`);
  console.log('============================================================');
  for (const r of discoveredRecords) {
    console.log(
      `• [TMDB ID: ${r.sourceMovieId}] "${r.title}" (${r.releaseDate || 'Unknown Date'}) — Popularity: ${r.popularity}`
    );
  }
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Fatal error during discovery:', err);
  process.exit(1);
});
