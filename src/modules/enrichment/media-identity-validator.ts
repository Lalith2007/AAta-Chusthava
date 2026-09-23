import { resolvePosterUrl } from '@/lib/poster-utils';

export type IdentityConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED_CONFLICT';

export interface PosterCandidate {
  imageUrl: string;
  source: 'TMDB' | 'GOOGLE' | 'MANUAL' | 'OTHER';
  sourcePageUrl?: string | null;
  sourceDomain?: string | null;
  candidateTitle?: string | null;
  candidateYear?: number | null;
  snippet?: string | null;
  tmdbId?: number | null;
}

export interface PosterValidationResult {
  confidence: IdentityConfidence;
  score: number;
  isAcceptableForAutoEnrich: boolean;
  rejectionReason?: string;
  matchEvidence: {
    titleMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH';
    yearMatch: 'EXACT' | 'NEAR' | 'MISMATCH' | 'UNKNOWN';
    sourceTrust: 'TRUSTED' | 'MODERATE' | 'UNVERIFIED';
    contextCorroboration: boolean;
  };
}

export interface PersonCandidate {
  imageUrl: string;
  source: 'TMDB' | 'GOOGLE' | 'MANUAL' | 'OTHER';
  candidateName?: string | null;
  tmdbId?: number | null;
  sourcePageUrl?: string | null;
  snippet?: string | null;
}

export interface PersonValidationResult {
  confidence: IdentityConfidence;
  score: number;
  isAcceptableForAutoEnrich: boolean;
  rejectionReason?: string;
}

const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /no[-_]image/i,
  /default[-_]avatar/i,
  /blank[-_]poster/i,
  /1x1\.(png|gif|jpg)/i,
  /avatar[-_]missing/i,
  /image[-_]not[-_]found/i,
  /spacer\.(gif|png)/i,
];

const TRUSTED_DOMAINS = [
  'image.tmdb.org',
  'themoviedb.org',
  'm.media-amazon.com',
  'imdb.com',
  'upload.wikimedia.org',
  'wikipedia.org',
];

