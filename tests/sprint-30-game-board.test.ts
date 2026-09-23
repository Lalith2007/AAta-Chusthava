import { describe, it, expect } from 'vitest';
import { formatClueDisplay } from '../src/lib/clue-display';
import { CLUE_COLUMNS } from '../src/components/game/GameBoard';
import { ClueResult } from '../src/domain/clue/types';

describe('Sprint 30: Spotle-Level Game Board & Clue Semantics Test Suite', () => {
  describe('1. 8 Primary Clue Groups & Column Mapping', () => {
    it('preserves the 11 engine clues with backward-compatible export', () => {
      expect(CLUE_COLUMNS).toHaveLength(11);
      const types = CLUE_COLUMNS.map((c) => c.type);
      expect(types).toEqual([
        'LANGUAGE',
        'RELEASE_YEAR',
        'DIRECTOR',
        'LEAD_ACTOR',
        'LEAD_ACTRESS',
        'SUPPORTING_CAST',
        'PRODUCTION_HOUSE',
        'RATING',
        'BOX_OFFICE',
        'MUSIC_DIRECTOR',
        'GENRES',
      ]);
    });

    it('maps LEAD_ACTOR, LEAD_ACTRESS, and SUPPORTING_CAST under primary cast group', () => {
      const primaryClues = CLUE_COLUMNS.filter((c) => c.isPrimary).map((c) => c.type);
      expect(primaryClues).toContain('LEAD_ACTOR');
      expect(primaryClues).toContain('LEAD_ACTRESS');
      expect(primaryClues).toContain('SUPPORTING_CAST');
    });
  });

  describe('2. Natural-Language Clue Semantics & Display Formatting', () => {
    it('formats EXACT match cleanly without cryptic abbreviations', () => {
      const clue: ClueResult = {
        clueType: 'DIRECTOR',
        status: 'EXACT',
        direction: 'NONE',
        matchedValues: ['S. S. Rajamouli'],
        displayValue: 'S. S. Rajamouli',
      };
      const display = formatClueDisplay(clue);
      expect(display.statusLine).toBe('Exact Match');
      expect(display.badgeText).toBe('Exact Match');
      expect(display.showDirection).toBe(false);
    });

    it('formats temporal CLOSE with contextual direction (earlier/later)', () => {
      const clueUp: ClueResult = {
        clueType: 'RELEASE_YEAR',
        status: 'CLOSE',
        direction: 'UP',
        matchedValues: [],
        displayValue: '2015',
      };
      const displayUp = formatClueDisplay(clueUp);
      expect(displayUp.statusLine).toBe('Close · Target is later');
      expect(displayUp.badgeText).toBe('Close ↑');
      expect(displayUp.showDirection).toBe(true);

      const clueDown: ClueResult = {
        clueType: 'RELEASE_YEAR',
        status: 'CLOSE',
        direction: 'DOWN',
        matchedValues: [],
        displayValue: '2024',
      };
      const displayDown = formatClueDisplay(clueDown);
      expect(displayDown.statusLine).toBe('Close · Target is earlier');
      expect(displayDown.badgeText).toBe('Close ↓');
    });

    it('formats numeric NONE with contextual direction (higher/lower)', () => {
      const clueHigher: ClueResult = {
        clueType: 'RATING',
        status: 'NONE',
        direction: 'UP',
        matchedValues: [],
        displayValue: '6.2',
      };
      const displayHigher = formatClueDisplay(clueHigher);
      expect(displayHigher.statusLine).toBe('No Match · Target is higher');
      expect(displayHigher.badgeText).toBe('No Match ↑');

      const clueLower: ClueResult = {
        clueType: 'BOX_OFFICE',
        status: 'NONE',
        direction: 'DOWN',
        matchedValues: [],
        displayValue: '₹500 Cr',
      };
      const displayLower = formatClueDisplay(clueLower);
      expect(displayLower.statusLine).toBe('No Match · Target is lower');
      expect(displayLower.badgeText).toBe('No Match ↓');
    });

    it('formats PARTIAL matches with descriptive shared count', () => {
      const genreClue: ClueResult = {
        clueType: 'GENRES',
        status: 'PARTIAL',
        direction: 'NONE',
        matchedValues: ['Action', 'Drama'],
        displayValue: 'Action, Comedy, Drama',
      };
      const genreDisplay = formatClueDisplay(genreClue);
      expect(genreDisplay.badgeText).toBe('2 Shared Genres');
      expect(genreDisplay.statusLine).toBe('Action, Drama');

      const castClue: ClueResult = {
        clueType: 'SUPPORTING_CAST',
        status: 'PARTIAL',
        direction: 'NONE',
        matchedValues: ['Ramya Krishnan'],
        displayValue: 'Ramya Krishnan, Sathyaraj',
      };
      const castDisplay = formatClueDisplay(castClue);
      expect(castDisplay.badgeText).toBe('1 Shared Cast');
    });

    it('formats UNAVAILABLE gracefully', () => {
      const unavailClue: ClueResult = {
        clueType: 'BOX_OFFICE',
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: '—',
      };
      const display = formatClueDisplay(unavailClue);
      expect(display.statusLine).toBe('Unavailable');
      expect(display.badgeText).toBe('Unavailable');
      expect(display.showDirection).toBe(false);
    });
  });

  describe('3. Person Extraction from Clue Metadata', () => {
    it('extracts structured persons for avatars in Cast & Director cells', () => {
      const clueWithPersons: ClueResult = {
        clueType: 'LEAD_ACTOR',
        status: 'PARTIAL',
        direction: 'NONE',
        matchedValues: ['Prabhas'],
        displayValue: 'Prabhas',
        metadata: {
          persons: [
            {
              id: 'p-1',
              canonicalName: 'Prabhas',
              image: 'https://image.tmdb.org/t/p/w185/prabhas.jpg',
              matched: true,
            },
          ],
        },
      };

      const display = formatClueDisplay(clueWithPersons);
      expect(display.persons).toHaveLength(1);
      expect(display.persons[0]).toEqual({
        id: 'p-1',
        canonicalName: 'Prabhas',
        image: 'https://image.tmdb.org/t/p/w185/prabhas.jpg',
        matched: true,
      });
    });
  });
});
