'use client';

import React, { useState } from 'react';

interface PersonAvatarProps {
  id?: string;
  name: string;
  image?: string | null;
  matched?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  subtitle?: string;
  className?: string;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PersonAvatar({
  name,
  image,
  matched = false,
  size = 'md',
  showName = true,
  subtitle,
  className = '',
}: PersonAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }[size];

  const ringClass = matched
    ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-emerald-950/50'
    : 'ring-1 ring-slate-700/80 border-slate-800';

  const hasImage = Boolean(image) && !imageError;

  return (
    <div
      className={`inline-flex items-center gap-2 max-w-full ${className}`}
      title={`${name}${matched ? ' (Match)' : ''}`}
    >
      <div
        className={`relative flex-shrink-0 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-slate-300 shadow-sm ${sizeClasses} ${ringClass}`}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image!}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <span className="font-extrabold tracking-wider text-slate-400">
            {getInitials(name)}
          </span>
        )}

        {/* Small match indicator pip */}
        {matched && (
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950"
            aria-label="Matched person"
          />
        )}
      </div>

      {showName && (
        <div className="min-w-0 flex-1 leading-tight text-left">
          <p
            className={`text-xs font-bold truncate ${
              matched ? 'text-emerald-300 font-extrabold' : 'text-slate-200'
            }`}
          >
            {name}
          </p>
          {subtitle && (
            <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
