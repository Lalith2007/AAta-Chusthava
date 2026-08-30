'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Film, Trophy, Frown, Share2, Check, Swords, Calendar, Loader2, Star } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

export default function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/games/${sessionId}/result`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          const errData = await res.json();
          setError(errData.error?.message || 'Result not found or game not finished.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error while loading game result.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [sessionId]);

  const handleShare = async () => {
    if (!result?.shareText) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-xs text-slate-400">Loading Game Results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-panel rounded-3xl border border-red-500/40 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Result Not Available</h2>
        <p className="text-xs text-slate-400">{error || 'This game session has not concluded yet.'}</p>
        <Link
          href="/play"
          className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
        >
          Play Daily Game
        </Link>
      </div>
    );
  }

  const target = result.target;

  return (
    <div className="w-full max-w-xl mx-auto py-8 space-y-6 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-inner">
          {result.isWon ? (
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          ) : (
            <Frown className="w-12 h-12 text-red-400" />
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {result.isWon ? 'Mission Accomplished!' : 'Game Finished'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {result.isWon
              ? `Solved in ${result.attemptsUsed} of ${result.maxAttempts} attempts!`
              : `Used all ${result.maxAttempts} attempts.`}
          </p>
        </div>

        {/* Revealed Movie Card */}
        {target && (
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#0a0f1c] border border-amber-500/30 text-left shadow-lg">
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
                Cast: {[...target.leadActors, ...target.leadActresses].join(', ') || 'Cast'}
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

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Result Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              <span>Share Spoiler-Free Result</span>
            </>
          )}
        </button>

        {/* Action Links */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
          <Link
            href="/create"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Challenge Friend</span>
          </Link>

          <Link
            href="/archive"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Daily Archive</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
