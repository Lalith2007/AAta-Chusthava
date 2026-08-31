import { prisma } from '@/infrastructure/db/client';
import { DiscoverySourceRegistry, DiscoverySourceStatus } from '@/infrastructure/external-sources/discovery-source';

export type CoverageStatus = 'FULL' | 'PARTIAL' | 'UNKNOWN';

export interface LanguageBreakdown {
  teluguOnly: number;
  hindiOnly: number;
  multilingual: number;
  other: number;
  unknown: number;
  total: number;
  isReconciled: boolean;
}

export interface YearCoverageItem {
  year: number;
  teluguOnly: number;
  hindiOnly: number;
  multilingual: number;
  other: number;
  total: number;
  playableTargets: number;
  needsReview: number;
  rejected: number;
  isReconciled: boolean;
  secondaryCandidateCount?: number;
}

export interface SourceCoverageItem {
  name: string;
  code: string;
  status: DiscoverySourceStatus;
  isImplemented: boolean;
  description?: string;
  candidatesDiscovered: number;
  successfullyEnriched: number;
  accepted: number;
  priorProcessed: number;
  review: number;
  rejected: number;
  duplicates: number;
  candidateOutcomeSum: number;
  candidateOutcomeReconciled: boolean;
  newUniqueMoviesContributed: number;
  canonicalWithSourceId: number;
}

export interface SourceComparisonReport {
  tmdbCandidates: number;
  secondaryCandidates: number;
  crossSourceOverlap: number;
  tmdbOnlyCanonical: number;
  secondaryOnlyCanonical: number;
  bothSourcesCanonical: number;
  neitherSourceCanonical: number;
  sourceMatrixSum: number;
  sourceMatrixReconciled: boolean;
  newCanonicalContributedBySecondary: number;
}

export interface ExpansionProgressReport {
  previousCanonicalCount: number;
  newCanonicalContributed: number;
  currentCanonicalCount: number;
  unresolvedCandidates: number;
  reviewQueueCount: number;
  totalCheckpointsCompleted: number;
}

export interface CatalogCoverageReport {
  totals: {
    totalMovies: number;
    activeMovies: number;
    validationRequired: number;
    disabled: number;
    merged: number;
    playableAsGuess: number;
    playableAsTarget: number;
    playableBoth: number;
    needsReview: number;
    rejected: number;
    approved: number;
  };
  languageBreakdown: LanguageBreakdown;
  yearBreakdown: YearCoverageItem[];
  sourceBreakdown: SourceCoverageItem[];
  sourceComparison: SourceComparisonReport;
  expansionProgress: ExpansionProgressReport;
  coverageStatus: CoverageStatus;
  coverageStatusDescription: string;
  auditMetadata: {
    oldestMovie: { title: string; year: number } | null;
    newestMovie: { title: string; year: number } | null;
    lastSuccessfulDiscovery: string | null;
    lastSuccessfulRefresh: string | null;
  };
  invariants: {
    languageReconciliationPass: boolean;
    yearReconciliationPass: boolean;
    sourceMatrixReconciliationPass: boolean;
    zeroDuplicateCanonicalMovies: boolean;
  };
}

