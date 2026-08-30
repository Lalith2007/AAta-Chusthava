import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class GenreClueEvaluator implements ClueEvaluator {
  readonly clueType = 'GENRES';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetGenres = target.genres || [];
    const guessGenres = guess.genres || [];

    if (guessGenres.length === 0 || targetGenres.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessGenres.map((g) => g.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetGenreIds = new Set(targetGenres.map((g) => g.id));
    const matched = guessGenres.filter((g) => targetGenreIds.has(g.id));

    const isExact =
      targetGenres.length === guessGenres.length &&
      matched.length === targetGenres.length;

    return {
      clueType: this.clueType,
      status: isExact ? 'EXACT' : matched.length > 0 ? 'PARTIAL' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((g) => g.canonicalName),
      displayValue: guessGenres.map((g) => g.canonicalName).join(', '),
      metadata: {
        matchedGenreIds: matched.map((g) => g.id),
        matchedNames: matched.map((g) => g.canonicalName),
      },
    };
  }
}
