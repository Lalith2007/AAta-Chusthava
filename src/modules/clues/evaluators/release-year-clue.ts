import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class ReleaseYearClueEvaluator implements ClueEvaluator {
  readonly clueType = 'RELEASE_YEAR';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    config: ClueRulesetConfig
  ): ClueResult {
    const targetYear = target.releaseYear;
    const guessYear = guess.releaseYear;

    if (!targetYear || !guessYear) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessYear ? String(guessYear) : 'Unknown',
      };
    }

    const diff = guessYear - targetYear;
    const threshold = config.yearCloseThreshold ?? 3;

    let status: ClueResult['status'];
    let direction: ClueResult['direction'] = 'NONE';

    if (diff === 0) {
      status = 'EXACT';
      direction = 'NONE';
    } else {
      direction = guessYear < targetYear ? 'UP' : 'DOWN';
      status = Math.abs(diff) <= threshold ? 'CLOSE' : 'NONE';
    }

    return {
      clueType: this.clueType,
      status,
      direction,
      matchedValues: status === 'EXACT' ? [String(guessYear)] : [],
      displayValue: String(guessYear),
      metadata: {
        difference: diff,
        targetYear,
        guessYear,
      },
    };
  }
}
