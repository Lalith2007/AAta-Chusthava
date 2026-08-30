import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class LeadActressClueEvaluator implements ClueEvaluator {
  readonly clueType = 'LEAD_ACTRESS';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetActresses = target.leadActresses || [];
    const guessActresses = guess.leadActresses || [];

    if (guessActresses.length === 0 || targetActresses.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessActresses.map((a) => a.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetActressIds = new Set(targetActresses.map((a) => a.id));
    const matched = guessActresses.filter((a) => targetActressIds.has(a.id));

    return {
      clueType: this.clueType,
      status: matched.length > 0 ? 'EXACT' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((a) => a.canonicalName),
      displayValue: guessActresses.map((a) => a.canonicalName).join(', '),
      metadata: {
        matchedActressIds: matched.map((a) => a.id),
      },
    };
  }
}
