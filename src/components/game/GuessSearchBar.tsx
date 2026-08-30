'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Film, Loader2, Sparkles } from 'lucide-react';
import { MovieSearchResult } from '@/domain/movie/types';
import MoviePoster from '@/components/movie/MoviePoster';

interface GuessSearchBarProps {
  onSelectMovie: (movie: MovieSearchResult) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchMode?: 'guess' | 'target';
}

export default function GuessSearchBar({
  onSelectMovie,
  isLoading,
  disabled = false,
  placeholder = 'Search by movie title (e.g. RRR, Dangal, Pushpa, 3 Idiots)...',
  searchMode = 'guess',
}: GuessSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query)}&mode=${searchMode}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, searchMode]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (movie: MovieSearchResult) => {
    onSelectMovie(movie);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto my-4 z-30">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-amber-400/80 pointer-events-none flex items-center">
          {isSearching || isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          disabled={disabled || isLoading}
          placeholder={disabled ? 'Game Completed' : placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#101624]/90 border-2 border-slate-700/80 focus:border-amber-500 text-slate-100 placeholder-slate-500 text-sm sm:text-base outline-none shadow-xl shadow-black/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-4 focus:ring-amber-500/20"
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-dropdown rounded-2xl shadow-2xl border border-slate-700/80 max-h-[380px] overflow-y-auto z-50 p-2 divide-y divide-slate-800/60">
          {results.length > 0 ? (
            results.map((movie, idx) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => handleSelect(movie)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left flex items-center space-x-3.5 p-2.5 rounded-xl transition-all duration-150 ${
                  selectedIndex === idx
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-inner'
                    : 'text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Poster Thumbnail */}
                <div className="w-12 h-16 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                  <MoviePoster
                    src={movie.posterAsset}
                    alt={movie.primaryTitle}
                  />
                </div>

                {/* Movie Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm sm:text-base text-slate-100 truncate">
                      {movie.primaryTitle}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      {movie.releaseYear}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {movie.supportedLanguages.join(' • ')} {movie.originalTitle !== movie.primaryTitle ? `• (${movie.originalTitle})` : ''}
                  </p>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Dir: {movie.directorNames.join(', ') || 'Unknown'} • Cast: {movie.leadCastNames.join(', ') || 'Cast'}
                  </p>
                </div>

                <div className="text-amber-400 opacity-80 pl-2">
                  <Sparkles className="w-4 h-4" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching Indian films found in 2002–Present catalog.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
