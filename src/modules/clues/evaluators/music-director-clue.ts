import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class MusicDirectorClueEvaluator implements ClueEvaluator {
  readonly clueType = 'MUSIC_DIRECTOR';

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    _config: ClueRulesetConfig
  ): ClueResult {
    const targetMDs = target.musicDirectors || [];
    const guessMDs = guess.musicDirectors || [];

    if (guessMDs.length === 0 || targetMDs.length === 0) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: guessMDs.map((m) => m.canonicalName).join(', ') || 'Unknown',
      };
    }

    const targetMDIds = new Set(targetMDs.map((m) => m.id));
    const matched = guessMDs.filter((m) => targetMDIds.has(m.id));

    return {
      clueType: this.clueType,
      status: matched.length > 0 ? 'EXACT' : 'NONE',
      direction: 'NONE',
      matchedValues: matched.map((m) => m.canonicalName),
      displayValue: guessMDs.map((m) => m.canonicalName).join(', '),
      metadata: {
        matchedMusicDirectorIds: matched.map((m) => m.id),
      },
    };
  }
}
