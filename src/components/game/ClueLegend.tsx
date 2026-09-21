import React from 'react';
import { Check, ArrowUp, Layers, X, HelpCircle } from 'lucide-react';

export default function ClueLegend() {
  const items = [
    {
      label: 'EXACT',
      desc: 'Attributes match target perfectly',
      color: 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300',
      badge: 'bg-emerald-500 text-slate-950',
      icon: <Check className="w-3 h-3 stroke-[3]" />,
    },
    {
      label: 'CLOSE',
      desc: 'Within threshold (±3 yrs, ±0.5★). Arrow shows target direction (↑ Higher / ↓ Lower)',
      color: 'bg-amber-950/70 border-amber-400/80 text-amber-300',
      badge: 'bg-amber-400 text-slate-950',
      icon: <ArrowUp className="w-3 h-3 stroke-[3]" />,
    },
    {
      label: 'PARTIAL',
      desc: 'Shares some languages, genres, or cast members',
      color: 'bg-purple-950/70 border-purple-500/80 text-purple-300',
      badge: 'bg-purple-500 text-white',
      icon: <Layers className="w-3 h-3 stroke-[2.5]" />,
    },
    {
      label: 'NONE',
      desc: 'No attributes match target',
      color: 'bg-slate-900/80 border-slate-800 text-slate-400',
      badge: 'bg-slate-800 text-slate-400 border border-slate-700',
      icon: <X className="w-3 h-3" />,
    },
    {
      label: 'UNAVAILABLE',
      desc: 'Data not reported in catalog',
      color: 'bg-slate-950/60 border-slate-800/80 text-slate-500',
      badge: 'bg-slate-900 text-slate-500 border border-slate-800',
      icon: <HelpCircle className="w-3 h-3" />,
    },
  ];

  return (
    <div className="w-full glass-card p-4 rounded-2xl border border-slate-800/80 my-4 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
        <span className="font-extrabold text-slate-200 tracking-wide">
          Clue Status Legend
        </span>
        <span className="text-[11px] text-slate-400">
          Green = exact, Amber = close direction, Purple = category/cast overlap.
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center space-x-2 p-2 rounded-xl border ${item.color}`}
          >
            <div className={`p-1 rounded-full flex items-center justify-center flex-shrink-0 ${item.badge}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="font-black text-[11px] leading-tight tracking-wide">{item.label}</p>
              <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight mt-0.5">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
