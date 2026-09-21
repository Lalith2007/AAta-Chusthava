import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { isValidPersonName } from '@/infrastructure/external-sources/wikipedia-adapter';
import { subtractDaysFromPuzzleDate } from '@/lib/date-utils';
import {
  QualityTier,
  FallbackLevel,
  TargetQualityProfile,
  SelectionMetadata,
} from './types';

export class DailyPuzzleSelector {
  private customSecret?: string;

  constructor(customSecret?: string) {
    if (customSecret && customSecret.trim().length > 0) {
      this.customSecret = customSecret.trim();
    }
  }

  /**
   * Resolves the server-side secret salt.
   * Fails fast and clearly if missing in production.
   */
  public getSecretSalt(): string {
    if (this.customSecret) {
      return this.customSecret;
    }

    const envSecret = process.env.DAILY_PUZZLE_SECRET;
    if (envSecret && envSecret.trim().length > 0) {
      return envSecret.trim();
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: Missing required environment variable DAILY_PUZZLE_SECRET in production. ' +
        'A secure server-side secret must be configured for deterministic Daily Puzzle selection.'
      );
    }

    if (process.env.NODE_ENV === 'test') {
      return 'test-daily-puzzle-secret-deterministic-salt-2026';
    }

    return 'aata-chusthava-daily-puzzle-secret-dev-seed-2026';
  }

  /**
   * Computes a deterministic pseudo-random float [0, 1) from date, movie ID, and server salt.
   */
  public computeDeterministicJitter(puzzleDate: string, movieId: string): number {
    const salt = this.getSecretSalt();
    const hash = crypto
      .createHash('sha256')
      .update(`${puzzleDate}:${movieId}:${salt}`)
      .digest('hex');
    const intVal = parseInt(hash.substring(0, 8), 16);
    return intVal / 0xffffffff;
  }

  /**
   * Evaluates the real database-derived quality profile of a target-eligible movie.
   */
  public computeTargetQualityProfile(movie: {
    id: string;
    primaryTitle: string;
    releaseYear: number;
    supportedLanguages: string[];
    rating: number | null;
    ratingVoteCount: number | null;
    boxOffice: number | null;
    people: {
      roleType: string;
      relationType: string;
      job: string | null;
      person: { canonicalName: string };
    }[];
    productionHouses: { productionHouse: { canonicalName: string } }[];
    genres: { genre: { canonicalName: string } }[];
  }): TargetQualityProfile {
    const validDirectors = movie.people.filter(
      (p) =>
        (p.roleType === 'DIRECTOR' || p.job === 'Director') &&
        isValidPersonName(p.person.canonicalName)
    );
    const validCast = movie.people.filter(
      (p) =>
        (p.roleType === 'LEAD' || p.roleType === 'SUPPORTING' || p.relationType === 'CAST') &&
        isValidPersonName(p.person.canonicalName)
    );
    const hasSupportingCast = movie.people.some(
      (p) => p.roleType === 'SUPPORTING' && isValidPersonName(p.person.canonicalName)
    );
    const hasMusicDirector = movie.people.some(
      (p) =>
        (p.roleType === 'MUSIC_DIRECTOR' ||
          p.job === 'Music Director' ||
          p.job === 'Music' ||
          p.job === 'Original Music Composer') &&
        isValidPersonName(p.person.canonicalName)
    );
    const hasStudio = movie.productionHouses.length > 0;
    const hasRating = !!movie.rating && movie.rating > 0 && (movie.ratingVoteCount || 0) > 0;
    const hasBoxOffice = !!movie.boxOffice && movie.boxOffice > 0;
    const hasGenres = movie.genres.length > 0;

    // Core clues: Language(1) + Director(1) + Year(1) + Lead Actor(1) + Lead Actress(1) = 5
    let availableCluesCount = 5;
    if (hasSupportingCast) availableCluesCount++;
    if (hasMusicDirector) availableCluesCount++;
    if (hasStudio) availableCluesCount++;
    if (hasRating) availableCluesCount++;
    if (hasBoxOffice) availableCluesCount++;
    if (hasGenres) availableCluesCount++;

    let qualityScore = 50;
    if (hasSupportingCast) qualityScore += 15;
    if (hasMusicDirector) qualityScore += 15;
    if (hasStudio) qualityScore += 10;
    if (hasRating) qualityScore += 10;
    if (hasBoxOffice) qualityScore += 10;
    if (hasGenres) qualityScore += 10;

    const qualityTier: QualityTier =
      availableCluesCount >= 7 || (hasRating && hasBoxOffice) || qualityScore >= 80
        ? 'TIER_1_RICH'
        : 'TIER_2_MEDIUM';

    return {
      movieId: movie.id,
      primaryTitle: movie.primaryTitle,
      releaseYear: movie.releaseYear,
      languages: movie.supportedLanguages as ('TELUGU' | 'HINDI')[],
      directorsCount: validDirectors.length,
      castCount: validCast.length,
      hasSupportingCast,
      hasMusicDirector,
      hasStudio,
      hasRating,
      ratingValue: movie.rating || undefined,
      voteCount: movie.ratingVoteCount || undefined,
      hasBoxOffice,
      boxOfficeValue: movie.boxOffice || undefined,
      hasGenres,
      genresCount: movie.genres.length,
      availableCluesCount,
      qualityScore,
      qualityTier,
    };
  }

  /**
   * Deterministically selects the ideal target movie for a given puzzle date.
   */
  public async selectDailyTarget(puzzleDate: string): Promise<{
    selectedMovieId: string;
    metadata: SelectionMetadata;
  }> {
    const startTime = Date.now();

    // 1. Fetch recent Daily Puzzles within 60 days cooldown window
    const sixtyDaysAgo = subtractDaysFromPuzzleDate(puzzleDate, 60);
    const recentPuzzles = await prisma.dailyPuzzle.findMany({
      where: {
        puzzleDate: {
          gte: sixtyDaysAgo,
          lt: puzzleDate,
        },
      },
      include: {
        targetMovie: {
          include: {
            people: { include: { person: true } },
          },
        },
      },
      orderBy: { puzzleDate: 'desc' },
    });

    const cooldownMovieIds = new Set(recentPuzzles.map((p) => p.targetMovieId));

    // 2. Track recent language balance (last 14 days)
    const fourteenDaysAgo = subtractDaysFromPuzzleDate(puzzleDate, 14);
    const last14Puzzles = recentPuzzles.filter((p) => p.puzzleDate >= fourteenDaysAgo);
    let recentTeluguCount = 0;
    let recentHindiCount = 0;

    for (const p of last14Puzzles) {
      const langs = p.targetMovie.supportedLanguages;
      if (langs.includes('TELUGU') && !langs.includes('HINDI')) {
        recentTeluguCount++;
      } else if (langs.includes('HINDI') && !langs.includes('TELUGU')) {
        recentHindiCount++;
      } else if (langs.includes('TELUGU') && langs.includes('HINDI')) {
        recentTeluguCount += 0.5;
        recentHindiCount += 0.5;
      }
    }

    let preferredLanguage: 'TELUGU' | 'HINDI';
    if (recentTeluguCount < recentHindiCount) {
      preferredLanguage = 'TELUGU';
    } else if (recentHindiCount < recentTeluguCount) {
      preferredLanguage = 'HINDI';
    } else {
      // Deterministic tie-break based on puzzle date and salt
      const salt = this.getSecretSalt();
      const tieHash = crypto
        .createHash('sha256')
        .update(`${puzzleDate}:lang_tiebreak:${salt}`)
        .digest('hex');
      preferredLanguage = parseInt(tieHash.substring(0, 4), 16) % 2 === 0 ? 'TELUGU' : 'HINDI';
    }

    // 3. Load all active target-eligible movies from database
    const allTargetMovies = await prisma.movie.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        eligibility: {
          playableAsTarget: true,
        },
      },
      include: {
        people: { include: { person: true } },
        productionHouses: { include: { productionHouse: true } },
        genres: { include: { genre: true } },
      },
    });

    if (allTargetMovies.length === 0) {
      throw new Error('No active target-eligible movies found in database.');
    }

    // 4. Compute quality profiles for all candidates
    const profiles = allTargetMovies.map((m) => ({
      movie: m,
      profile: this.computeTargetQualityProfile(m),
    }));

    // 5. Recent attribute diversity tracking (last 3 days)
    const last3Puzzles = recentPuzzles.slice(0, 3);
    const recentDirectors = new Set<string>();
    for (const p of last3Puzzles) {
      p.targetMovie.people
        .filter((person) => person.roleType === 'DIRECTOR' || person.job === 'Director')
        .forEach((d) => recentDirectors.add(d.person.canonicalName.toLowerCase()));
    }
    const yesterdayYear = recentPuzzles[0]?.targetMovie.releaseYear;

    // 6. Execute Deterministic Fallback Hierarchy
    const levels: {
      level: FallbackLevel;
      filter: (item: (typeof profiles)[0]) => boolean;
      reason?: string;
    }[] = [
      {
        level: 'LEVEL_1_STANDARD',
        filter: (item) =>
          !cooldownMovieIds.has(item.movie.id) &&
          item.movie.supportedLanguages.includes(preferredLanguage) &&
          item.profile.qualityTier === 'TIER_1_RICH',
      },
      {
        level: 'LEVEL_2_EITHER_LANGUAGE',
        filter: (item) =>
          !cooldownMovieIds.has(item.movie.id) &&
          item.profile.qualityTier === 'TIER_1_RICH',
        reason: `Preferred language (${preferredLanguage}) rich tier exhausted in active pool.`,
      },
      {
        level: 'LEVEL_3_ANY_TIER',
        filter: (item) =>
          !cooldownMovieIds.has(item.movie.id) &&
          item.movie.supportedLanguages.includes(preferredLanguage),
        reason: 'Rich tier exhausted across cooldown pool; expanding to medium tier.',
      },
      {
        level: 'LEVEL_4_ANY_LANGUAGE_ANY_TIER',
        filter: (item) => !cooldownMovieIds.has(item.movie.id),
        reason: 'Preferred language exhausted; expanding to any eligible candidate outside cooldown.',
      },
      {
        level: 'LEVEL_5_COOLDOWN_RELAXED',
        filter: (item) => {
          // Relax 60-day cooldown to 7-day cooldown
          const last7DaysIds = new Set(recentPuzzles.slice(0, 7).map((p) => p.targetMovieId));
          return !last7DaysIds.has(item.movie.id);
        },
        reason: 'Cooldown pool exhausted; relaxed 60-day cooldown to 7 days.',
      },
    ];

    let selectedCandidate: (typeof profiles)[0] | null = null;
    let activeLevel: FallbackLevel = 'LEVEL_1_STANDARD';
    let fallbackReason: string | undefined = undefined;
    let candidatePoolSize = 0;
    let highestPriority = -Infinity;
    let selectedJitter = 0;

    for (const lvl of levels) {
      const filtered = profiles.filter(lvl.filter);
      if (filtered.length > 0) {
        activeLevel = lvl.level;
        fallbackReason = lvl.reason;
        candidatePoolSize = filtered.length;

        // Score candidates with deterministic jitter and diversity adjustments
        for (const item of filtered) {
          const jitter = this.computeDeterministicJitter(puzzleDate, item.movie.id);
          let diversityPenalty = 0;

          // Penalty if same director appeared in last 3 days
          const hasRecentDirector = item.movie.people.some(
            (p) =>
              (p.roleType === 'DIRECTOR' || p.job === 'Director') &&
              recentDirectors.has(p.person.canonicalName.toLowerCase())
          );
          if (hasRecentDirector) diversityPenalty += 25;

          // Penalty if same release year as yesterday
          if (yesterdayYear && item.movie.releaseYear === yesterdayYear) {
            diversityPenalty += 15;
          }

          // Priority formula: Quality Score + Jitter * 40 - Diversity Penalty
          const priority = item.profile.qualityScore + jitter * 40 - diversityPenalty;

          if (priority > highestPriority) {
            highestPriority = priority;
            selectedCandidate = item;
            selectedJitter = jitter;
          } else if (priority === highestPriority && selectedCandidate) {
            // Deterministic string tie-break
            if (item.movie.id < selectedCandidate.movie.id) {
              selectedCandidate = item;
              selectedJitter = jitter;
            }
          }
        }

        break;
      }
    }

    if (!selectedCandidate) {
      // Unreachable unless catalog is empty, but provide strict fallback
      selectedCandidate = profiles[0];
      activeLevel = 'LEVEL_5_COOLDOWN_RELAXED';
      fallbackReason = 'Default catalog fallback.';
    }

    const durationMs = Date.now() - startTime;
    const langs = selectedCandidate.movie.supportedLanguages;
    const finalLang =
      langs.includes('TELUGU') && langs.includes('HINDI')
        ? 'MULTILINGUAL'
        : langs.includes('TELUGU')
        ? 'TELUGU'
        : 'HINDI';

    const metadata: SelectionMetadata = {
      algorithmVersion: 'DAILY_SELECTION_V1',
      puzzleDate,
      selectedMovieId: selectedCandidate.movie.id,
      selectedTitle: selectedCandidate.movie.primaryTitle,
      language: finalLang,
      preferredLanguage,
      qualityTier: selectedCandidate.profile.qualityTier,
      qualityScore: selectedCandidate.profile.qualityScore,
      availableCluesCount: selectedCandidate.profile.availableCluesCount,
      deterministicPriority: Math.round(highestPriority * 100) / 100,
      jitter: Math.round(selectedJitter * 10000) / 10000,
      fallbackLevel: activeLevel,
      fallbackReason,
      recentTeluguCount,
      recentHindiCount,
      cooldownDays: 60,
      cooldownExcludedCount: cooldownMovieIds.size,
      candidatePoolSize,
      evaluatedCandidatesCount: allTargetMovies.length,
      selectionDurationMs: durationMs,
      isOverridden: false,
    };

    return {
      selectedMovieId: selectedCandidate.movie.id,
      metadata,
    };
  }
}

export const dailyPuzzleSelector = new DailyPuzzleSelector();
