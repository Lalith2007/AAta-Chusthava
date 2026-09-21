'use client';

import React from 'react';
import { SessionGuessSummary } from '@/domain/game/types';
import { ClueType } from '@/domain/clue/types';
import ClueCell from './ClueCell';
import { Film, ChevronRight } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

interface GameBoardProps {
  guesses: SessionGuessSummary[];
  maxAttempts: number;
}

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

export default function GameBoard({ guesses, maxAttempts }: GameBoardProps) {
  if (guesses.length === 0) {
    return (
      <div className="w-full text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
        <Film className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
        <h4 className="text-base font-bold text-slate-300">
          Guess 1 of {maxAttempts}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Search and pick any Telugu or Hindi film from 2002 to present. Compare the 11 clues to deduce the mystery movie!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full my-6 select-none">
      {/* Matrix Header Controls */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Deduction Board
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {guesses.length} / {maxAttempts} Attempts
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="hidden sm:inline-flex items-center text-[11px] text-slate-400">
            Primary clues shown first <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </span>
          <span className="text-amber-400 font-bold">
            {maxAttempts - guesses.length} remaining
          </span>
        </div>
      </div>

      {/* Responsive Clue Matrix with Sticky Movie Column */}
      <div className="w-full overflow-x-auto pb-3 custom-scrollbar rounded-2xl border border-slate-800/90 glass-panel shadow-2xl relative">
        <div className="min-w-[1360px] p-3 space-y-2.5">
          {/* Header Row for Column Labels */}
          <div className="flex items-center space-x-2 px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/80">
            <div className="w-[180px] sm:w-[200px] flex-shrink-0 sticky left-0 z-30 bg-[#0c1220]/95 backdrop-blur-md pl-2">
              Guessed Movie
            </div>
            <div className="flex items-center space-x-2 flex-1 pl-1">
              {CLUE_COLUMNS.map((col) => (
                <div
                  key={col.type}
                  className={`w-[104px] sm:w-[116px] min-w-[104px] sm:min-w-[116px] text-center ${
                    col.isPrimary ? 'text-amber-400/90 font-black' : 'text-slate-400'
                  }`}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Guess Rows */}
          {guesses.map((guess, guessIndex) => {
            const summary = guess.evaluation.guessedMovieSummary;
            const clues = guess.evaluation.clues;

            return (
              <div
                key={guess.id || guessIndex}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-150"
              >
                {/* Sticky Left Movie Card */}
                <div className="w-[180px] sm:w-[200px] flex-shrink-0 sticky left-0 z-20 flex items-center space-x-2.5 bg-[#0c1220] p-2 rounded-xl border border-slate-700/80 shadow-[6px_0_16px_rgba(0,0,0,0.7)]">
                  <span className="w-5 text-center text-xs font-black text-amber-400">
                    #{guess.attemptNumber}
                  </span>
                  <div className="w-10 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 shadow-sm">
                    <MoviePoster
                      src={summary?.posterAsset}
                      alt={summary?.title || 'Movie'}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-extrabold text-slate-100 truncate" title={summary?.title}>
                      {summary?.title}
                    </p>
                    <p className="text-[10px] text-amber-400 font-bold mt-0.5">
                      {summary?.releaseYear}
                    </p>
                  </div>
                </div>

                {/* 11 Prioritized Clue Cells */}
                <div className="flex items-center space-x-2 flex-1">
                  {CLUE_COLUMNS.map((col, colIdx) => {
                    const clue = clues[col.type] || {
                      clueType: col.type,
                      status: 'UNAVAILABLE',
                      direction: 'NONE',
                      matchedValues: [],
                      displayValue: '—',
                    };

                    return (
                      <ClueCell
                        key={col.type}
                        clue={clue}
                        label={col.label}
                        delayIndex={colIdx}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
