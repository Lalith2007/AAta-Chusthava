'use client';

import React, { useState, useEffect, use } from 'react';
import GuessSearchBar from '@/components/game/GuessSearchBar';
import GameBoard from '@/components/game/GameBoard';
import ClueLegend from '@/components/game/ClueLegend';
import HintBar from '@/components/game/HintBar';
import GameOverModal from '@/components/game/GameOverModal';
import { ClientSessionState, SubmitGuessResponse } from '@/domain/game/types';
import { MovieSearchResult } from '@/domain/movie/types';
import { Calendar, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import HowToPlayModal from '@/components/game/HowToPlayModal';

export default function PlayArchiveDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const [session, setSession] = useState<ClientSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    async function loadArchiveGame() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/games/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'ARCHIVE',
            date,
          }),
        });

        if (res.ok) {
          const data: ClientSessionState = await res.json();
          setSession(data);
          if (data.isCompleted) {
            setShowResultModal(true);
          }
        } else {
          const data = await res.json();
          setErrorMessage(data.error?.message || 'Archive puzzle not found.');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Network error while loading archive puzzle.');
      } finally {
        setIsLoading(false);
      }
    }
    loadArchiveGame();
  }, [date]);

  const handleSelectMovie = async (movie: MovieSearchResult) => {
    if (!session || session.isCompleted || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/games/${session.sessionId}/guesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie.id,
          clientRequestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Failed to submit guess');
        return;
      }

      const guessRes: SubmitGuessResponse = data;

      setSession((prev) => {
        if (!prev) return prev;
        const newGuesses = [
          ...prev.guesses,
          {
            id: `guess-${guessRes.attemptNumber}`,
            attemptNumber: guessRes.attemptNumber,
            movieId: movie.id,
            isCorrect: guessRes.isCorrect,
            evaluation: guessRes.evaluation,
            createdAt: new Date().toISOString(),
          },
        ];

        const isCompleted = guessRes.status === 'WON' || guessRes.status === 'LOST';
        return {
          ...prev,
          status: guessRes.status,
          attemptsUsed: guessRes.attemptsUsed,
          attemptsRemaining: guessRes.attemptsRemaining,
          guesses: newGuesses,
          isCompleted,
          isWon: guessRes.status === 'WON',
          revealedTarget: guessRes.revealedTarget || prev.revealedTarget,
          hints: guessRes.unlockedHint
            ? [...prev.hints, guessRes.unlockedHint]
            : prev.hints,
        };
      });

      if (guessRes.status === 'WON' || guessRes.status === 'LOST') {
        setTimeout(() => setShowResultModal(true), 600);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while submitting guess.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealHint = (hintId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hints: prev.hints.map((h) =>
          h.id === hintId ? { ...h, revealedAt: new Date().toISOString() } : h
        ),
      };
    });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold text-slate-400">Loading Archive Puzzle for {date}...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Daily Archive Game</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {date}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Playing historical daily puzzle from {date}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Attempts</p>
            <p className="text-sm font-extrabold text-emerald-400">
              {session?.attemptsUsed ?? 0} / {session?.maxAttempts ?? 10}
            </p>
          </div>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-300 transition-colors"
            title="How to play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs sm:text-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Movie Search Bar */}
      {!session?.isCompleted && (
        <GuessSearchBar
          onSelectMovie={handleSelectMovie}
          isLoading={isSubmitting}
          disabled={session?.isCompleted}
          searchMode="guess"
        />
      )}

      {/* Hints */}
      {session && session.hints.length > 0 && (
        <HintBar
          sessionId={session.sessionId}
          attemptsUsed={session.attemptsUsed}
          hints={session.hints}
          onRevealHint={handleRevealHint}
        />
      )}

      {/* Game Board */}
      <GameBoard
        guesses={session?.guesses || []}
        maxAttempts={session?.maxAttempts || 10}
      />

      {/* Clue Legend */}
      <ClueLegend />

      {/* Completed State Button */}
      {session?.isCompleted && (
        <div className="text-center p-6 rounded-2xl glass-card border border-emerald-500/30">
          <h3 className="text-lg font-extrabold text-white mb-2">
            {session.isWon ? '🎉 Puzzle Solved!' : 'Puzzle Completed'}
          </h3>
          <button
            onClick={() => setShowResultModal(true)}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
          >
            View Result & Share Card
          </button>
        </div>
      )}

      {/* Game Over Modal */}
      {showResultModal && (
        <GameOverModal
          isWon={session?.isWon ?? false}
          target={session?.revealedTarget}
          attemptsUsed={session?.attemptsUsed ?? 0}
          maxAttempts={session?.maxAttempts ?? 10}
          mode="ARCHIVE"
          guesses={session?.guesses || []}
          onClose={() => setShowResultModal(false)}
        />
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