export class MediaIdentityValidator {
  /**
   * Validates if a URL is a legitimate, non-placeholder image URL
   */
  validateImageUrl(url?: string | null): { isValid: boolean; normalizedUrl: string | null; reason?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, normalizedUrl: null, reason: 'URL is empty or not a string' };
    }

    const trimmed = url.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return { isValid: false, normalizedUrl: null, reason: 'URL is null or empty literal' };
    }

    // Check placeholder keywords
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { isValid: false, normalizedUrl: null, reason: `URL matches placeholder pattern: ${pattern}` };
      }
    }

    // Check tracking / analytics / HTML redirects
    if (/google\.[a-z.]+\/url\?/i.test(trimmed) || /doubleclick\.net/i.test(trimmed)) {
      return { isValid: false, normalizedUrl: null, reason: 'URL appears to be a tracking or redirect URL' };
    }

    // Use poster resolver to check structure
    const resolved = resolvePosterUrl(trimmed);
    if (!resolved) {
      return { isValid: false, normalizedUrl: null, reason: 'URL could not be resolved to a valid image format' };
    }

    return { isValid: true, normalizedUrl: resolved };
  }

  /**
   * Generates exact Google search URL for a movie poster
   */
  buildMovieGoogleSearchUrl(title: string, year: number): string {
    const query = `"${title}" "${year}" movie poster`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  /**
   * Generates exact Google search URL for a person profile
   */
  buildPersonGoogleSearchUrl(name: string, profession = 'actor'): string {
    const query = `"${name}" ${profession} Indian cinema`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  /**
   * Clean string tokens for comparison
   */
  private normalizeTokens(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Strict Identity Scoring for Poster Candidates
   */
  scorePosterCandidate(
    target: {
      title: string;
      releaseYear: number;
      originalTitle?: string | null;
      tmdbId?: number | null;
    },
    candidate: PosterCandidate
  ): PosterValidationResult {
    // Step 1: URL Sanity Check
    const urlCheck = this.validateImageUrl(candidate.imageUrl);
    if (!urlCheck.isValid) {
      return {
        confidence: 'REJECTED_CONFLICT',
        score: 0,
        isAcceptableForAutoEnrich: false,
        rejectionReason: urlCheck.reason,
        matchEvidence: {
          titleMatch: 'MISMATCH',
          yearMatch: 'MISMATCH',
          sourceTrust: 'UNVERIFIED',
          contextCorroboration: false,
        },
      };
    }

    // Step 2: Specific High-Profile Anti-Collision Guards (e.g. Kalki 2898 AD vs Dune)
    const normTarget = this.normalizeTokens(target.title);
    const candidateContext = this.normalizeTokens(
      `${candidate.candidateTitle || ''} ${candidate.snippet || ''} ${candidate.sourcePageUrl || ''}`
    );

    // Kalki vs Dune regression rule
    if (normTarget.includes('kalki') && normTarget.includes('2898')) {
      if (candidateContext.includes('dune') || candidateContext.includes('arrakis') || candidateContext.includes('timothee')) {
        return {
          confidence: 'REJECTED_CONFLICT',
          score: 0,
          isAcceptableForAutoEnrich: false,
          rejectionReason: 'Anti-collision: Kalki 2898 AD candidate explicitly rejected due to Dune collision',
          matchEvidence: {
            titleMatch: 'MISMATCH',
            yearMatch: 'MISMATCH',
            sourceTrust: 'UNVERIFIED',
            contextCorroboration: false,
          },
        };
      }
    }

    // Step 3: Exact TMDB ID Match (Instant High Confidence)
    if (target.tmdbId && candidate.tmdbId && target.tmdbId === candidate.tmdbId && candidate.source === 'TMDB') {
      return {
        confidence: 'HIGH',
        score: 100,
        isAcceptableForAutoEnrich: true,
        matchEvidence: {
          titleMatch: 'EXACT',
          yearMatch: 'EXACT',
          sourceTrust: 'TRUSTED',
          contextCorroboration: true,
        },
      };
    }

    let score = 0;
    let titleMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH' = 'MISMATCH';
    let yearMatch: 'EXACT' | 'NEAR' | 'MISMATCH' | 'UNKNOWN' = 'UNKNOWN';
    let sourceTrust: 'TRUSTED' | 'MODERATE' | 'UNVERIFIED' = 'UNVERIFIED';
    let contextCorroboration = false;

    // Step 4: Title Evaluation
    const candTitle = candidate.candidateTitle ? this.normalizeTokens(candidate.candidateTitle) : '';
    if (candTitle === normTarget) {
      score += 45;
      titleMatch = 'EXACT';
    } else if (candTitle && (candTitle.includes(normTarget) || normTarget.includes(candTitle))) {
      score += 25;
      titleMatch = 'PARTIAL';
    } else if (candidateContext.includes(normTarget)) {
      score += 20;
      titleMatch = 'PARTIAL';
    }

    // Step 5: Year Evaluation
    if (candidate.candidateYear) {
      const yearDiff = Math.abs(candidate.candidateYear - target.releaseYear);
      if (yearDiff === 0) {
        score += 30;
        yearMatch = 'EXACT';
      } else if (yearDiff === 1) {
        score += 10;
        yearMatch = 'NEAR';
      } else {
        score -= 40;
        yearMatch = 'MISMATCH';
      }
    } else if (candidateContext.includes(String(target.releaseYear))) {
      score += 20;
      yearMatch = 'EXACT';
    }

    // Step 6: Source Trust Evaluation
    const domain = (candidate.sourceDomain || '').toLowerCase();
    if (candidate.source === 'TMDB' || TRUSTED_DOMAINS.some((d) => domain.includes(d))) {
      score += 25;
      sourceTrust = 'TRUSTED';
    } else if (domain.endsWith('.org') || domain.endsWith('.edu') || domain.includes('cinema') || domain.includes('film')) {
      score += 10;
      sourceTrust = 'MODERATE';
    }

    // Context Corroboration
    if (candidateContext.includes('movie') || candidateContext.includes('poster') || candidateContext.includes('film')) {
      score += 5;
      contextCorroboration = true;
    }

    // Thresholds
    let confidence: IdentityConfidence;
    if (score >= 80 && titleMatch === 'EXACT' && (yearMatch === 'EXACT' || yearMatch === 'NEAR')) {
      confidence = 'HIGH';
    } else if (score >= 45 && (titleMatch === 'EXACT' || titleMatch === 'PARTIAL')) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }

    return {
      confidence,
      score,
      isAcceptableForAutoEnrich: confidence === 'HIGH',
      matchEvidence: {
        titleMatch,
        yearMatch,
        sourceTrust,
        contextCorroboration,
      },
    };
  }

  /**
   * Strict Identity Scoring for Person Candidates
   */
  scorePersonCandidate(
    target: {
      canonicalName: string;
      tmdbId?: number | null;
      knownMovies?: Array<{ title: string; year: number }>;
    },
    candidate: PersonCandidate
  ): PersonValidationResult {
    const urlCheck = this.validateImageUrl(candidate.imageUrl);
    if (!urlCheck.isValid) {
      return {
        confidence: 'REJECTED_CONFLICT',
        score: 0,
        isAcceptableForAutoEnrich: false,
        rejectionReason: urlCheck.reason,
      };
    }

    // Exact TMDB ID Match
    if (target.tmdbId && candidate.tmdbId && target.tmdbId === candidate.tmdbId) {
      return {
        confidence: 'HIGH',
        score: 100,
        isAcceptableForAutoEnrich: true,
      };
    }

    const normTargetName = this.normalizeTokens(target.canonicalName);
    const candidateContext = this.normalizeTokens(
      `${candidate.candidateName || ''} ${candidate.snippet || ''} ${candidate.sourcePageUrl || ''}`
    );

    let score = 0;

    // Name Match
    if (candidateContext.includes(normTargetName)) {
      score += 40;
    } else {
      return {
        confidence: 'LOW',
        score: 10,
        isAcceptableForAutoEnrich: false,
        rejectionReason: 'Person name does not appear in candidate context',
      };
    }

    // Filmography Corroboration (Never accept name-only)
    let corroborated = false;
    if (target.knownMovies && target.knownMovies.length > 0) {
      for (const m of target.knownMovies) {
        const normMovie = this.normalizeTokens(m.title);
        if (candidateContext.includes(normMovie)) {
          score += 45;
          corroborated = true;
          break;
        }
      }
    }

    // Profession Corroboration
    if (candidateContext.includes('actor') || candidateContext.includes('director') || candidateContext.includes('cinema') || candidateContext.includes('actress')) {
      score += 15;
    }

    let confidence: IdentityConfidence;
    if (score >= 85 && corroborated) {
      confidence = 'HIGH';
    } else if (score >= 40) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }

    return {
      confidence,
      score,
      isAcceptableForAutoEnrich: confidence === 'HIGH',
      rejectionReason: confidence !== 'HIGH' ? 'Candidate lacks strict filmography corroboration' : undefined,
    };
  }
}

export const mediaIdentityValidator = new MediaIdentityValidator();
