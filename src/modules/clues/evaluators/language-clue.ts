import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class LanguageClueEvaluator implements ClueEvaluator {
  readonly clueType = 'LANGUAGE';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetLangs = new Set(target.supportedLanguages || []);
    const guessLangs = new Set(guess.supportedLanguages || []);

    if (guessLangs.size === 0 || targetLangs.size === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: Array.from(guessLangs).join(', ') || 'Unknown',
      };
    }

    const matched: string[] = [];
    for (const lang of guessLangs) {
      if (targetLangs.has(lang)) {
        matched.push(lang);
      }
    }

    const isExact =
      targetLangs.size === guessLangs.size &&
      matched.length === targetLangs.size;

    return {
      clueType: this.clueType,
      status: isExact ? 'EXACT' : matched.length > 0 ? 'PARTIAL' : 'NONE',
      direction: 'NONE',
      matchedValues: matched,
      displayValue: Array.from(guessLangs).join(', '),
      metadata: {
        targetLanguages: Array.from(targetLangs),
        guessedLanguages: Array.from(guessLangs),
        matchedCount: matched.length,
      },
    };
  }
}
