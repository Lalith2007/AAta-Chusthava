'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Frown, Share2, Check, Swords, Calendar, X, Star } from 'lucide-react';
import { RevealedTargetSummary, SessionGuessSummary } from '@/domain/game/types';
import { ClueResult } from '@/domain/clue/types';
import MoviePoster from '@/components/movie/MoviePoster';

interface GameOverModalProps {
  isWon: boolean;
  target?: RevealedTargetSummary | null;
  attemptsUsed: number;
  maxAttempts: number;
  mode: string;
  guesses: SessionGuessSummary[];
  onClose: () => void;
}

export default function GameOverModal({
  isWon,
  target,
  attemptsUsed,
  maxAttempts,
  mode,
  guesses,
  onClose,
}: GameOverModalProps) {
  const [copied, setCopied] = useState(false);

  const generateShareMatrix = () => {
    const title =
      mode === 'DAILY'
        ? 'Daily AAta Chusthava'
        : mode === 'CHALLENGE'
        ? 'Friend Challenge AAta Chusthava'
        : 'AAta Chusthava';

    const score = isWon ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`;
    let matrix = '';

    for (const g of guesses) {
      const clues = (g.evaluation?.clues || {}) as Record<string, ClueResult>;
      let row = '';
      for (const key of Object.keys(clues)) {
        const status = clues[key]?.status;
        if (status === 'EXACT') row += '🟩';
        else if (status === 'CLOSE') row += '🟨';
        else if (status === 'PARTIAL') row += '🟪';
        else if (status === 'UNAVAILABLE') row += '⬜';
        else row += '⬛';
      }
      matrix += `${row}\n`;
    }

    const appUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://aatachusthava.com';
    return `🎬 ${title} ${score}\n\n${matrix}\nPlay at: ${appUrl}`;
  };

  const handleShare = async () => {
    const text = generateShareMatrix();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy share text:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c1220] border border-slate-700/80 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Victory/Defeat Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-inner mb-3">
            {isWon ? (
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
            ) : (
              <Frown className="w-10 h-10 text-red-400 animate-pulse" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isWon ? 'Bravo! You Solved It!' : 'Game Over! Better Luck Next Time!'}
          </h2>

          <p className="text-sm text-slate-400 mt-1 font-medium">
            {isWon
              ? `You deduced the movie in ${attemptsUsed} of ${maxAttempts} attempts!`
              : `You used all ${maxAttempts} attempts. Here is the secret film:`}
          </p>
        </div>

        {/* Revealed Movie Hero Card */}
        {target && (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-xl my-4">
            {/* Prominent Poster */}
            <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 shadow-lg">
              <MoviePoster src={target.posterAsset} alt={target.title} />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-black text-lg sm:text-xl text-amber-300">
                  {target.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-extrabold border border-amber-500/30">
                  {target.releaseYear}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Directed by: </span>
                {target.directors.join(', ') || 'Unknown'}
              </p>

              <p className="text-xs text-slate-300 font-medium line-clamp-2">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Lead Cast: </span>
                {[...target.leadActors, ...target.leadActresses].join(', ') || 'Lead Cast'}
              </p>

              {/* Rating + Box Office Stats Row */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                {target.ratingDisplay && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{target.ratingDisplay}</span>
                  </span>
                )}
                {target.boxOfficeDisplay && (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    {target.boxOfficeDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Button */}
        <div className="my-5">
          <button
            onClick={handleShare}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                <span>Result Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                <span>Share Spoiler-Free Result</span>
              </>
            )}
          </button>
        </div>

        {/* Action Links */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <Link
            href="/create"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors text-center"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Challenge a Friend</span>
          </Link>

          <Link
            href="/archive"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors text-center"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Puzzle Archive</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
