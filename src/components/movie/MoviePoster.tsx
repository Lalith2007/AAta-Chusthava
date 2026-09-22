'use client';

import React, { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { resolvePosterUrl } from '@/lib/poster-utils';

interface MoviePosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500';
}

const GRADIENTS = [
  'from-amber-700 via-yellow-800 to-slate-950',
  'from-purple-700 via-indigo-800 to-slate-950',
  'from-emerald-700 via-teal-800 to-slate-950',
  'from-rose-700 via-red-800 to-slate-950',
  'from-blue-700 via-indigo-900 to-slate-950',
  'from-orange-700 via-amber-800 to-stone-950',
];

export default function MoviePoster({
  src,
  alt,
  className = '',
  fallbackInitials,
  size = 'w500',
}: MoviePosterProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = resolvePosterUrl(src, size);

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

  if (!resolvedSrc || hasError) {
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
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
      />
    </div>
  );
}
