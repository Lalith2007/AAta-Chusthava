'use client';

import React from 'react';
import { SessionGuessSummary } from '@/domain/game/types';
import { ClueType } from '@/domain/clue/types';
import ClueCell from './ClueCell';
import { Film } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

interface GameBoardProps {
  guesses: SessionGuessSummary[];
  maxAttempts: number;
}

const CLUE_COLUMNS: { type: ClueType; label: string }[] = [
  { type: 'LANGUAGE', label: 'Language' },
  { type: 'DIRECTOR', label: 'Director' },
  { type: 'PRODUCTION_HOUSE', label: 'Studio' },
  { type: 'RELEASE_YEAR', label: 'Year' },
  { type: 'BOX_OFFICE', label: 'Box Office' },
  { type: 'RATING', label: 'Rating' },
  { type: 'LEAD_ACTOR', label: 'Lead Actor' },
  { type: 'LEAD_ACTRESS', label: 'Lead Actress' },
  { type: 'SUPPORTING_CAST', label: 'Supporting Cast' },
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
    <div className="w-full my-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Guesses Matrix ({guesses.length} / {maxAttempts})
        </span>
        <span className="text-xs text-amber-400 font-semibold">
          {maxAttempts - guesses.length} attempts left
        </span>
      </div>

      {/* Local scrollable clue matrix container for flawless mobile experience */}
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar rounded-2xl border border-slate-800/80 glass-panel shadow-2xl">
        <div className="min-w-[1250px] p-3 space-y-3">
          {guesses.map((guess, guessIndex) => {
            const summary = guess.evaluation.guessedMovieSummary;
            const clues = guess.evaluation.clues;

            return (
              <div
                key={guess.id || guessIndex}
                className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-colors"
              >
                {/* Fixed Movie Header on Row */}
                <div className="w-[170px] flex-shrink-0 flex items-center space-x-2.5 bg-[#0e1422] p-2 rounded-xl border border-slate-700/80 shadow-md">
                  <span className="w-5 text-center text-xs font-extrabold text-amber-400">
                    #{guess.attemptNumber}
                  </span>
                  <div className="w-10 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                    <MoviePoster
                      src={summary?.posterAsset}
                      alt={summary?.title || 'Movie'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate" title={summary?.title}>
                      {summary?.title}
                    </p>
                    <p className="text-[10px] text-amber-400 font-semibold">
                      {summary?.releaseYear}
                    </p>
                  </div>
                </div>

                {/* 11 Clue Cells */}
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