export class CatalogCoverageService {
  async getCoverageReport(): Promise<CatalogCoverageReport> {
    const movies = await prisma.movie.findMany({
      include: {
        eligibility: true,
      },
      orderBy: {
        releaseYear: 'asc',
      },
    });

    const candidates = await prisma.ingestionCandidate.findMany();
    const rawRecords = await prisma.rawSourceRecord.findMany();

    // 1. Totals & Playability
    const totalMovies = movies.length;
    let activeMovies = 0;
    let validationRequired = 0;
    let disabled = 0;
    let merged = 0;
    let playableAsGuess = 0;
    let playableAsTarget = 0;
    let playableBoth = 0;
    let needsReview = 0;
    let rejected = 0;
    let approved = 0;

    for (const m of movies) {
      if (m.lifecycleStatus === 'ACTIVE') activeMovies++;
      else if (m.lifecycleStatus === 'VALIDATION_REQUIRED') validationRequired++;
      else if (m.lifecycleStatus === 'DISABLED') disabled++;
      else if (m.lifecycleStatus === 'MERGED') merged++;

      if (m.eligibility) {
        if (m.eligibility.playableAsGuess) playableAsGuess++;
        if (m.eligibility.playableAsTarget) playableAsTarget++;
        if (m.eligibility.playableAsGuess && m.eligibility.playableAsTarget) playableBoth++;

        if (m.eligibility.reviewStatus === 'PENDING') needsReview++;
        else if (m.eligibility.reviewStatus === 'REJECTED') rejected++;
        else if (m.eligibility.reviewStatus === 'APPROVED') approved++;
      }
    }

    // 2. Language Breakdown (Strictly Mutually Exclusive)
    let teluguOnly = 0;
    let hindiOnly = 0;
    let multilingual = 0;
    let other = 0;
    let unknown = 0;

    for (const m of movies) {
      const isTelugu = m.supportedLanguages.includes('TELUGU');
      const isHindi = m.supportedLanguages.includes('HINDI');

      if (isTelugu && isHindi) {
        multilingual++;
      } else if (isTelugu) {
        teluguOnly++;
      } else if (isHindi) {
        hindiOnly++;
      } else if (m.supportedLanguages.length > 0) {
        other++;
      } else {
        unknown++;
      }
    }

    const languageTotal = teluguOnly + hindiOnly + multilingual + other + unknown;
    const isLanguageReconciled = languageTotal === totalMovies;

    const languageBreakdown: LanguageBreakdown = {
      teluguOnly,
      hindiOnly,
      multilingual,
      other,
      unknown,
      total: languageTotal,
      isReconciled: isLanguageReconciled,
    };

    // 3. Year-by-Year Breakdown (2002 - 2026)
    const startYear = 2002;
    const endYear = 2026;
    const yearBreakdown: YearCoverageItem[] = [];

    let sumYearTotals = 0;
    let allYearsReconciled = true;

    for (let y = startYear; y <= endYear; y++) {
      const yearMovies = movies.filter((m) => m.releaseYear === y);
      let yTeluguOnly = 0;
      let yHindiOnly = 0;
      let yMultilingual = 0;
      let yOther = 0;
      let yPlayableTargets = 0;
      let yNeedsReview = 0;
      let yRejected = 0;

      for (const m of yearMovies) {
        const isTelugu = m.supportedLanguages.includes('TELUGU');
        const isHindi = m.supportedLanguages.includes('HINDI');

        if (isTelugu && isHindi) {
          yMultilingual++;
        } else if (isTelugu) {
          yTeluguOnly++;
        } else if (isHindi) {
          yHindiOnly++;
        } else {
          yOther++;
        }

        if (m.eligibility?.playableAsTarget) yPlayableTargets++;
        if (m.eligibility?.reviewStatus === 'PENDING') yNeedsReview++;
        if (m.eligibility?.reviewStatus === 'REJECTED') yRejected++;
      }

      const yTotal = yearMovies.length;
      const ySum = yTeluguOnly + yHindiOnly + yMultilingual + yOther;
      const isYearReconciled = ySum === yTotal;
      if (!isYearReconciled) {
        allYearsReconciled = false;
      }

      sumYearTotals += yTotal;

      const secondaryCandidatesForYear = candidates.filter(
        (c) => c.source.toUpperCase() === 'WIKIDATA' && c.discoveryReason?.includes(String(y))
      ).length;

      yearBreakdown.push({
        year: y,
        teluguOnly: yTeluguOnly,
        hindiOnly: yHindiOnly,
        multilingual: yMultilingual,
        other: yOther,
        total: yTotal,
        playableTargets: yPlayableTargets,
        needsReview: yNeedsReview,
        rejected: yRejected,
        isReconciled: isYearReconciled,
        secondaryCandidateCount: secondaryCandidatesForYear,
      });
    }

    const outOfRangeMovies = movies.filter((m) => m.releaseYear < startYear || m.releaseYear > endYear);
    const globalYearsReconciled = allYearsReconciled && sumYearTotals + outOfRangeMovies.length === totalMovies;

    // 4. Source Coverage Breakdown & Comparison
    const sourceRegistry = DiscoverySourceRegistry.getInstance();
    const registeredSources = sourceRegistry.getRegisteredSources();

    const tmdbCandidates = candidates.filter((c) => c.source.toUpperCase() === 'TMDB');
    const tmdbAccepted = tmdbCandidates.filter(
      (c) => c.status === 'VALIDATED' || (c.resolutionReason && c.resolutionReason.includes('ACCEPTED'))
    ).length;
    const tmdbPriorProcessed = tmdbCandidates.filter((c) => c.status === 'NORMALIZED').length;
    const tmdbEnriched = tmdbCandidates.filter(
      (c) => c.rawSourceRecordId !== null || ['ENRICHED', 'NORMALIZED', 'VALIDATED', 'DUPLICATE'].includes(c.status)
    ).length;
    const tmdbReview = tmdbCandidates.filter(
      (c) => c.status === 'PROCESSING' || c.resolutionReason === 'ACCEPTED_NEEDS_REVIEW'
    ).length;
    const tmdbRejected = tmdbCandidates.filter((c) => c.status === 'REJECTED').length;
    const tmdbDuplicates = tmdbCandidates.filter(
      (c) => c.status === 'DUPLICATE' || (c.resolutionReason && c.resolutionReason.includes('DUPLICATE'))
    ).length;
    const tmdbCandidateOutcomeSum = tmdbAccepted + tmdbPriorProcessed + tmdbDuplicates + tmdbReview + tmdbRejected;
    const tmdbCandidateOutcomeReconciled = tmdbCandidateOutcomeSum === tmdbCandidates.length;

    const wikidataCandidates = candidates.filter((c) => c.source.toUpperCase() === 'WIKIDATA');
    const wikidataAccepted = wikidataCandidates.filter(
      (c) => c.status === 'VALIDATED' || (c.resolutionReason && c.resolutionReason.includes('ACCEPTED'))
    ).length;
    const wikidataPriorProcessed = wikidataCandidates.filter((c) => c.status === 'NORMALIZED').length;
    const wikidataEnriched = wikidataCandidates.filter(
      (c) => c.rawSourceRecordId !== null || ['ENRICHED', 'NORMALIZED', 'VALIDATED', 'DUPLICATE'].includes(c.status)
    ).length;
    const wikidataReview = wikidataCandidates.filter(
      (c) => c.status === 'PROCESSING' || c.resolutionReason === 'ACCEPTED_NEEDS_REVIEW'
    ).length;
    const wikidataRejected = wikidataCandidates.filter((c) => c.status === 'REJECTED').length;
    const wikidataDuplicates = wikidataCandidates.filter(
      (c) => c.status === 'DUPLICATE' || (c.resolutionReason && c.resolutionReason.includes('DUPLICATE'))
    ).length;
    const wikidataCandidateOutcomeSum =
      wikidataAccepted + wikidataPriorProcessed + wikidataDuplicates + wikidataReview + wikidataRejected;
    const wikidataCandidateOutcomeReconciled = wikidataCandidateOutcomeSum === wikidataCandidates.length;

    const secondaryNewMovies = movies.filter((m) => m.wikidataId !== null && m.tmdbId === null).length;
    const tmdbOnlyCanonical = movies.filter((m) => m.tmdbId !== null && m.wikidataId === null).length;
    const bothSourcesCanonical = movies.filter((m) => m.tmdbId !== null && m.wikidataId !== null).length;
    const neitherSourceCanonical = movies.filter((m) => m.tmdbId === null && m.wikidataId === null).length;
    const sourceMatrixSum = tmdbOnlyCanonical + secondaryNewMovies + bothSourcesCanonical + neitherSourceCanonical;
    const sourceMatrixReconciled = sourceMatrixSum === totalMovies;

    const tmdbCanonicalCount = movies.filter((m) => m.tmdbId !== null).length;
    const wikidataCanonicalCount = movies.filter((m) => m.wikidataId !== null).length;

    const sourceBreakdown: SourceCoverageItem[] = registeredSources.map((s) => {
      if (s.code === 'TMDB') {
        return {
          name: s.name,
          code: s.code,
          status: 'ACTIVE',
          isImplemented: true,
          candidatesDiscovered: tmdbCandidates.length,
          successfullyEnriched: tmdbEnriched || rawRecords.filter((r) => r.source === 'TMDB').length,
          accepted: tmdbAccepted,
          priorProcessed: tmdbPriorProcessed,
          review: tmdbReview,
          rejected: tmdbRejected,
          duplicates: tmdbDuplicates,
          candidateOutcomeSum: tmdbCandidateOutcomeSum,
          candidateOutcomeReconciled: tmdbCandidateOutcomeReconciled,
          newUniqueMoviesContributed: tmdbAccepted,
          canonicalWithSourceId: tmdbCanonicalCount,
        };
      }
      if (s.code === 'WIKIDATA') {
        return {
          name: s.name,
          code: s.code,
          status: 'ACTIVE',
          isImplemented: true,
          candidatesDiscovered: wikidataCandidates.length,
          successfullyEnriched: wikidataEnriched || rawRecords.filter((r) => r.source === 'WIKIDATA').length,
          accepted: wikidataAccepted,
          priorProcessed: wikidataPriorProcessed,
          review: wikidataReview,
          rejected: wikidataRejected,
          duplicates: wikidataDuplicates,
          candidateOutcomeSum: wikidataCandidateOutcomeSum,
          candidateOutcomeReconciled: wikidataCandidateOutcomeReconciled,
          newUniqueMoviesContributed: secondaryNewMovies,
          canonicalWithSourceId: wikidataCanonicalCount,
        };
      }
      return {
        name: s.name,
        code: s.code,
        status: s.status,
        isImplemented: s.isImplemented,
        description: s.description,
        candidatesDiscovered: 0,
        successfullyEnriched: 0,
        accepted: 0,
        priorProcessed: 0,
        review: 0,
        rejected: 0,
        duplicates: 0,
        candidateOutcomeSum: 0,
        candidateOutcomeReconciled: true,
        newUniqueMoviesContributed: 0,
        canonicalWithSourceId: 0,
      };
    });

    const wikidataValidatedCandidates = wikidataCandidates.filter(
      (c) => c.status === 'VALIDATED' || c.resolutionReason === 'ACCEPTED_NEW_CANONICAL'
    ).length;

    const sourceComparison: SourceComparisonReport = {
      tmdbCandidates: tmdbCandidates.length,
      secondaryCandidates: wikidataCandidates.length,
      crossSourceOverlap: wikidataDuplicates,
      tmdbOnlyCanonical,
      secondaryOnlyCanonical: secondaryNewMovies,
      bothSourcesCanonical,
      neitherSourceCanonical,
      sourceMatrixSum,
      sourceMatrixReconciled,
      newCanonicalContributedBySecondary: wikidataValidatedCandidates,
    };

    // 5. Duplicate & Invariant Checks
    const uniqueSlugs = new Set(movies.map((m) => m.slug));
    const zeroDuplicateCanonicalMovies = uniqueSlugs.size === totalMovies;

    const sumYearTargets = yearBreakdown.reduce((acc, y) => acc + y.playableTargets, 0);
    const yearTargetsReconciled = sumYearTargets === playableAsTarget;
    const playableBothConsistent = playableBoth <= playableAsGuess && playableBoth <= playableAsTarget;

    // Checkpoints
    const checkpoints = await prisma.discoveryCheckpoint.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const baselineCanonicalCount = 90;
    const newCanonicalContributed = Math.max(0, totalMovies - baselineCanonicalCount);
    const unresolvedCandidates = candidates.filter((c) => ['DISCOVERED', 'PROCESSING'].includes(c.status)).length;
    const reviewQueueCount = needsReview + validationRequired;

    const expansionProgress: ExpansionProgressReport = {
      previousCanonicalCount: baselineCanonicalCount,
      newCanonicalContributed,
      currentCanonicalCount: totalMovies,
      unresolvedCandidates,
      reviewQueueCount,
      totalCheckpointsCompleted: checkpoints.filter((c) => c.status === 'COMPLETED').length,
    };

    // 6. Audit Metadata
    const oldestMovie = movies.length > 0 ? { title: movies[0].primaryTitle, year: movies[0].releaseYear } : null;
    const newestMovie =
      movies.length > 0
        ? { title: movies[movies.length - 1].primaryTitle, year: movies[movies.length - 1].releaseYear }
        : null;

    const latestCandidate = candidates.length > 0
      ? candidates.reduce((latest, c) => (c.discoveredAt > latest.discoveredAt ? c : latest), candidates[0])
      : null;

    const latestMovieUpdate = movies.length > 0
      ? movies.reduce((latest, m) => (m.createdAt > latest.createdAt ? m : latest), movies[0])
      : null;

    return {
      totals: {
        totalMovies,
        activeMovies,
        validationRequired,
        disabled,
        merged,
        playableAsGuess,
        playableAsTarget,
        playableBoth,
        needsReview,
        rejected,
        approved,
      },
      languageBreakdown,
      yearBreakdown,
      sourceBreakdown,
      sourceComparison,
      expansionProgress,
      coverageStatus: 'PARTIAL',
      coverageStatusDescription:
        'Catalog actively enriched by primary (TMDB) and secondary (Wikidata Open Knowledge Graph) discovery sources across 2002–2026. Continuous multi-source expansion pipeline ready for progressive discovery.',
      auditMetadata: {
        oldestMovie,
        newestMovie,
        lastSuccessfulDiscovery: latestCandidate?.discoveredAt.toISOString() || null,
        lastSuccessfulRefresh: latestMovieUpdate?.createdAt.toISOString() || null,
      },
      invariants: {
        languageReconciliationPass: isLanguageReconciled,
        yearReconciliationPass: globalYearsReconciled && yearTargetsReconciled && playableBothConsistent,
        sourceMatrixReconciliationPass: sourceMatrixReconciled,
        zeroDuplicateCanonicalMovies,
      },
    };
  }
}

export const catalogCoverageService = new CatalogCoverageService();
