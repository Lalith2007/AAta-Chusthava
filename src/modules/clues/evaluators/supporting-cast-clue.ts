import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class SupportingCastClueEvaluator implements ClueEvaluator {
  readonly clueType = 'SUPPORTING_CAST';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetCast = target.supportingCast || [];
    const guessCast = guess.supportingCast || [];

    if (guessCast.length === 0 || targetCast.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessCast.slice(0, 3).map((c) => c.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetCastIds = new Set(targetCast.map((c) => c.id));
    const matched = guessCast.filter((c) => targetCastIds.has(c.id));

    let status: ClueResult['status'] = 'NONE';
    if (matched.length > 0) {
      status = matched.length >= targetCast.length ? 'EXACT' : 'PARTIAL';
    }

    return {
      clueType: this.clueType,
      status,
      direction: 'NONE',
      matchedValues: matched.map((c) => c.canonicalName),
      displayValue: guessCast.slice(0, 3).map((c) => c.canonicalName).join(', '),
      metadata: {
        matchedCount: matched.length,
        totalTargetSupporting: targetCast.length,
        matchedNames: matched.map((c) => c.canonicalName),
      },
    };
  }
}
