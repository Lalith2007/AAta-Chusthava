import { ClueEvaluator, ClueResult, ClueRulesetConfig } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';

export class BoxOfficeClueEvaluator implements ClueEvaluator {
  readonly clueType = 'BOX_OFFICE';

  private formatCurrency(val: number | null | undefined, currency = 'INR'): string {
    if (val === null || val === undefined || val <= 0) return 'Unavailable';
    if (val >= 10000000) {
      const cr = (val / 10000000).toFixed(1);
      return `₹${cr.endsWith('.0') ? cr.slice(0, -2) : cr} Cr`;
    }
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    return `${val.toLocaleString()} ${currency}`;
  }

  evaluate(
    target: NormalizedMovie,
    guess: NormalizedMovie,
    config: ClueRulesetConfig
  ): ClueResult {
    const targetBO = target.boxOffice;
    const guessBO = guess.boxOffice;

    // Do NOT treat missing box office as zero!
    if (
      targetBO === null ||
      targetBO === undefined ||
      targetBO <= 0 ||
      guessBO === null ||
      guessBO === undefined ||
      guessBO <= 0 ||
      target.boxOfficeStatus === 'UNKNOWN' ||
      target.boxOfficeStatus === 'UNAVAILABLE' ||
      guess.boxOfficeStatus === 'UNKNOWN' ||
      guess.boxOfficeStatus === 'UNAVAILABLE'
    ) {
      return {
        clueType: this.clueType,
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: this.formatCurrency(guessBO, guess.boxOfficeCurrency || 'INR'),
      };
    }

    const diff = guessBO - targetBO;
    const threshold = config.boxOfficeCloseThresholdAbsolute ?? 1000000000; // 100 Cr threshold or configured

    let status: ClueResult['status'];
    let direction: ClueResult['direction'] = 'NONE';

    if (diff === 0) {
      status = 'EXACT';
      direction = 'NONE';
    } else {
      direction = guessBO < targetBO ? 'UP' : 'DOWN';
      status = Math.abs(diff) <= threshold ? 'CLOSE' : 'NONE';
    }

    return {
      clueType: this.clueType,
      status,
      direction,
      matchedValues: status === 'EXACT' ? [this.formatCurrency(guessBO)] : [],
      displayValue: this.formatCurrency(guessBO, guess.boxOfficeCurrency || 'INR'),
      metadata: {
        difference: diff,
        targetBoxOffice: targetBO,
        guessBoxOffice: guessBO,
      },
    };
  }
}
