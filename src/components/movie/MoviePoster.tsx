'use client';

import React, { useState } from 'react';
import { Film, Clapperboard } from 'lucide-react';

interface MoviePosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const GRADIENTS = [
  'from-amber-600 via-yellow-700 to-amber-900',
  'from-purple-600 via-indigo-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-slate-900',
  'from-rose-600 via-red-700 to-slate-900',
  'from-blue-600 via-indigo-800 to-slate-900',
  'from-orange-600 via-amber-700 to-stone-900',
];

export default function MoviePoster({
  src,
  alt,
  className = '',
  fallbackInitials,
  size = 'md',
}: MoviePosterProps) {
  const [hasError, setHasError] = useState(false);

  // Generate a consistent gradient based on title hash
  const hash = (alt || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = GRADIENTS[hash % GRADIENTS.length];

  // Extract up to 3 uppercase initials from the title
  const initials =
    fallbackInitials ||
    (alt || '')
      .split(/[\s:,-]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase())
      .join('') ||
    '🎬';

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full rounded-lg bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-1.5 text-center select-none shadow-inner border border-white/10 ${className}`}
        title={alt}
      >
        <Clapperboard className="w-4 h-4 text-white/70 mb-1" />
        <span className="font-black text-xs sm:text-sm tracking-wider text-white drop-shadow-md line-clamp-1 uppercase">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg bg-slate-900 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
      />
    </div>
  );
}
