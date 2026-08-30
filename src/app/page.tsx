import React from 'react';
import Link from 'next/link';
import { Film, Swords, Calendar, HelpCircle, Sparkles, Trophy, Clapperboard, Star } from 'lucide-react';

export default function HomePage() {
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full space-y-10 py-4 animate-fade-in">
      {/* Hero Section */}
      <section className="relative text-center py-12 px-4 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Telugu & Hindi Cinema (2002 — Present)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Can You Guess the{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
            Mystery Indian Movie?
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed">
          Designed exclusively for Indian cinema buffs. Deduce the secret blockbuster using 11 clues: director, cast, release year, box office, rating, and studio!
        </p>

        {/* Hero CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/play"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            <Film className="w-5 h-5" />
            <span>Play Today's Movie ({todayStr})</span>
          </Link>

          <Link
            href="/create"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Swords className="w-5 h-5 text-amber-400" />
            <span>Challenge a Friend</span>
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Daily Puzzle */}
        <Link
          href="/play"
          className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Daily Movie Game
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              A new handpicked Indian blockbuster every 24 hours. Compete with cinephiles worldwide in 10 attempts.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Play Today →</span>
          </div>
        </Link>

        {/* Card 2: Friend Challenge */}
        <Link
          href="/create"
          className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Challenge a Friend
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Choose your favorite Telugu or Hindi movie, create a private challenge, and send a secret link to your friends.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Create Challenge →</span>
          </div>
        </Link>

        {/* Card 3: Archive */}
        <Link
          href="/archive"
          className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Puzzle Archive
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Missed yesterday's film? Explore past daily puzzles and test your cinema knowledge whenever you want.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Browse Archive →</span>
          </div>
        </Link>
      </section>

      {/* 11 Clues Showcase Banner */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 text-center">
        <h2 className="text-lg sm:text-xl font-black text-white mb-2">
          11 Smart Clues for Every Single Guess
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-6">
          Every movie you submit tests its entire normalized filmography profile against the secret movie.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          {[
            'Language',
            'Director',
            'Studio / Banner',
            'Release Year',
            'Box Office',
            'IMDb/TMDB Rating',
            'Lead Actor',
            'Lead Actress',
            'Supporting Cast',
            'Music Director',
            'Genres',
          ].map((clueName, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-200 shadow-sm"
            >
              ✨ {clueName}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
