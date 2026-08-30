'use client';

import React, { useState } from 'react';
import { Lightbulb, Lock, Unlock, Eye } from 'lucide-react';
import { SessionHintSummary } from '@/domain/game/types';

interface HintBarProps {
  sessionId: string;
  attemptsUsed: number;
  hints: SessionHintSummary[];
  onRevealHint?: (hintId: string) => void;
}

export default function HintBar({
  sessionId,
  attemptsUsed,
  hints,
  onRevealHint,
}: HintBarProps) {
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const handleReveal = async (hintId: string) => {
    setRevealingId(hintId);
    try {
      const res = await fetch(`/api/games/${sessionId}/hints/${hintId}/use`, {
        method: 'POST',
      });
      if (res.ok) {
        onRevealHint?.(hintId);
      }
    } catch (err) {
      console.error('Failed to reveal hint:', err);
    } finally {
      setRevealingId(null);
    }
  };

  const hint1 = hints[0];
  const hint2 = hints[1];

  return (
    <div className="w-full glass-card p-3 sm:p-4 rounded-2xl border border-slate-800 my-4">
      <div className="flex items-center space-x-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-200">
          Clue & Hint Unlocks
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Hint 1 (Attempt 5) */}
        <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                hint1
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {hint1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Hint 1 (Director)</p>
              <p className="text-[11px] text-slate-400">
                {hint1
                  ? (hint1.hintContent as any)?.hintText || 'Director clue available'
                  : `Unlocks after 5 guesses (${Math.max(0, 5 - attemptsUsed)} left)`}
              </p>
            </div>
          </div>

          {hint1 && !hint1.revealedAt && (
            <button
              onClick={() => handleReveal(hint1.id)}
              disabled={revealingId === hint1.id}
              className="px-2.5 py-1 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal</span>
            </button>
          )}
        </div>

        {/* Hint 2 (Attempt 8) */}
        <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                hint2
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {hint2 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Hint 2 (Era & Genre)</p>
              <p className="text-[11px] text-slate-400">
                {hint2
                  ? (hint2.hintContent as any)?.hintText || 'Era clue available'
                  : `Unlocks after 8 guesses (${Math.max(0, 8 - attemptsUsed)} left)`}
              </p>
            </div>
          </div>

          {hint2 && !hint2.revealedAt && (
            <button
              onClick={() => handleReveal(hint2.id)}
              disabled={revealingId === hint2.id}
              className="px-2.5 py-1 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
