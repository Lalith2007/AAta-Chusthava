'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Swords, Calendar, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import HowToPlayModal from '../game/HowToPlayModal';

export default function Navbar() {
  const pathname = usePathname();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const navLinks = [
    { href: '/play', label: 'Daily Game', icon: Film },
    { href: '/create', label: 'Challenge Friend', icon: Swords },
    { href: '/archive', label: 'Archive', icon: Calendar },
    { href: '/admin', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#0d121c] rounded-[10px] flex items-center justify-center">
                <Film className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                AAta Chusthava
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How to Play</span>
            </button>
          </nav>

          {/* Mobile Right Action */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 bg-slate-800/40"
              aria-label="How to play"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <Link
              href="/play"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Play</span>
            </Link>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-800/60 bg-[#0a0e17]/90 px-4 py-2 justify-around">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 text-[11px] font-medium ${
                  isActive ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </>
  );
}
