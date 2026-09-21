/**
 * Poster URL Resolver & Normalization Utility
 *
 * Handles:
 * 1. Absolute URLs (https://...)
 * 2. TMDB relative paths (e.g. "/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg")
 * 3. TMDB bare filenames (e.g. "vZloFAK7NKnMGKE7Um76O2ISV3L.jpg")
 * 4. Null / empty / malformed URLs
 */

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function resolvePosterUrl(
  rawUrl?: string | null,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  // Case 1: Already an absolute HTTP / HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Case 2: TMDB relative path with leading slash (e.g. "/abc123xyz.jpg")
  if (trimmed.startsWith('/') && /\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
    return `${TMDB_IMAGE_BASE_URL}/${size}${trimmed}`;
  }

  // Case 3: TMDB bare filename without leading slash (e.g. "abc123xyz.jpg")
  if (/^[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
    return `${TMDB_IMAGE_BASE_URL}/${size}/${trimmed}`;
  }

  return null;
}
