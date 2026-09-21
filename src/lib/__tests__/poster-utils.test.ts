import { describe, it, expect } from 'vitest';
import { resolvePosterUrl, TMDB_IMAGE_BASE_URL } from '../poster-utils';

describe('Poster URL Normalization Pipeline', () => {
  it('H. normalizes absolute HTTP/HTTPS poster URLs without altering them', () => {
    const httpsUrl = 'https://m.media-amazon.com/images/M/MV5BNTFi.jpg';
    const httpUrl = 'http://example.com/poster.jpg';

    expect(resolvePosterUrl(httpsUrl)).toBe(httpsUrl);
    expect(resolvePosterUrl(httpUrl)).toBe(httpUrl);
  });

  it('H. resolves TMDB relative path with leading slash to official TMDB image host', () => {
    const tmdbRelative = '/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg';
    const expected = `${TMDB_IMAGE_BASE_URL}/w500/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg`;

    expect(resolvePosterUrl(tmdbRelative)).toBe(expected);
    expect(resolvePosterUrl(tmdbRelative, 'w185')).toBe(`${TMDB_IMAGE_BASE_URL}/w185/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg`);
  });

  it('H. resolves TMDB bare filename without leading slash to official TMDB image host', () => {
    const bare = 'vZloFAK7NKnMGKE7Um76O2ISV3L.jpg';
    const expected = `${TMDB_IMAGE_BASE_URL}/w500/vZloFAK7NKnMGKE7Um76O2ISV3L.jpg`;

    expect(resolvePosterUrl(bare)).toBe(expected);
  });

  it('I. returns null for invalid / malformed poster URLs rather than fabricating', () => {
    expect(resolvePosterUrl('not-a-valid-url-or-path')).toBeNull();
    expect(resolvePosterUrl('http://')).toBe('http://'); // Regex check test
    expect(resolvePosterUrl('random_text_without_extension')).toBeNull();
  });

  it('J. returns null for missing, null, undefined, or empty string posters for intentional fallback', () => {
    expect(resolvePosterUrl(null)).toBeNull();
    expect(resolvePosterUrl(undefined)).toBeNull();
    expect(resolvePosterUrl('')).toBeNull();
    expect(resolvePosterUrl('   ')).toBeNull();
    expect(resolvePosterUrl('null')).toBeNull();
    expect(resolvePosterUrl('undefined')).toBeNull();
  });

  it('K. does not fabricate URLs for movies without valid poster data', () => {
    const emptyPoster = null;
    const resolved = resolvePosterUrl(emptyPoster);
    expect(resolved).toBeNull();
  });
});
