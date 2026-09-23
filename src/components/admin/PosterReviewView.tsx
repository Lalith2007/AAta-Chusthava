'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Check, X, Search, ChevronLeft, ChevronRight, RefreshCw, ExternalLink } from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';

interface PosterReviewItem {
  id: string;
  title: string;
  releaseYear: number;
  tmdbId: number | null;
  imdbId: string | null;
  languages: string[];
  currentPosterAsset: string | null;
  candidatePosterUrl: string | null;
  candidateSource: string | null;
  googleSearchUrl: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED_CONFLICT';
  directors: string[];
  leadCast: string[];
}

export default function PosterReviewView() {
  const [items, setItems] = useState<PosterReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetOnly, setTargetOnly] = useState(false);
  const [manualUrls, setManualUrls] = useState<Record<string, string>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
        ...(search ? { search } : {}),
        ...(targetOnly ? { targetOnly: 'true' } : {}),
      });
      const res = await fetch(`/api/admin/media/poster-review?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load poster review queue:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, targetOnly]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleApprove = async (movieId: string, posterUrl: string) => {
    setActionInProgress(movieId);
    try {
      const res = await fetch('/api/admin/media/poster-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', movieId, posterUrl }),
      });
      if (res.ok) {
        setFeedback('Poster approved and updated successfully.');
        setTimeout(() => setFeedback(null), 3000);
        fetchQueue();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (movieId: string) => {
    setActionInProgress(movieId);
    try {
      const res = await fetch('/api/admin/media/poster-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', movieId }),
      });
      if (res.ok) {
        setFeedback('Candidate rejected.');
        setTimeout(() => setFeedback(null), 3000);
        fetchQueue();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSubmitManual = async (movieId: string) => {
    const url = manualUrls[movieId]?.trim();
    if (!url) return;

    setActionInProgress(movieId);
    try {
      const res = await fetch('/api/admin/media/poster-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submitManual', movieId, posterUrl: url }),
      });
      if (res.ok) {
        setFeedback('Manual poster URL assigned successfully.');
        setTimeout(() => setFeedback(null), 3000);
        setManualUrls((prev) => {
          const next = { ...prev };
          delete next[movieId];
          return next;
        });
        fetchQueue();
      }
    } catch (err) {
      console.error('Manual submit failed:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <span>Poster Verification Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {total} Awaiting Review
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Manual review queue for active movies without verified poster assets. Strict identity verification required.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target-Only Filter Toggle */}
          <button
            onClick={() => {
              setTargetOnly(!targetOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
              targetOnly
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {targetOnly ? '★ Target-Playable Only' : 'All Movies'}
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search movie title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => fetchQueue()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-bold animate-fade-in">
          {feedback}
        </div>
      )}

      {/* Review Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading poster review queue...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
          No movies currently in the poster review queue.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isProcessing = actionInProgress === item.id;
            const currentManualUrl = manualUrls[item.id]?.trim();

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Movie Info */}
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="w-12 h-16 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 shadow-md">
                    <MoviePoster src={item.currentPosterAsset} alt={item.title} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <span className="text-xs px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                        {item.releaseYear}
                      </span>
                      {item.confidence && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.confidence === 'HIGH'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.confidence === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.confidence}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span>Languages: {item.languages.join(', ') || 'None'}</span>
                      {item.tmdbId && (
                        <span className="px-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          TMDB: {item.tmdbId}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="font-semibold text-slate-300">Dir:</span>{' '}
                      {item.directors.join(', ') || 'Unknown'} |{' '}
                      <span className="font-semibold text-slate-300">Cast:</span>{' '}
                      {item.leadCast.slice(0, 3).join(', ') || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {/* Google Search Direct Link */}
                  {item.googleSearchUrl && (
                    <a
                      href={item.googleSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 transition-colors flex items-center space-x-1"
                      title="Search Google for poster"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Search Google</span>
                    </a>
                  )}

                  {/* Enter Manual URL */}
                  <div className="flex items-center space-x-1.5">
                    {currentManualUrl && (
                      <div className="w-6 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentManualUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={manualUrls[item.id] || ''}
                      onChange={(e) =>
                        setManualUrls((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44"
                    />
                    <button
                      onClick={() => handleSubmitManual(item.id)}
                      disabled={isProcessing || !manualUrls[item.id]}
                      className="px-3 py-1.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black transition-all flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Set</span>
                    </button>
                  </div>

                  {/* Reject / Skip */}
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={isProcessing}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors flex items-center space-x-1"
                    title="Reject Candidate"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  {item.tmdbId && (
                    <a
                      href={`https://www.themoviedb.org/movie/${item.tmdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Open TMDB Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages} ({total} movies)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
