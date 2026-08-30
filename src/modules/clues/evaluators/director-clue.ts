import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class DirectorClueEvaluator implements ClueEvaluator {
  readonly clueType = 'DIRECTOR';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetDirs = target.directors || [];
    const guessDirs = guess.directors || [];

    if (guessDirs.length === 0 || targetDirs.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessDirs.map((d) => d.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetDirIds = new Set(targetDirs.map((d) => d.id));
    const matched = guessDirs.filter((d) => targetDirIds.has(d.id));

    return {
      clueType: this.clueType,
      status: matched.length > 0 ? 'EXACT' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((d) => d.canonicalName),
      displayValue: guessDirs.map((d) => d.canonicalName).join(', '),
      metadata: {
        matchedDirectorIds: matched.map((d) => d.id),
      },
    };
  }
}
