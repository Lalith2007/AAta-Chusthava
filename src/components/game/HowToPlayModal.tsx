'use client';

import React from 'react';
import { X, Film, Check, ArrowUp, Minus, HelpCircle, Swords } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel border border-slate-700/80 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">How to Play AAta Chusthava</h2>
            <p className="text-xs text-slate-400">Indian Cinema Deduction Game (2002 → Present)</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <p>
            Your mission is to deduce the <strong>secret Indian movie</strong> (Telugu / Tollywood or Hindi / Bollywood from 2002 onward) in <strong>10 attempts or fewer</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              11 Clues Evaluated on Every Guess
            </h4>
            <p className="text-xs text-slate-400">
              Each guess compares 11 attributes against the secret target movie:
            </p>
            <ul className="grid grid-cols-2 gap-1.5 text-xs text-slate-300 pt-1">
              <li>• Language</li>
              <li>• Director</li>
              <li>• Studio / Banner</li>
              <li>• Release Year</li>
              <li>• Box Office</li>
              <li>• Rating</li>
              <li>• Lead Actor</li>
              <li>• Lead Actress</li>
              <li>• Supporting Cast</li>
              <li>• Music Director</li>
              <li className="col-span-2">• Genres</li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              Clue Indicator Meanings
            </h4>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
              <div className="p-1 rounded bg-emerald-500 text-slate-950 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-xs">Green (Exact Match)</p>
                <p className="text-[11px] text-emerald-300/80">The guessed attribute exactly matches the secret movie.</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
              <div className="p-1 rounded bg-amber-400 text-slate-950 mt-0.5">
                <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-xs">Yellow + Arrow (Close Match & Direction)</p>
                <p className="text-[11px] text-amber-300/80">
                  Year (±3 yrs) or Rating (±0.5). Arrow indicates whether the target is <strong>higher (↑)</strong> or <strong>lower (↓)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-200">
              <div className="p-1 rounded bg-orange-500 text-slate-950 mt-0.5">
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-xs">Orange (Partial Match)</p>
                <p className="text-[11px] text-orange-300/80">
                  Overlap in languages, genres, or supporting cast members.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <div className="p-1 rounded bg-slate-800 text-slate-400 mt-0.5">
                <span className="text-xs px-1">✕</span>
              </div>
              <div>
                <p className="font-bold text-xs">Gray (No Match)</p>
                <p className="text-[11px] text-slate-500">The attribute does not match.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center space-x-2 text-xs">
            <Swords className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Challenge a Friend:</strong> You can create private challenges with any film and share an opaque link with your friends!
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors mt-2"
          >
            Got it! Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
