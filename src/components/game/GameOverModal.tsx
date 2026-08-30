'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Frown, Share2, Check, Swords, Calendar, X, Film, Star } from 'lucide-react';
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
        else if (status === 'PARTIAL') row += '🟧';
        else if (status === 'UNAVAILABLE') row += '⬜';
        else row += '⬛';
      }
      matrix += `${row}\n`;
    }

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aatachusthava.com';
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
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-slate-700/80 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Victory/Defeat Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-inner mb-3">
            {isWon ? (
              <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            ) : (
              <Frown className="w-12 h-12 text-red-400 animate-pulse" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isWon ? 'Bravo! You Solved It!' : 'Game Over! Better Luck Next Time!'}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            {isWon
              ? `You deduced the movie in ${attemptsUsed} of ${maxAttempts} attempts!`
              : `You used all ${maxAttempts} attempts. Here is the secret film:`}
          </p>
        </div>

        {/* Revealed Movie Card */}
        {target && (
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#0a0f1c] border border-amber-500/30 shadow-lg my-4">
            <div className="w-20 h-28 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 shadow-md">
              <MoviePoster
                src={target.posterAsset}
                alt={target.title}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-amber-300 truncate">
                  {target.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {target.releaseYear}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                Dir: {target.directors.join(', ') || 'Unknown'}
              </p>
              <p className="text-xs text-slate-400 line-clamp-1">
                Cast: {[...target.leadActors, ...target.leadActresses].join(', ') || 'Lead Cast'}
              </p>
              <p className="text-xs text-slate-400 line-clamp-1">
                Music: {target.musicDirectors.join(', ') || 'Composer'}
              </p>

              <div className="flex items-center space-x-3 mt-2 text-xs">
                {target.ratingDisplay && (
                  <span className="text-amber-400 font-bold flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{target.ratingDisplay}</span>
                  </span>
                )}
                {target.boxOfficeDisplay && (
                  <span className="text-emerald-400 font-bold">
                    {target.boxOfficeDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Button with spoiler-free matrix */}
        <div className="my-5">
          <button
            onClick={handleShare}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-[0.98]"
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
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
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
