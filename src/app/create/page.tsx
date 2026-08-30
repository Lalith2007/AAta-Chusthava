'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GuessSearchBar from '@/components/game/GuessSearchBar';
import { MovieSearchResult } from '@/domain/movie/types';
import { Swords, Share2, Check, Copy, Film, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

export default function CreateChallengePage() {
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [creatorName, setCreatorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<{
    publicCode: string;
    shareUrl: string;
    targetMovieTitle: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!selectedMovie) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: selectedMovie.id,
          creatorName: creatorName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Failed to create challenge.');
        return;
      }

      setCreatedChallenge({
        publicCode: data.publicCode,
        shareUrl: data.shareUrl,
        targetMovieTitle: data.targetMovieTitle,
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while creating challenge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdChallenge) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(createdChallenge.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 mb-2">
          <Swords className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          Challenge a Friend
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Pick any Telugu or Hindi film from our library, generate an opaque secret link, and see if your friends can guess it in 10 attempts!
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!createdChallenge ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          {/* Step 1: Select Movie */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              1. Search and Select Secret Movie
            </label>
            <GuessSearchBar
              onSelectMovie={(movie) => setSelectedMovie(movie)}
              isLoading={isLoading}
              searchMode="target"
              placeholder="Search target movie (e.g. Baahubali, Kalki 2898 AD, 3 Idiots)..."
            />
          </div>

          {/* Selected Movie Preview */}
          {selectedMovie && (
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 animate-slide-up">
              <div className="w-14 h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                <MoviePoster
                  src={selectedMovie.posterAsset}
                  alt={selectedMovie.primaryTitle}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-base text-white truncate">
                    {selectedMovie.primaryTitle}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                    {selectedMovie.releaseYear}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedMovie.supportedLanguages.join(' • ')}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Dir: {selectedMovie.directorNames.join(', ') || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setSelectedMovie(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Change
              </button>
            </div>
          )}

          {/* Step 2: Creator Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Your Name or Alias (Optional)
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Tollywood Mastermind, Cinephile Raju"
              className="w-full px-4 py-3 rounded-xl bg-[#0f1422] border border-slate-700 text-slate-100 text-sm placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!selectedMovie || isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Challenge Link</span>
          </button>
        </div>
      ) : (
        /* Challenge Created Success Card */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-6 text-center animate-slide-up">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Challenge Created!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Secret Target: <strong>{createdChallenge.targetMovieTitle}</strong>
            </p>
          </div>

          {/* Secret Public Code Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 max-w-sm mx-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400">Challenge Code</span>
            <p className="text-3xl font-black text-amber-400 tracking-widest my-1">
              {createdChallenge.publicCode}
            </p>
            <span className="text-[11px] text-slate-500">The secret movie remains 100% hidden until solved!</span>
          </div>

          {/* Share URL Input with Copy Button */}
          <div className="flex items-center space-x-2 max-w-md mx-auto">
            <input
              type="text"
              readOnly
              value={createdChallenge.shareUrl}
              className="flex-1 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 font-mono select-all outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
            <Link
              href={`/challenge/${createdChallenge.publicCode}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <span>Play Challenge Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setCreatedChallenge(null);
                setSelectedMovie(null);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Create Another Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
