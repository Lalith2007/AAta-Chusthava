'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Copy,
  Layers,
  Shield,
  Film,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  primaryTitle: string;
  originalTitle: string;
  releaseYear: number;
  supportedLanguages: string[];
  posterAsset: string | null;
  tmdbId: number | null;
  imdbId: string | null;
  wikidataId: string | null;
  reviewStatus: string;
  lifecycleStatus: string;
  playableAsGuess: boolean;
  playableAsTarget: boolean;
  reasons: string[];
  missingClues: string[];
  clueScore: { present: number; total: number };
  directors: string[];
  leadActors: string[];
  genres: string[];
  hasPoster: boolean;
  hasTmdbId: boolean;
  updatedAt: string;
}

interface ReviewDetailData {
  movie: any;
  eligibility: any;
  people: any[];
  genres: string[];
  productionHouses: string[];
  clueAnalysis: {
    dimensions: Record<string, { dimension: string; label: string; status: string; value?: any; details?: string }>;
    missingClues: string[];
    reasons: string[];
    isTargetPlayable: boolean;
    isGuessPlayable: boolean;
    score: { present: number; total: number };
  };
  targetReferences: {
    dailyPuzzles: number;
    challenges: number;
    games: number;
    isTarget: boolean;
  };
  suspectedDuplicates: any[];
  candidateProvenance: any;
}

