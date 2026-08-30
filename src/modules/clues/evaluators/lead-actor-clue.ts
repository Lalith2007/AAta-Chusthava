import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class LeadActorClueEvaluator implements ClueEvaluator {
  readonly clueType = 'LEAD_ACTOR';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetActors = target.leadActors || [];
    const guessActors = guess.leadActors || [];

    if (guessActors.length === 0 || targetActors.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessActors.map((a) => a.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetActorIds = new Set(targetActors.map((a) => a.id));
    const matched = guessActors.filter((a) => targetActorIds.has(a.id));

    return {
      clueType: this.clueType,
      status: matched.length > 0 ? 'EXACT' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((a) => a.canonicalName),
      displayValue: guessActors.map((a) => a.canonicalName).join(', '),
      metadata: {
        matchedActorIds: matched.map((a) => a.id),
      },
    };
  }
}
