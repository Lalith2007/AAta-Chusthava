import { ClueEvaluator, ClueType } from '@/domain/clue/types';
import { LanguageClueEvaluator } from './evaluators/language-clue';
import { DirectorClueEvaluator } from './evaluators/director-clue';
import { ProductionHouseClueEvaluator } from './evaluators/production-house-clue';
import { ReleaseYearClueEvaluator } from './evaluators/release-year-clue';
import { BoxOfficeClueEvaluator } from './evaluators/box-office-clue';
import { RatingClueEvaluator } from './evaluators/rating-clue';
import { LeadActorClueEvaluator } from './evaluators/lead-actor-clue';
import { LeadActressClueEvaluator } from './evaluators/lead-actress-clue';
import { SupportingCastClueEvaluator } from './evaluators/supporting-cast-clue';
import { MusicDirectorClueEvaluator } from './evaluators/music-director-clue';
import { GenreClueEvaluator } from './evaluators/genre-clue';

export class ClueRegistry {
  private evaluators = new Map<ClueType, ClueEvaluator>();

  constructor() {
    this.register(new LanguageClueEvaluator());
    this.register(new DirectorClueEvaluator());
    this.register(new ProductionHouseClueEvaluator());
    this.register(new ReleaseYearClueEvaluator());
    this.register(new BoxOfficeClueEvaluator());
    this.register(new RatingClueEvaluator());
    this.register(new LeadActorClueEvaluator());
    this.register(new LeadActressClueEvaluator());
    this.register(new SupportingCastClueEvaluator());
    this.register(new MusicDirectorClueEvaluator());
    this.register(new GenreClueEvaluator());
  }

  register(evaluator: ClueEvaluator) {
    this.evaluators.set(evaluator.clueType, evaluator);
  }

  get(type: ClueType): ClueEvaluator | undefined {
    return this.evaluators.get(type);
  }

  getAll(): ClueEvaluator[] {
    return Array.from(this.evaluators.values());
  }
}

export const defaultClueRegistry = new ClueRegistry();
