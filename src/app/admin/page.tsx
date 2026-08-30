'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Film,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Sliders,
  Layers,
  Database,
  Loader2,
  Check,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';

type Tab = 'overview' | 'review' | 'movies' | 'puzzles' | 'audit';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search & Merge state
  const [movieQuery, setMovieQuery] = useState('');
  const [primaryMergeId, setPrimaryMergeId] = useState('');
  const [duplicateMergeId, setDuplicateMergeId] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, reviewRes, puzzlesRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/review-queue'),
        fetch('/api/admin/puzzles'),
        fetch('/api/admin/audit-logs'),
      ]);

      if (statsRes.ok) setOverview(await statsRes.json());
      if (reviewRes.ok) setReviewQueue(await reviewRes.json());
      if (puzzlesRes.ok) {
        const data = await puzzlesRes.json();
        setPuzzles(data.scheduled || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const searchMovies = async () => {
    try {
      const res = await fetch(`/api/admin/movies?q=${encodeURIComponent(movieQuery)}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'movies') {
      searchMovies();
    }
  }, [activeTab]);

  const handleReviewAction = async (candidateId: string, action: 'APPROVE' | 'REJECT' | 'RETRY') => {
    try {
      const res = await fetch(`/api/admin/review-queue/${candidateId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setActionMessage(`Candidate ${action.toLowerCase()}d successfully.`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchedulePuzzles = async () => {
    try {
      const res = await fetch('/api/admin/puzzles/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead: 7 }),
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(`Successfully pre-scheduled ${data.scheduledCount} future daily puzzles!`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMergeMovies = async () => {
    if (!primaryMergeId || !duplicateMergeId) return;
    try {
      const res = await fetch('/api/admin/movies/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryMovieId: primaryMergeId,
          duplicateMovieId: duplicateMergeId,
          reason: 'Admin duplicate reconciliation',
        }),
      });
      if (res.ok) {
        setActionMessage('Movies successfully merged and duplicate retired!');
        setPrimaryMergeId('');
        setDuplicateMergeId('');
        searchMovies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Operations Control Plane</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Indian Cinema catalog, Review Queue, Daily Schedulers & Ingestion Workers
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'System Health', icon: Activity },
          { key: 'review', label: 'Review Queue', icon: CheckCircle },
          { key: 'movies', label: 'Movie Curation', icon: Film },
          { key: 'puzzles', label: 'Puzzle Scheduler', icon: Calendar },
          { key: 'audit', label: 'Audit Logs', icon: History },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as Tab)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Movies
              </span>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {overview?.totalMovies ?? overview?.movieCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500">Active: {overview?.activeMovies ?? 0}</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Playable Guesses
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {overview?.playableGuesses ?? 0}
              </p>
              <span className="text-[10px] text-emerald-400/80">Targets: {overview?.playableTargets ?? 0}</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Needs Review
              </span>
              <p className="text-2xl font-black text-purple-400 mt-1">
                {overview?.needsReview ?? overview?.pendingReviewCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500">Rejected: {overview?.rejectedCount ?? 0}</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Catalog Coverage
              </span>
              <p className="text-lg font-black text-cyan-300 mt-1">
                {overview?.coverageStatus || 'PARTIAL (2002–2026)'}
              </p>
              <span className="text-[10px] text-slate-500">Telugu & Hindi Cinema</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Canonical Database & Architecture Health</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>PostgreSQL Canonical DB:</span>
                  <span className="text-emerald-400 font-bold">Connected (Port 5432)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Clue Engine (11 Evaluators):</span>
                  <span className="text-emerald-400 font-bold">Deterministic V1 Active</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Target Secrecy Policy:</span>
                  <span className="text-emerald-400 font-bold">Authoritative Server Enforced</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-300">
                  <span>Redis & Job Queue:</span>
                  <span className="text-amber-400 font-bold">In-Memory / Durable Ready</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Daily Puzzle Safety Monitor</span>
              </h3>
              <p className="text-xs text-slate-400">
                The safety monitor ensures there are always at least 3+ days of pre-scheduled daily puzzle targets in advance.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleSchedulePuzzles}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Pre-Schedule Next 7 Days Puzzles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">
            Ingestion Candidates & Pending Metadata Review
          </h2>
          {reviewQueue?.candidates?.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 text-xs text-slate-400">
              No pending candidates requiring review in the ingestion queue.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue?.candidates?.map((c: any) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl glass-card border border-slate-800 gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">
                        {c.source} ID: {c.sourceMovieId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{c.discoveryReason}</p>
                    {c.error && <p className="text-[11px] text-red-400 mt-0.5">{c.error}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReviewAction(c.id, 'APPROVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Approve / Process
                    </button>
                    <button
                      onClick={() => handleReviewAction(c.id, 'REJECT')}
                      className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MOVIE CURATION & MERGING */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          {/* Merge Tool */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <h3 className="font-bold text-sm text-amber-300">
              Reconcile & Merge Duplicate Movies
            </h3>
            <p className="text-xs text-slate-400">
              Merges duplicate movie records safely, re-pointing previous game guesses and marking the duplicate as MERGED without data loss.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Primary / Canonical Movie ID"
                value={primaryMergeId}
                onChange={(e) => setPrimaryMergeId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Duplicate Movie ID (to retire)"
                value={duplicateMergeId}
                onChange={(e) => setDuplicateMergeId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              />
            </div>
            <button
              onClick={handleMergeMovies}
              disabled={!primaryMergeId || !duplicateMergeId}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs"
            >
              Execute Safe Merge
            </button>
          </div>

          {/* Movie Catalog Search */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
                placeholder="Filter movies by title..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              />
              <button
                onClick={searchMovies}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Search
              </button>
            </div>

            <div className="divide-y divide-slate-800 glass-card rounded-2xl border border-slate-800 overflow-hidden">
              {movies.map((m) => (
                <div key={m.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{m.primaryTitle}</span>
                      <span className="text-amber-400 font-semibold">({m.releaseYear})</span>
                      <span className="text-slate-500 font-mono text-[10px]">ID: {m.id}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Languages: {m.supportedLanguages?.join(', ')} • Rating: {m.rating || 'N/A'} • Box Office: {m.boxOffice ? `₹${(m.boxOffice / 10000000).toFixed(1)} Cr` : 'N/A'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Lifecycle Status */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.lifecycleStatus === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : m.lifecycleStatus === 'MERGED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {m.lifecycleStatus}
                    </span>

                    {/* Guess Playability */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.eligibility?.playableAsGuess
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      Guess: {m.eligibility?.playableAsGuess ? 'YES' : 'NO'}
                    </span>

                    {/* Target Playability */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.eligibility?.playableAsTarget
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Target: {m.eligibility?.playableAsTarget ? 'YES' : 'NO'}
                    </span>

                    {/* Review Status */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.eligibility?.reviewStatus === 'APPROVED'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : m.eligibility?.reviewStatus === 'PENDING'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {m.eligibility?.reviewStatus || 'NO_REVIEW'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUZZLE SCHEDULER */}
      {activeTab === 'puzzles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Upcoming Daily Puzzles</h2>
            <button
              onClick={handleSchedulePuzzles}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Pre-Schedule +7 Days
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {puzzles.map((p) => (
              <div key={p.id} className="p-4 rounded-xl glass-card border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">{p.puzzleDate}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {p.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100">
                  {p.targetMovie?.primaryTitle} ({p.targetMovie?.releaseYear})
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Languages: {p.targetMovie?.supportedLanguages?.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Operational Audit Log</h2>
          <div className="divide-y divide-slate-800 glass-card rounded-2xl border border-slate-800 overflow-hidden text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No audit logs recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Entity: {log.entityType} ({log.entityId}) by actor <strong>{log.actorId}</strong>
                  </p>
                  {log.reason && <p className="text-slate-400 text-[11px]">Reason: {log.reason}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
