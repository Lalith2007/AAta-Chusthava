import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class RatingClueEvaluator implements ClueEvaluator {
  readonly clueType = 'RATING';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    config: ClueRulesetConfig
  ): ClueResult {
    const targetRating = target.rating;
    const guessRating = guess.rating;

    if (
      targetRating === null ||
      targetRating === undefined ||
      guessRating === null ||
      guessRating === undefined
    ) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessRating ? `${guessRating.toFixed(1)} ★` : 'Unavailable',
      };
    }

    const diff = Number((guessRating - targetRating).toFixed(2));
    const threshold = config.ratingCloseThreshold ?? 0.5;

    let status: ClueResult['status'];
    let direction: ClueResult['direction'] = 'NONE';

    if (diff === 0) {
      status = 'EXACT';
      direction = 'NONE';
    } else {
      direction = guessRating < targetRating ? 'UP' : 'DOWN';
      status = Math.abs(diff) <= threshold ? 'CLOSE' : 'NONE';
    }

    return {
      clueType: this.clueType,
      status,
      direction,
      matchedValues: status === 'EXACT' ? [`${guessRating.toFixed(1)} ★`] : [],
      displayValue: `${guessRating.toFixed(1)} ★`,
      metadata: {
        difference: diff,
        targetRating,
        guessRating,
      },
    };
  }
}
