'use client';

import React from 'react';
import { ClueResult } from '@/domain/clue/types';
import { ArrowUp, ArrowDown, Check, X, Layers, HelpCircle } from 'lucide-react';

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
          bg: 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 shadow-emerald-950/40',
          badge: 'bg-emerald-500 text-slate-950',
          statusText: 'EXACT',
          statusTag: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          icon: <Check className="w-3 h-3 stroke-[3]" />,
          textDesc: 'Exact match',
        };
      case 'CLOSE':
        return {
          bg: 'bg-amber-950/70 border-amber-400/80 text-amber-200 shadow-amber-950/40',
          badge: 'bg-amber-400 text-slate-950',
          statusText: clue.direction === 'UP' ? 'CLOSE ↑' : clue.direction === 'DOWN' ? 'CLOSE ↓' : 'CLOSE',
          statusTag: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
          icon:
            clue.direction === 'UP' ? (
              <ArrowUp className="w-3 h-3 stroke-[3]" />
            ) : clue.direction === 'DOWN' ? (
              <ArrowDown className="w-3 h-3 stroke-[3]" />
            ) : null,
          textDesc: `Close match (Target is ${clue.direction === 'UP' ? 'higher / later' : 'lower / earlier'})`,
        };
      case 'PARTIAL': {
        const sharedCount = clue.matchedValues?.length || (clue.metadata?.matchedCount as number) || 0;
        const countDesc = sharedCount > 0 ? `${sharedCount} shared` : 'Partial match';
        return {
          bg: 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-purple-950/40',
          badge: 'bg-purple-500 text-white',
          statusText: sharedCount > 0 ? `${sharedCount} SHARED` : 'PARTIAL',
          statusTag: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          icon: <Layers className="w-3 h-3 stroke-[2.5]" />,
          textDesc: `Partial match (${countDesc})`,
        };
      }
      case 'NONE':
        return {
          bg: 'bg-slate-900/80 border-slate-800 text-slate-400 shadow-slate-950/20',
          badge: 'bg-slate-800 text-slate-400 border border-slate-700',
          statusText: clue.direction === 'UP' ? 'NONE ↑' : clue.direction === 'DOWN' ? 'NONE ↓' : 'NONE',
          statusTag: 'bg-slate-800/40 text-slate-400 border border-slate-700/60',
          icon:
            clue.direction === 'UP' ? (
              <ArrowUp className="w-3 h-3" />
            ) : clue.direction === 'DOWN' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            ),
          textDesc:
            clue.direction === 'UP'
              ? 'No match (Target is higher / later)'
              : clue.direction === 'DOWN'
              ? 'No match (Target is lower / earlier)'
              : 'No match',
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-950/60 border-slate-800/80 text-slate-500',
          badge: 'bg-slate-900 text-slate-500 border border-slate-800',
          statusText: 'N/A',
          statusTag: 'bg-slate-900 text-slate-500 border border-slate-800',
          icon: <HelpCircle className="w-3 h-3" />,
          textDesc: 'Information unavailable',
        };
    }
  };

  const style = getStatusStyles();
  const animationDelay = `${delayIndex * 50}ms`;

  return (
    <div
      style={{ animationDelay }}
      className={`clue-flip relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all min-w-[104px] sm:min-w-[116px] w-[104px] sm:w-[116px] h-[86px] sm:h-[92px] shadow-md select-none ${style.bg}`}
      aria-label={`${label}: ${clue.displayValue || 'None'}. Status: ${style.textDesc}`}
      title={`${label}: ${clue.displayValue || 'None'} — ${style.textDesc}`}
    >
      {/* Top Clue Label */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate w-full">
        {label}
      </span>

      {/* Center Value */}
      <span className="text-[11px] sm:text-xs font-extrabold leading-tight text-slate-100 line-clamp-2 px-0.5 text-center my-auto">
        {clue.displayValue || '—'}
      </span>

      {/* Bottom Status Tag with Icon */}
      <div className="w-full flex items-center justify-between mt-auto pt-0.5">
        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${style.statusTag}`}>
          {style.statusText}
        </span>
        {style.icon && (
          <div className={`p-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${style.badge}`}>
            {style.icon}
          </div>
        )}
      </div>
    </div>
  );
}
