'use client';

import React, { useState } from 'react';
import { Lightbulb, Lock, Unlock, Eye, Sparkles } from 'lucide-react';
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
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0c1220]/90 border border-slate-800/90 shadow-xl p-4 sm:p-5 my-5">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>Mystery Movie Hints</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Strategic clue reveals unlock as you narrow down your deductions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Hint 1 (Attempt 5 - Director Clue) */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            hint1
              ? 'border-amber-500/40 bg-slate-900/80 shadow-md shadow-amber-950/20'
              : 'border-slate-800 bg-slate-900/40 opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  hint1
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {hint1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Hint 1 · Director
                  </span>
                  {hint1?.revealedAt && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Revealed
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-1 font-medium">
                  {hint1
                    ? (hint1.hintContent as { hintText?: string })?.hintText ||
                      'Director clue is ready to be revealed'
                    : `Unlocks at guess 5 (${Math.max(0, 5 - attemptsUsed)} remaining)`}
                </p>
              </div>
            </div>

            {hint1 && !hint1.revealedAt && (
              <button
                type="button"
                onClick={() => handleReveal(hint1.id)}
                disabled={revealingId === hint1.id}
                className="px-3 py-1.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 flex-shrink-0 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{revealingId === hint1.id ? 'Revealing...' : 'Reveal'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hint 2 (Attempt 8 - Era & Genre) */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            hint2
              ? 'border-amber-500/40 bg-slate-900/80 shadow-md shadow-amber-950/20'
              : 'border-slate-800 bg-slate-900/40 opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  hint2
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {hint2 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Hint 2 · Era & Genre
                  </span>
                  {hint2?.revealedAt && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Revealed
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-1 font-medium">
                  {hint2
                    ? (hint2.hintContent as { hintText?: string })?.hintText ||
                      'Era & genre clue is ready to be revealed'
                    : `Unlocks at guess 8 (${Math.max(0, 8 - attemptsUsed)} remaining)`}
                </p>
              </div>
            </div>

            {hint2 && !hint2.revealedAt && (
              <button
                type="button"
                onClick={() => handleReveal(hint2.id)}
                disabled={revealingId === hint2.id}
                className="px-3 py-1.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 flex-shrink-0 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{revealingId === hint2.id ? 'Revealing...' : 'Reveal'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
