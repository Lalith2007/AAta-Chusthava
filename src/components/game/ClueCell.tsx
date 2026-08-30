'use client';

import React from 'react';
import { ClueResult } from '@/domain/clue/types';
import { ArrowUp, ArrowDown, Check, Minus, HelpCircle } from 'lucide-react';

interface ClueCellProps {
  clue: ClueResult;
  label: string;
  delayIndex?: number;
}

export default function ClueCell({ clue, label, delayIndex = 0 }: ClueCellProps) {
  const getStatusStyles = () => {
    switch (clue.status) {
      case 'EXACT':
        return {
          bg: 'bg-emerald-600/25 border-emerald-500/60 text-emerald-300 shadow-emerald-950/30',
          badge: 'bg-emerald-500 text-slate-950',
          icon: <Check className="w-3.5 h-3.5 stroke-[3]" />,
          textDesc: 'Exact match',
        };
      case 'CLOSE':
        return {
          bg: 'bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-amber-950/30',
          badge: 'bg-amber-400 text-slate-950',
          icon:
            clue.direction === 'UP' ? (
              <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
            ) : clue.direction === 'DOWN' ? (
              <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            ),
          textDesc: `Close match (Target is ${clue.direction === 'UP' ? 'higher' : 'lower'})`,
        };
      case 'PARTIAL':
        return {
          bg: 'bg-orange-600/25 border-orange-500/60 text-orange-300 shadow-orange-950/30',
          badge: 'bg-orange-500 text-slate-950',
          icon: <Minus className="w-3.5 h-3.5 stroke-[3]" />,
          textDesc: 'Partial match / subset',
        };
      case 'NONE':
        return {
          bg: 'bg-slate-800/40 border-slate-700/50 text-slate-400',
          badge: 'bg-slate-700 text-slate-300',
          icon:
            clue.direction === 'UP' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : clue.direction === 'DOWN' ? (
              <ArrowDown className="w-3.5 h-3.5" />
            ) : null,
          textDesc:
            clue.direction === 'UP'
              ? 'No match (Target is higher)'
              : clue.direction === 'DOWN'
              ? 'No match (Target is lower)'
              : 'No match',
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-900/50 border-slate-800 text-slate-500',
          badge: 'bg-slate-800 text-slate-400',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
          textDesc: 'Information unavailable',
        };
    }
  };

  const style = getStatusStyles();
  const animationDelay = `${delayIndex * 60}ms`;

  return (
    <div
      style={{ animationDelay }}
      className={`clue-flip relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all min-w-[90px] sm:min-w-[105px] h-[86px] sm:h-[96px] shadow-sm ${style.bg}`}
      aria-label={`${label}: ${clue.displayValue || 'None'} - ${style.textDesc}`}
      title={`${label}: ${style.textDesc}`}
    >
      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">
        {label}
      </span>

      <span className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 px-1 text-center">
        {clue.displayValue || '—'}
      </span>

      {style.icon && (
        <div
          className={`absolute bottom-1.5 right-1.5 p-0.5 rounded-full flex items-center justify-center ${style.badge}`}
        >
          {style.icon}
        </div>
      )}
    </div>
  );
}
