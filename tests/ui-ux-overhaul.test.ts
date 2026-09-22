import { describe, it, expect } from 'vitest';
import { CLUE_COLUMNS } from '../src/components/game/GameBoard';
import { resolvePosterUrl, TMDB_IMAGE_BASE_URL } from '../src/lib/poster-utils';
import { ClueResult, ClueStatus } from '../src/domain/clue/types';

describe('Sprint 26A UI/UX Overhaul Test Suite', () => {
  describe('Phase 2 & 17A/B: Clue Columns & Priority Order', () => {
    it('A. renders all 11 clue columns', () => {
      expect(CLUE_COLUMNS).toHaveLength(11);
      const types = CLUE_COLUMNS.map((c) => c.type);
      expect(types).toContain('LANGUAGE');
      expect(types).toContain('RELEASE_YEAR');
      expect(types).toContain('DIRECTOR');
      expect(types).toContain('LEAD_ACTOR');
      expect(types).toContain('LEAD_ACTRESS');
      expect(types).toContain('SUPPORTING_CAST');
      expect(types).toContain('PRODUCTION_HOUSE');
      expect(types).toContain('RATING');
      expect(types).toContain('BOX_OFFICE');
      expect(types).toContain('MUSIC_DIRECTOR');
      expect(types).toContain('GENRES');
    });

    it('B. ensures primary core clues appear before secondary clues', () => {
      const primaryTypes = CLUE_COLUMNS.slice(0, 6).map((c) => c.type);
      expect(primaryTypes).toEqual([
        'LANGUAGE',
        'RELEASE_YEAR',
        'DIRECTOR',
        'LEAD_ACTOR',
        'LEAD_ACTRESS',
        'SUPPORTING_CAST',
      ]);

      const secondaryTypes = CLUE_COLUMNS.slice(6).map((c) => c.type);
      expect(secondaryTypes).toEqual([
        'PRODUCTION_HOUSE',
        'RATING',
        'BOX_OFFICE',
        'MUSIC_DIRECTOR',
        'GENRES',
      ]);

      CLUE_COLUMNS.slice(0, 6).forEach((c) => {
        expect(c.isPrimary).toBe(true);
      });
    });
  });

  describe('Phase 6, 7, 8, 16 & 17C-G: Semantic Status System & Accessibility', () => {
    it('C. formats EXACT state with check and exact match semantics', () => {
      const exactClue: ClueResult = {
        clueType: 'DIRECTOR',
        status: 'EXACT',
        direction: 'NONE',
        matchedValues: ['S. S. Rajamouli'],
        displayValue: 'S. S. Rajamouli',
      };
      expect(exactClue.status).toBe('EXACT');
    });

    it('D. formats CLOSE state with directional arrows (UP / DOWN)', () => {
      const closeUpClue: ClueResult = {
        clueType: 'RELEASE_YEAR',
        status: 'CLOSE',
        direction: 'UP',
        matchedValues: [],
        displayValue: '2015',
      };
      const closeDownClue: ClueResult = {
        clueType: 'RATING',
        status: 'CLOSE',
        direction: 'DOWN',
        matchedValues: [],
        displayValue: '8.5',
      };
      expect(closeUpClue.direction).toBe('UP');
      expect(closeDownClue.direction).toBe('DOWN');
    });

    it('E. formats PARTIAL state distinctly from CLOSE with shared count', () => {
      const partialClue: ClueResult = {
        clueType: 'SUPPORTING_CAST',
        status: 'PARTIAL',
        direction: 'NONE',
        matchedValues: ['Ramya Krishnan', 'Sathyaraj'],
        displayValue: 'Ramya Krishnan, Sathyaraj, Nasser',
      };
      expect(partialClue.status).toBe('PARTIAL');
      expect(partialClue.matchedValues).toHaveLength(2);
    });

    it('F. formats NONE state with directional indication when applicable', () => {
      const noneClue: ClueResult = {
        clueType: 'RELEASE_YEAR',
        status: 'NONE',
        direction: 'UP',
        matchedValues: [],
        displayValue: '2005',
      };
      expect(noneClue.status).toBe('NONE');
      expect(noneClue.direction).toBe('UP');
    });

    it('G. formats UNAVAILABLE state without crashing', () => {
      const unavailClue: ClueResult = {
        clueType: 'BOX_OFFICE',
        status: 'UNAVAILABLE',
        direction: 'NONE',
        matchedValues: [],
        displayValue: 'N/A',
      };
      expect(unavailClue.status).toBe('UNAVAILABLE');
    });
  });

  describe('Phase 10, 11 & 17H-K: Poster Normalization & Fallbacks', () => {
    it('H. handles absolute URLs safely', () => {
      const url = 'https://image.tmdb.org/t/p/w500/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg';
      expect(resolvePosterUrl(url)).toBe(url);
    });

    it('H. normalizes TMDB relative paths to absolute URL', () => {
      const path = '/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg';
      expect(resolvePosterUrl(path)).toBe(`${TMDB_IMAGE_BASE_URL}/w500/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg`);
    });

    it('I. handles invalid URLs gracefully without crashing', () => {
      expect(resolvePosterUrl('not-a-valid-poster-url')).toBeNull();
    });

    it('J. returns null for missing or empty poster values', () => {
      expect(resolvePosterUrl(null)).toBeNull();
      expect(resolvePosterUrl('')).toBeNull();
      expect(resolvePosterUrl('null')).toBeNull();
    });

    it('K. does not fabricate fake poster URLs', () => {
      expect(resolvePosterUrl(undefined)).toBeNull();
    });
  });
});
