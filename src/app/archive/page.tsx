'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Film, ArrowRight, Loader2, Sparkles, Trophy } from 'lucide-react';

export default function ArchivePage() {
  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArchive() {
      try {
        const res = await fetch('/api/archive?limit=60');
        if (res.ok) {
          const data = await res.json();
          setArchives(data.archives || []);
        }
      } catch (err) {
        console.error('Failed to load archive:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArchive();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
          <Calendar className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          Historical Daily Archive
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Missed a daily movie puzzle? Play any past daily game with the exact same 11 clue evaluation rules!
        </p>
      </div>

      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs text-slate-400">Loading historical puzzles...</p>
        </div>
      ) : archives.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-slate-800">
          <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No past daily archives available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {archives.map((item) => (
            <Link
              key={item.id}
              href={`/archive/${item.puzzleDate}`}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {item.puzzleDate}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.totalPlays} plays
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Daily Movie Puzzle
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  10 Attempts • 11 Clues
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Play Puzzle</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
