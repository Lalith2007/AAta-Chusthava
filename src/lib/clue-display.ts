/**
 * Clue Display Utility — Sprint 30
 *
 * Maps raw ClueResult status/direction/metadata to human-readable display
 * strings for the UI. This is a PRESENTATION layer only.
 *
 * The authoritative 11 clue evaluators are NOT modified.
 * This utility only transforms the output for display.
 */

import { ClueResult, ClueStatus, ClueDirection, ClueType } from '@/domain/clue/types';

export interface PersonDisplayData {
  id: string;
  canonicalName: string;
  image: string | null;
  matched: boolean;
}

export interface ClueDisplayResult {
  /** Human-readable status line, e.g. "No Match · Target is later" */
  statusLine: string;
  /** Short badge text, e.g. "No Match", "Exact Match", "2 Shared" */
  badgeText: string;
  /** Whether to show directional arrow */
  showDirection: boolean;
  direction: ClueDirection;
  /** Shared items (genres, languages) for partial/exact display */
  sharedItems: string[];
  /** Person details for Cast / Director tiles */
  persons: PersonDisplayData[];
}

const CLUE_LABELS: Record<ClueType, string> = {
  LANGUAGE: 'Language',
  RELEASE_YEAR: 'Year',
  DIRECTOR: 'Director',
  LEAD_ACTOR: 'Lead Cast',
  LEAD_ACTRESS: 'Lead Cast',
  SUPPORTING_CAST: 'Supporting Cast',
  PRODUCTION_HOUSE: 'Studio',
  RATING: 'Rating',
  BOX_OFFICE: 'Box Office',
  MUSIC_DIRECTOR: 'Music',
  GENRES: 'Genre',
};

/** Returns "earlier" for DOWN, "later" for UP (time/year) */
function temporalDirection(dir: ClueDirection): string {
  if (dir === 'UP') return 'Target is later';
  if (dir === 'DOWN') return 'Target is earlier';
  return '';
}

/** Returns "higher" for UP, "lower" for DOWN (numeric) */
function numericDirection(dir: ClueDirection): string {
  if (dir === 'UP') return 'Target is higher';
  if (dir === 'DOWN') return 'Target is lower';
  return '';
}

function isTemporalClue(clueType: ClueType): boolean {
  return clueType === 'RELEASE_YEAR';
}

function extractPersons(metadata?: Record<string, unknown>): PersonDisplayData[] {
  if (!metadata?.persons) return [];
  const raw = metadata.persons as Array<{
    id: string;
    canonicalName: string;
    image: string | null;
    matched: boolean;
  }>;
  return raw.map((p) => ({
    id: p.id,
    canonicalName: p.canonicalName,
    image: p.image ?? null,
    matched: Boolean(p.matched),
  }));
}

export function formatClueDisplay(clue: ClueResult): ClueDisplayResult {
  const { status, direction, clueType, matchedValues, metadata } = clue;
  const persons = extractPersons(metadata);
  const sharedItems = matchedValues ?? [];

  switch (status as ClueStatus) {
    case 'EXACT':
      return {
        statusLine: 'Exact Match',
        badgeText: 'Exact Match',
        showDirection: false,
        direction: 'NONE',
        sharedItems,
        persons,
      };

    case 'CLOSE': {
      const dirText = isTemporalClue(clueType)
        ? temporalDirection(direction)
        : numericDirection(direction);
      return {
        statusLine: dirText ? `Close · ${dirText}` : 'Close',
        badgeText: direction === 'UP' ? 'Close ↑' : direction === 'DOWN' ? 'Close ↓' : 'Close',
        showDirection: direction !== 'NONE',
        direction,
        sharedItems,
        persons,
      };
    }

    case 'NONE': {
      const dirText = isTemporalClue(clueType)
        ? temporalDirection(direction)
        : numericDirection(direction);
      if (dirText) {
        return {
          statusLine: `No Match · ${dirText}`,
          badgeText: direction === 'UP' ? 'No Match ↑' : 'No Match ↓',
          showDirection: true,
          direction,
          sharedItems,
          persons,
        };
      }
      return {
        statusLine: 'No Match',
        badgeText: 'No Match',
        showDirection: false,
        direction: 'NONE',
        sharedItems,
        persons,
      };
    }

    case 'PARTIAL': {
      const count = sharedItems.length || (metadata?.matchedCount as number) || 0;
      const label = CLUE_LABELS[clueType] || 'Item';

      let badge = 'Partial Match';
      let statusLine = 'Partial Match';

      if (count > 0) {
        if (clueType === 'GENRES') {
          badge = count === 1 ? `1 Shared Genre` : `${count} Shared Genres`;
          statusLine = sharedItems.length > 0 ? sharedItems.join(', ') : badge;
        } else if (clueType === 'LANGUAGE') {
          badge = count === 1 ? `1 Shared Language` : `${count} Shared Languages`;
          statusLine = sharedItems.length > 0 ? sharedItems.join(', ') : badge;
        } else if (clueType === 'LEAD_ACTOR' || clueType === 'LEAD_ACTRESS' || clueType === 'SUPPORTING_CAST') {
          badge = count === 1 ? `1 Shared Cast` : `${count} Shared Cast`;
          statusLine = badge;
        } else {
          badge = count === 1 ? `1 Shared ${label}` : `${count} Shared`;
          statusLine = badge;
        }
      }

      return {
        statusLine,
        badgeText: badge,
        showDirection: false,
        direction: 'NONE',
        sharedItems,
        persons,
      };
    }

    case 'UNAVAILABLE':
    default:
      return {
        statusLine: 'Unavailable',
        badgeText: 'Unavailable',
        showDirection: false,
        direction: 'NONE',
        sharedItems: [],
        persons,
      };
  }
}