export function ReviewQueueView() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [reason, setReason] = useState('');
  const [year, setYear] = useState('');
  const [posterFilter, setPosterFilter] = useState('');
  const [playableFilter, setPlayableFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Detail Modal
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ReviewDetailData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Load Review Statistics
  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/review-queue/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Failed to load review stats:', err);
    }
  };

  // Load Review Queue Items
  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (language) params.set('language', language);
      if (reason) params.set('reason', reason);
      if (year) params.set('year', year);
      if (posterFilter) params.set('hasPoster', posterFilter);
      if (playableFilter) params.set('playableStatus', playableFilter);
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/review-queue?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.pendingEligibility || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [page, language, reason, year, posterFilter, playableFilter, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQueue();
  };

  // Load Review Detail
  const openDetailModal = async (movieId: string) => {
    setSelectedMovieId(movieId);
    setIsDetailLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/review-queue/movies/${movieId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      } else {
        const err = await res.json();
        setActionError(err.error?.message || 'Failed to load movie details');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error loading details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Execute Curation Action
  const executeAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN_TO_REVIEW' | 'ENRICH', customReason?: string) => {
    if (!selectedMovieId) return;
    setIsExecutingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/review-queue/movies/${selectedMovieId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: customReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Action ${action} failed.`);
      }

      setActionSuccess(`Successfully executed ${action}.`);
      // Reload detail and queue
      await openDetailModal(selectedMovieId);
      loadQueue();
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Execute Merge Duplicate
  const executeMerge = async (duplicateMovieId: string) => {
    if (!selectedMovieId) return;
    if (!confirm(`Are you sure you want to merge duplicate movie ${duplicateMovieId} into ${detailData?.movie.primaryTitle}?`)) return;

    setIsExecutingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/review-queue/movies/${selectedMovieId}/duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateMovieId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to merge duplicate.');
      }

      setActionSuccess(`Successfully merged duplicate movie into ${detailData?.movie.primaryTitle}.`);
      await openDetailModal(selectedMovieId);
      loadQueue();
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Merge failed.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Statistics Summary Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Total Pending</span>
            <span className="text-xl font-bold text-amber-400 mt-1">{stats.totalPending}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Need Curation</span>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Missing Cast</span>
            <span className="text-xl font-bold text-rose-400 mt-1">{stats.byReason?.MISSING_CAST_DATA || 0}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">&lt; 2 cast members</span>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Missing Genres</span>
            <span className="text-xl font-bold text-purple-400 mt-1">{stats.byReason?.MISSING_GENRES || 0}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Zero genres</span>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Missing Posters</span>
            <span className="text-xl font-bold text-orange-400 mt-1">{stats.missingPoster}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">No visual asset</span>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Telugu / Hindi</span>
            <span className="text-xl font-bold text-sky-400 mt-1">{stats.byLanguage?.telugu || 0} / {stats.byLanguage?.hindi || 0}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">By language</span>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Duplicates</span>
            <span className="text-xl font-bold text-emerald-400 mt-1">{stats.potentialDuplicates || 0}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Candidate matches</span>
          </div>
        </div>
      )}

      {/* 2. Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, TMDB ID, or actor..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Search Queue
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="">All Languages</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
          </select>

          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="">All Reasons</option>
            <option value="INSUFFICIENT_CLUE_COVERAGE">Insufficient Clues</option>
            <option value="MISSING_CAST_DATA">Missing Cast Data</option>
            <option value="MISSING_GENRES">Missing Genres</option>
            <option value="MISSING_DIRECTOR">Missing Director</option>
            <option value="MISSING_POSTER">Missing Poster</option>
            <option value="MISSING_EXTERNAL_ID">Missing External ID</option>
          </select>

          <select
            value={posterFilter}
            onChange={(e) => { setPosterFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="">All Posters</option>
            <option value="true">Has Poster</option>
            <option value="false">Missing Poster</option>
          </select>

          <select
            value={playableFilter}
            onChange={(e) => { setPlayableFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="">All Playability</option>
            <option value="TARGET">Target Playable</option>
            <option value="GUESS">Guess Playable</option>
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(e.target.value); setPage(1); }}
            placeholder="Year (e.g. 2026)"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600"
          />

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="year_desc">Year (New-Old)</option>
            <option value="year_asc">Year (Old-New)</option>
          </select>
        </div>
      </div>

      {/* 3. Review Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {items.length} of {total} pending review movies</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs text-slate-400">Loading review queue...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 text-xs text-slate-400">
            No movies found matching current review criteria.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl glass-card border border-slate-800/90 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                {/* Poster or Placeholder */}
                <div className="w-12 h-16 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.posterAsset ? (
                    <img src={item.posterAsset} alt={item.primaryTitle} className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white hover:text-amber-400 cursor-pointer transition" onClick={() => openDetailModal(item.id)}>
                      {item.primaryTitle}
                    </h4>
                    <span className="text-xs text-slate-400">({item.releaseYear})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {item.supportedLanguages.join(', ')}
                    </span>
                    {item.tmdbId && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50">
                        TMDB: {item.tmdbId}
                      </span>
                    )}
                  </div>

                  {/* Clues Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.directors.length > 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-400'}`}>
                      Dir: {item.directors.join(', ') || 'Missing'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.leadActors.length >= 2 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}>
                      Cast: {item.leadActors.length} ({item.leadActors.slice(0, 2).join(', ') || 'None'})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.genres.length > 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-purple-950/60 text-purple-400'}`}>
                      Genres: {item.genres.join(', ') || 'Missing'}
                    </span>
                  </div>

                  {/* Deficit / Reasons */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {item.reasons.map((r, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => openDetailModal(item.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Inspect 11 Clues
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Detailed 11-Clue Diagnostic & Curation Modal */}
      {selectedMovieId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {detailData?.movie?.primaryTitle} ({detailData?.movie?.releaseYear})
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                    Review Status: {detailData?.eligibility?.reviewStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Original Title: {detailData?.movie?.originalTitle} | Slug: {detailData?.movie?.slug}
                </p>
              </div>
              <button
                onClick={() => setSelectedMovieId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Notifications */}
            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {isDetailLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs text-slate-400">Loading comprehensive movie diagnostics...</span>
              </div>
            ) : detailData && (
              <div className="space-y-6">
                {/* Target Immutability Warning Banner */}
                {detailData.targetReferences.isTarget && (
                  <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <Shield className="w-4 h-4" />
                      <span>Protected Game Target (Strict Immutability Enforced)</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Referenced by {detailData.targetReferences.dailyPuzzles} Daily Puzzle(s), {detailData.targetReferences.challenges} Challenge(s), and {detailData.targetReferences.games} Active Game(s). Rejection or destructive duplicate removal is blocked.
                    </p>
                  </div>
                )}

                {/* 11-Clue Dimension Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      11 Clue Dimensions Diagnostic ({detailData.clueAnalysis.score.present}/11 Present)
                    </h4>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${detailData.clueAnalysis.isTargetPlayable ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      Target Playable: {detailData.clueAnalysis.isTargetPlayable ? 'YES (Valid Target)' : 'NO (Missing Clues)'}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Clue Dimension</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Extracted Value</th>
                          <th className="p-2.5">Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {Object.entries(detailData.clueAnalysis.dimensions).map(([key, dim]) => (
                          <tr key={key} className="hover:bg-slate-800/30 transition">
                            <td className="p-2.5 font-medium text-slate-200">{dim.label}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dim.status === 'PRESENT'
                                  ? 'bg-emerald-950/80 text-emerald-400'
                                  : dim.status === 'INCOMPLETE'
                                  ? 'bg-amber-950/80 text-amber-400'
                                  : 'bg-rose-950/80 text-rose-400'
                              }`}>
                                {dim.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-300">{dim.value ?? <span className="text-slate-600 italic">None</span>}</td>
                            <td className="p-2.5 text-[11px] text-slate-400">
                              {key === 'DIRECTOR' && 'At least 1 director'}
                              {key === 'LEAD_ACTOR' && 'At least 1 lead / cast member'}
                              {key === 'LEAD_ACTRESS' && 'At least 2 cast members total'}
                              {key === 'GENRES' && 'At least 1 genre'}
                              {key === 'RELEASE_YEAR' && 'Year >= 2002'}
                              {key === 'BOX_OFFICE' && 'Numeric or UNAVAILABLE (never 0)'}
                              {key === 'RATING' && 'Numeric or UNAVAILABLE'}
                              {key === 'LANGUAGE' && 'Telugu or Hindi'}
                              {key === 'PRODUCTION_HOUSE' && 'Optional studio'}
                              {key === 'SUPPORTING_CAST' && 'Optional cast'}
                              {key === 'MUSIC_DIRECTOR' && 'Optional composer'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Suspected Duplicates Side-by-Side Comparison */}
                {detailData.suspectedDuplicates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Suspected Duplicates ({detailData.suspectedDuplicates.length} Found)
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {detailData.suspectedDuplicates.map((dup, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{dup.canonicalMovie.primaryTitle} ({dup.canonicalMovie.releaseYear})</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400">Match: {dup.matchType}</span>
                              <span className="text-[10px] text-slate-500">ID: {dup.canonicalMovie.id}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Directors: {dup.canonicalMovie.directors?.join(', ') || 'None'} | Cast: {dup.canonicalMovie.leadActors?.join(', ') || 'None'}
                            </p>
                          </div>
                          <button
                            disabled={isExecutingAction}
                            onClick={() => executeMerge(dup.canonicalMovie.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                          >
                            Merge into this Movie
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isExecutingAction}
                      onClick={() => executeAction('ENRICH')}
                      className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/50 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Enrich TMDB / Wiki
                    </button>
                    <button
                      disabled={isExecutingAction}
                      onClick={() => executeAction('RETURN_TO_REVIEW')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Return to Review
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isExecutingAction || detailData.targetReferences.isTarget}
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) executeAction('REJECT', reason);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/50 text-xs font-semibold transition disabled:opacity-40"
                    >
                      Reject Movie
                    </button>
                    <button
                      disabled={isExecutingAction}
                      onClick={() => executeAction('APPROVE')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve for Play
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
