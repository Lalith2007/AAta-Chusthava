'use client';

import React, { useState } from 'react';
import { SessionGuessSummary } from '@/domain/game/types';
import { ClueType, ClueResult } from '@/domain/clue/types';
import ClueCell from './ClueCell';
import CastTile from './CastTile';
import { Film, ChevronDown, ChevronUp, Music } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

interface GameBoardProps {
  guesses: SessionGuessSummary[];
  maxAttempts: number;
}

/**
 * 11-Clue Specification for engine compatibility and testing.
 * The first 6 are primary; remaining 5 are secondary.
 */
export const CLUE_COLUMNS: { type: ClueType; label: string; isPrimary?: boolean }[] = [
  // Primary / Core Clues (Prioritized in first viewport)
  { type: 'LANGUAGE', label: 'Language', isPrimary: true },
  { type: 'RELEASE_YEAR', label: 'Year', isPrimary: true },
  { type: 'DIRECTOR', label: 'Director', isPrimary: true },
  { type: 'LEAD_ACTOR', label: 'Lead Actor', isPrimary: true },
  { type: 'LEAD_ACTRESS', label: 'Lead Actress', isPrimary: true },
  { type: 'SUPPORTING_CAST', label: 'Supporting Cast', isPrimary: true },
  // Secondary Clues
  { type: 'PRODUCTION_HOUSE', label: 'Studio' },
  { type: 'RATING', label: 'Rating' },
  { type: 'BOX_OFFICE', label: 'Box Office' },
  { type: 'MUSIC_DIRECTOR', label: 'Music Director' },
  { type: 'GENRES', label: 'Genres' },
];

function getSafeClue(clues: Record<string, ClueResult>, type: ClueType): ClueResult {
  return (
    clues[type] || {
      clueType: type,
      status: 'UNAVAILABLE',
      direction: 'NONE',
      matchedValues: [],
      displayValue: '—',
    }
  );
}

export default function GameBoard({ guesses, maxAttempts }: GameBoardProps) {
  const [expandedMusic, setExpandedMusic] = useState<Record<number, boolean>>({});

  const toggleMusic = (guessIdx: number) => {
    setExpandedMusic((prev) => ({
      ...prev,
      [guessIdx]: !prev[guessIdx],
    }));
  };

  if (guesses.length === 0) {
    return (
      <div className="w-full text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
        <Film className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
        <h4 className="text-base font-bold text-slate-300">
          Guess 1 of {maxAttempts}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Search and pick any Telugu or Hindi film from 2002 to present. Compare the clues to deduce the mystery movie!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full my-6 select-none space-y-4">
      {/* Board Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Deduction Board
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {guesses.length} / {maxAttempts} Attempts
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-amber-400 font-bold">
            {maxAttempts - guesses.length} remaining
          </span>
        </div>
      </div>

      {/* Spotle-Style Card Stream — No 1360px forced scrollbar */}
      <div className="w-full space-y-3">
        {guesses.map((guess, guessIndex) => {
          const summary = guess.evaluation.guessedMovieSummary;
          const clues = (guess.evaluation.clues || {}) as Record<string, ClueResult>;

          const languageClue = getSafeClue(clues, 'LANGUAGE');
          const yearClue = getSafeClue(clues, 'RELEASE_YEAR');
          const directorClue = getSafeClue(clues, 'DIRECTOR');
          const leadActorClue = getSafeClue(clues, 'LEAD_ACTOR');
          const leadActressClue = getSafeClue(clues, 'LEAD_ACTRESS');
          const supportingCastClue = getSafeClue(clues, 'SUPPORTING_CAST');
          const studioClue = getSafeClue(clues, 'PRODUCTION_HOUSE');
          const ratingClue = getSafeClue(clues, 'RATING');
          const boxOfficeClue = getSafeClue(clues, 'BOX_OFFICE');
          const genresClue = getSafeClue(clues, 'GENRES');
          const musicClue = getSafeClue(clues, 'MUSIC_DIRECTOR');

          const isMusicOpen = Boolean(expandedMusic[guessIndex]);

          return (
            <div
              key={guess.id || guessIndex}
              className="w-full rounded-2xl bg-[#0c1220]/90 border border-slate-800/90 shadow-xl p-3 sm:p-4 hover:border-slate-700 transition-all duration-200"
            >
              {/* Row Header: Movie Identity Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400 flex-shrink-0">
                    {guess.attemptNumber}
                  </span>

                  <div className="w-10 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 shadow-md">
                    <MoviePoster
                      src={summary?.posterAsset}
                      alt={summary?.title || 'Movie'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-extrabold text-slate-100 truncate"
                      title={summary?.title}
                    >
                      {summary?.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs text-amber-400 font-bold">
                        {summary?.releaseYear}
                      </span>
                      {summary?.languages && summary.languages.length > 0 && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {summary.languages[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Secondary Clue (Music Director) toggle */}
                <button
                  type="button"
                  onClick={() => toggleMusic(guessIndex)}
                  className="self-start sm:self-auto flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>Music: {musicClue.displayValue || 'Details'}</span>
                  {isMusicOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* 8 Primary Clue Groups Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5 items-stretch">
                {/* 1. Language */}
                <ClueCell clue={languageClue} label="Language" delayIndex={0} />

                {/* 2. Release Year */}
                <ClueCell clue={yearClue} label="Year" delayIndex={1} />

                {/* 3. Director */}
                <ClueCell clue={directorClue} label="Director" delayIndex={2} />

                {/* 4. Cast (Unified Lead Actor + Lead Actress + Supporting Cast) */}
                <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                  <CastTile
                    leadActorClue={leadActorClue}
                    leadActressClue={leadActressClue}
                    supportingCastClue={supportingCastClue}
                    delayIndex={3}
                  />
                </div>

                {/* 5. Studio */}
                <ClueCell clue={studioClue} label="Studio" delayIndex={4} />

                {/* 6. Rating */}
                <ClueCell clue={ratingClue} label="Rating" delayIndex={5} />

                {/* 7. Box Office */}
                <ClueCell clue={boxOfficeClue} label="Box Office" delayIndex={6} />

                {/* 8. Genres */}
                <ClueCell clue={genresClue} label="Genres" delayIndex={7} />
              </div>

              {/* Expanded Music Director Drawer */}
              {isMusicOpen && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50">
                  <div className="flex items-center space-x-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Music Director
                      </p>
                      <p className="text-xs font-bold text-slate-100">
                        {musicClue.displayValue || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <ClueCell clue={musicClue} label="Music" delayIndex={8} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
