import React from 'react';
import Link from 'next/link';
import { Film, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/60 bg-[#06080e] py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-400">
          <Film className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-300">AAta Chusthava</span>
          <span>— Indian Cinema Deduction Game</span>
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>for Telugu & Hindi movie buffs</span>
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <Link href="/play" className="hover:text-amber-400 transition-colors">
            Daily
          </Link>
          <Link href="/create" className="hover:text-amber-400 transition-colors">
            Challenge
          </Link>
          <Link href="/archive" className="hover:text-amber-400 transition-colors">
            Archive
          </Link>
          <Link href="/admin" className="hover:text-amber-400 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
