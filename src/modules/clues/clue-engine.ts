import { ClueResult, ClueRulesetConfig, ClueType, GuessEvaluation } from '@/domain/clue/types';
import { NormalizedMovie } from '@/domain/movie/types';
import { ClueRegistry, defaultClueRegistry } from './clue-registry';

export class ClueEngine {
  constructor(private registry: ClueRegistry = defaultClueRegistry) {}

  evaluateGuess(
    targetMovie: NormalizedMovie,
    guessedMovie: NormalizedMovie,
    config: ClueRulesetConfig = {}
  ): GuessEvaluation {
    const isCorrect = targetMovie.id === guessedMovie.id;
    const clueResults = {} as Record<ClueType, ClueResult>;

    const enabledClues: ClueType[] = config.enabledClues || [
      'LANGUAGE',
      'DIRECTOR',
      'PRODUCTION_HOUSE',
      'RELEASE_YEAR',
      'BOX_OFFICE',
      'RATING',
      'LEAD_ACTOR',
      'LEAD_ACTRESS',
      'SUPPORTING_CAST',
      'MUSIC_DIRECTOR',
      'GENRES',
    ];

    for (const clueType of enabledClues) {
      const evaluator = this.registry.get(clueType);
      if (evaluator) {
        clueResults[clueType] = evaluator.evaluate(targetMovie, guessedMovie, config);
      }
    }

    return {
      isCorrect,
      guessedMovieId: guessedMovie.id,
      guessedMovieSummary: {
        id: guessedMovie.id,
        title: guessedMovie.primaryTitle,
        releaseYear: guessedMovie.releaseYear,
        posterAsset: guessedMovie.posterAsset,
        languages: guessedMovie.supportedLanguages,
      },
      clues: clueResults,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const defaultClueEngine = new ClueEngine();
