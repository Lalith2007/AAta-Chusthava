import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class ProductionHouseClueEvaluator implements ClueEvaluator {
  readonly clueType = 'PRODUCTION_HOUSE';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetHouses = target.productionHouses || [];
    const guessHouses = guess.productionHouses || [];

    if (guessHouses.length === 0 || targetHouses.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessHouses.map((p) => p.canonicalName).join(', ') || 'Unknown',
      };
    }

    // Set of canonical production house IDs & parent companies
    const targetHouseIds = new Set<string>();
    for (const h of targetHouses) {
      targetHouseIds.add(h.id);
      if (h.parentCompanyId) targetHouseIds.add(h.parentCompanyId);
    }

    const matched = guessHouses.filter(
      (h) => targetHouseIds.has(h.id) || (h.parentCompanyId && targetHouseIds.has(h.parentCompanyId))
    );

    return {
      clueType: this.clueType,
      status: matched.length > 0 ? 'EXACT' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((h) => h.canonicalName),
      displayValue: guessHouses.map((h) => h.canonicalName).join(', '),
      metadata: {
        matchedHouseIds: matched.map((h) => h.id),
      },
    };
  }
}
