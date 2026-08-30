import React from 'react';
import { Check, ArrowUp, ArrowDown, Minus, HelpCircle } from 'lucide-react';

export default function ClueLegend() {
  const items = [
    {
      label: 'Exact Match',
      desc: 'Attributes match perfectly',
      color: 'bg-emerald-600/30 border-emerald-500 text-emerald-300',
      icon: <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />,
    },
    {
      label: 'Close / Direction',
      desc: 'Within threshold (±3 yrs, ±0.5 rating). Arrow shows target direction',
      color: 'bg-amber-500/30 border-amber-400 text-amber-300',
      icon: <ArrowUp className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />,
    },
    {
      label: 'Partial Match',
      desc: 'Shares some languages, genres or cast members',
      color: 'bg-orange-600/30 border-orange-500 text-orange-300',
      icon: <Minus className="w-3.5 h-3.5 text-orange-400 stroke-[3]" />,
    },
    {
      label: 'No Match',
      desc: 'Attributes do not match',
      color: 'bg-slate-800/60 border-slate-700 text-slate-400',
      icon: <span className="text-xs">✕</span>,
    },
    {
      label: 'Unavailable',
      desc: 'Data not reported or cannot be compared',
      color: 'bg-slate-900/80 border-slate-800 text-slate-500',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" />,
    },
  ];

  return (
    <div className="w-full glass-card p-4 rounded-xl border border-slate-800 my-4 text-xs">
      <div className="font-bold text-slate-300 mb-2 flex items-center space-x-2">
        <span>Clue Color Guide & Meaning</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center space-x-2 p-2 rounded-lg border ${item.color}`}
          >
            <div className="p-1 rounded bg-black/40 flex-shrink-0">{item.icon}</div>
            <div>
              <p className="font-bold text-[11px] leading-tight">{item.label}</p>
              <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
