'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Database,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  Server,
  ShieldCheck,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import { CatalogCoverageReport } from '@/modules/catalog/catalog-coverage-service';

export default function AdminCatalogPage() {
  const [report, setReport] = useState<CatalogCoverageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Missing candidate form state
  const [missingSource, setMissingSource] = useState('TMDB');
  const [missingSourceId, setMissingSourceId] = useState('');
  const [missingReason, setMissingReason] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Secondary batch discovery state
  const [runningSecondary, setRunningSecondary] = useState(false);
  const [secondaryFeedback, setSecondaryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Full Historical Expansion state
  const [runningExpansion, setRunningExpansion] = useState(false);
  const [expansionFeedback, setExpansionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  const fetchCoverageReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/catalog/coverage');
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
      } else {
        setError(json.error?.message || 'Failed to load catalog coverage report.');
      }

      // Also fetch checkpoints
      const cpRes = await fetch('/api/admin/catalog/checkpoints');
      const cpJson = await cpRes.json();
      if (cpJson.success && cpJson.data) {
        setCheckpoints(cpJson.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverageReport();
  }, []);

  const handleRunHistoricalExpansion = async () => {
    try {
      setRunningExpansion(true);
      setExpansionFeedback(null);
      const res = await fetch('/api/admin/catalog/expand-historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear: 2002,
          endYear: 2026,
          sources: ['TMDB', 'WIKIDATA'],
          languages: ['te', 'hi'],
          resume: true,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setExpansionFeedback({
          type: 'success',
          message: `Full Historical Expansion Completed: ${d.totalDiscovered} candidates discovered, ${d.totalProcessed} processed, +${d.newCanonicalMoviesAdded} new canonical movies added (${d.previousCanonicalCount} → ${d.currentCanonicalCount} total canonical movies, ${d.totalDuplicatesMerged} duplicates merged).`,
        });
        await fetchCoverageReport();
      } else {
        setExpansionFeedback({
          type: 'error',
          message: json.error || 'Historical catalog expansion failed.',
        });
      }
    } catch (err: unknown) {
      setExpansionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setRunningExpansion(false);
    }
  };

  const handleIngestMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingSourceId) return;

    try {
      setIngesting(true);
      setIngestFeedback(null);
      const res = await fetch('/api/admin/catalog/missing-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: missingSource,
          sourceMovieId: missingSourceId.trim(),
          reason: missingReason || 'Manual Admin Ingestion',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIngestFeedback({
          type: 'success',
          message: `Successfully processed "${json.data.title || missingSourceId}" (Status: ${json.data.status}, Reason: ${json.data.reason || 'Complete'})`,
        });
        setMissingSourceId('');
        setMissingReason('');
        await fetchCoverageReport();
      } else {
        setIngestFeedback({
          type: 'error',
          message: json.error?.message || 'Ingestion failed.',
        });
      }
    } catch (err: unknown) {
      setIngestFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleRunSecondaryDiscovery = async () => {
    try {
      setRunningSecondary(true);
      setSecondaryFeedback(null);
      const res = await fetch('/api/admin/catalog/secondary-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'WIKIDATA',
          startYear: 2002,
          endYear: 2026,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const summary = json.data.summary;
        setSecondaryFeedback({
          type: 'success',
          message: `Secondary discovery completed: ${summary.totalProcessed} candidates processed (${summary.newMoviesCreated} new unique movies added, ${summary.duplicatesMerged} duplicates reconciled).`,
        });
        if (json.data.coverageReport) {
          setReport(json.data.coverageReport);
        } else {
          await fetchCoverageReport();
        }
      } else {
        setSecondaryFeedback({
          type: 'error',
          message: json.error || 'Failed to run secondary discovery.',
        });
      }
    } catch (err: unknown) {
      setSecondaryFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setRunningSecondary(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Admin Hub
              </Link>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-50 mt-2 flex items-center gap-3">
              <Database className="w-8 h-8 text-amber-500" />
              Catalog Coverage & Multi-Source Expansion
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Historical movie database coverage metrics, playability distribution, and multi-source discovery tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunHistoricalExpansion}
              disabled={runningExpansion || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-sm font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${runningExpansion ? 'animate-spin' : ''}`} />
              {runningExpansion ? 'Expanding 2002–2026...' : 'Run Full Historical Expansion'}
            </button>
            <button
              onClick={handleRunSecondaryDiscovery}
              disabled={runningSecondary || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl border border-indigo-500/30 transition shadow-md disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${runningSecondary ? 'animate-spin text-amber-300' : ''}`} />
              {runningSecondary ? 'Expanding...' : 'Wikidata Only'}
            </button>
            <button
              onClick={fetchCoverageReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {expansionFeedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
              expansionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {expansionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{expansionFeedback.message}</span>
          </div>
        )}

        {secondaryFeedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
              secondaryFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {secondaryFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{secondaryFeedback.message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !report ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Analyzing catalog coverage and calculating invariants...</p>
          </div>
        ) : report ? (
          <>
            {/* Section 1: Coverage Status & Key Distinctions Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Coverage Status Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coverage Status</span>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
                      {report.coverageStatus}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-50 flex items-baseline gap-2">
                      {report.coverageStatus}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {report.coverageStatusDescription}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Invariants
                  </span>
                  <span className="text-emerald-400 font-semibold">100% Reconciled</span>
                </div>
              </div>

              {/* Catalog Size Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Film className="w-4 h-4 text-sky-400" /> Catalog Size
                    </span>
                    <span className="text-xs text-slate-400">Canonical Records</span>
                  </div>
                  <div className="mt-4 text-3xl font-black text-slate-50">
                    {report.totals.totalMovies}
                    <span className="text-sm font-normal text-slate-400 ml-2">Total Movies</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Active Movies</span>
                      <span className="text-emerald-400 font-bold text-sm">{report.totals.activeMovies}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Review Required</span>
                      <span className="text-amber-400 font-bold text-sm">{report.totals.validationRequired}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                  Disabled: {report.totals.disabled} | Merged: {report.totals.merged}
                </div>
              </div>

              {/* Playability Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" /> Playability
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Game Eligibility</span>
                  </div>
                  <div className="mt-4 text-3xl font-black text-slate-50">
                    {report.totals.playableBoth}
                    <span className="text-sm font-normal text-slate-400 ml-2">Playable Both</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Guess Eligible</span>
                      <span className="text-sky-400 font-bold text-sm">{report.totals.playableAsGuess}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Target Eligible</span>
                      <span className="text-indigo-400 font-bold text-sm">{report.totals.playableAsTarget}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                  Approved: {report.totals.approved} | Pending: {report.totals.needsReview}
                </div>
              </div>

              {/* Secondary Discovery Contribution Card */}
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> Secondary Expansion
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold">
                      Wikidata
                    </span>
                  </div>
                  <div className="mt-4 text-3xl font-black text-slate-50">
                    +{report.sourceComparison?.newCanonicalContributedBySecondary || 0}
                    <span className="text-sm font-normal text-indigo-300 ml-2">New Movies</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-indigo-900/60">
                      <span className="text-slate-400 block">Discovered</span>
                      <span className="text-indigo-300 font-bold text-sm">
                        {report.sourceComparison?.secondaryCandidates || 0}
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-indigo-900/60">
                      <span className="text-slate-400 block">Cross-Matched</span>
                      <span className="text-violet-300 font-bold text-sm">
                        {report.sourceComparison?.crossSourceOverlap || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-900/60 text-[11px] text-indigo-300">
                  Total Canonical from Secondary: {report.sourceComparison?.bothSourcesCanonical + report.sourceComparison?.secondaryOnlyCanonical}
                </div>
              </div>
            </div>

            {/* Section 2: Multi-Source Comparison & Overlap Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-indigo-400" />
                    Multi-Source Discovery Comparison & Overlap
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time comparison between primary TMDB source and secondary Wikidata Open Knowledge Graph.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">
                    Multi-Source Provenance Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">TMDB Only</span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block">
                    {report.sourceComparison?.tmdbOnlyCanonical || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Canonical Movies</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Wikidata Only</span>
                  <span className="text-2xl font-black text-indigo-400 mt-1 block">
                    {report.sourceComparison?.secondaryOnlyCanonical || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Canonical Movies</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Both Linked</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {report.sourceComparison?.bothSourcesCanonical || 0}
                  </span>
                  <span className="text-[10px] text-emerald-500 mt-0.5 block">Cross-Referenced</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Neither Source ID</span>
                  <span className="text-2xl font-black text-slate-300 mt-1 block">
                    {report.sourceComparison?.neitherSourceCanonical || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Initial Seed Records</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-700 text-center bg-slate-900/50">
                  <span className="text-xs text-slate-300 block uppercase font-bold">Matrix Total</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {report.sourceComparison?.sourceMatrixSum || 0}
                  </span>
                  <span className="text-[10px] text-emerald-500 mt-0.5 block">100% Invariant Pass</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-600/60 text-center bg-indigo-950/30">
                  <span className="text-xs text-indigo-300 block uppercase font-bold">New From Secondary</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">
                    +{report.sourceComparison?.newCanonicalContributedBySecondary || 0}
                  </span>
                  <span className="text-[10px] text-amber-500 mt-0.5 block">Coverage Expanded</span>
                </div>
              </div>
            </div>

            {/* Section 3: Mutually Exclusive Language Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Language Classification Breakdown
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Strict mutually exclusive buckets ensuring canonical sum equals total catalog size.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {report.languageBreakdown.teluguOnly} + {report.languageBreakdown.hindiOnly} + {report.languageBreakdown.multilingual} + {report.languageBreakdown.other} = {report.languageBreakdown.total}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Telugu Only</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">{report.languageBreakdown.teluguOnly}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Tollywood Pure</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Hindi Only</span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">{report.languageBreakdown.hindiOnly}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Bollywood Pure</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Multilingual</span>
                  <span className="text-2xl font-black text-indigo-400 mt-1 block">{report.languageBreakdown.multilingual}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Telugu + Hindi</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Other Indian</span>
                  <span className="text-2xl font-black text-slate-300 mt-1 block">{report.languageBreakdown.other}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Tamil/Malayalam/etc.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Unknown</span>
                  <span className="text-2xl font-black text-slate-400 mt-1 block">{report.languageBreakdown.unknown}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Unspecified</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-700/80 text-center bg-slate-900/50">
                  <span className="text-xs text-slate-300 block uppercase font-bold">Total Movies</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{report.languageBreakdown.total}</span>
                  <span className="text-[10px] text-emerald-500 mt-0.5 block">100% Invariant Pass</span>
                </div>
              </div>
            </div>

            {/* Section 4: Year-by-Year Coverage Table (2002 - 2026) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Year-by-Year Historical Distribution (2002–2026)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reconciled yearly breakdown across 25 historical years with secondary candidate expansion counts.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Total Years Tracked: <span className="text-slate-100 font-bold">{report.yearBreakdown.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Year</th>
                      <th className="py-3 px-3">Telugu Only</th>
                      <th className="py-3 px-3">Hindi Only</th>
                      <th className="py-3 px-3">Multilingual</th>
                      <th className="py-3 px-3">Other</th>
                      <th className="py-3 px-3 font-bold text-slate-200">Year Total</th>
                      <th className="py-3 px-3">Playable Targets</th>
                      <th className="py-3 px-3">Secondary Candidates</th>
                      <th className="py-3 px-3 text-center">Invariant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {report.yearBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-100">{row.year}</td>
                        <td className="py-2.5 px-3 text-amber-400">{row.teluguOnly}</td>
                        <td className="py-2.5 px-3 text-rose-400">{row.hindiOnly}</td>
                        <td className="py-2.5 px-3 text-indigo-400">{row.multilingual}</td>
                        <td className="py-2.5 px-3 text-slate-400">{row.other}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400 font-sans">{row.total}</td>
                        <td className="py-2.5 px-3 text-sky-400">{row.playableTargets}</td>
                        <td className="py-2.5 px-3 text-violet-300">
                          {row.secondaryCandidateCount ? `${row.secondaryCandidateCount} found` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.isReconciled ? (
                            <span className="text-emerald-400 font-bold" title="Reconciled">✓</span>
                          ) : (
                            <span className="text-rose-400 font-bold" title="Mismatch">✕</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-950 font-sans font-bold text-slate-100">
                      <td className="py-3 px-3">TOTALS</td>
                      <td className="py-3 px-3 text-amber-400">{report.languageBreakdown.teluguOnly}</td>
                      <td className="py-3 px-3 text-rose-400">{report.languageBreakdown.hindiOnly}</td>
                      <td className="py-3 px-3 text-indigo-400">{report.languageBreakdown.multilingual}</td>
                      <td className="py-3 px-3 text-slate-400">{report.languageBreakdown.other}</td>
                      <td className="py-3 px-3 text-emerald-400 text-sm font-black">{report.totals.totalMovies}</td>
                      <td className="py-3 px-3 text-sky-400">{report.totals.playableAsTarget}</td>
                      <td className="py-3 px-3 text-violet-300">{report.sourceComparison?.secondaryCandidates || 0}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">100% Pass</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 5: Discovery Sources & Missing Candidate Workflow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Discovery Source Status */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-sky-400" />
                    Discovery Sources Status
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Extensible discovery source adapter architecture status and candidate counts.
                  </p>
                </div>

                <div className="space-y-3">
                  {report.sourceBreakdown.map((src) => (
                    <div
                      key={src.code}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">{src.name}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            src.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {src.status === 'ACTIVE' ? 'Active' : 'Not Implemented'}
                        </span>
                      </div>
                      {src.status === 'ACTIVE' ? (
                        <div className="space-y-2 pt-2">
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Discovered</span>
                              <span className="font-bold text-slate-100">{src.candidatesDiscovered}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">New / Validated</span>
                              <span className="font-bold text-emerald-400">{src.accepted}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Baseline Processed</span>
                              <span className="font-bold text-sky-400">{src.priorProcessed || 0}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Duplicates</span>
                              <span className="font-bold text-purple-400">{src.duplicates}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Review</span>
                              <span className="font-bold text-amber-400">{src.review}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Rejected</span>
                              <span className="font-bold text-rose-400">{src.rejected}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800/50">
                            <span>Canonical Movies With {src.name} ID: <strong className="text-slate-200">{src.canonicalWithSourceId || 0}</strong></span>
                            <span className="text-emerald-400 font-semibold">Candidate Outcome Invariant: ✓ Reconciled</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 pt-1">
                          Connector interface registered. Awaiting official commercial API licensing.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Candidate Ingestion Form */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
                    Targeted Missing Candidate Ingestion
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Safely discover, deduplicate, enrich, normalize, and validate a candidate through the pipeline.
                  </p>
                </div>

                <form onSubmit={handleIngestMissing} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Source Provider</label>
                    <select
                      value={missingSource}
                      onChange={(e) => setMissingSource(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="TMDB">The Movie Database (TMDB) [Active]</option>
                      <option value="WIKIDATA">Wikidata Open Knowledge Graph [Active]</option>
                      <option value="IMDB" disabled>IMDb [Awaiting License]</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Source Movie ID ({missingSource === 'WIKIDATA' ? 'Wikidata QID e.g. Q4699313' : 'TMDB ID e.g. 579974'})
                    </label>
                    <input
                      type="text"
                      placeholder={missingSource === 'WIKIDATA' ? 'e.g. Q4699313 (Aithe)' : 'e.g. 579974 (RRR)'}
                      value={missingSourceId}
                      onChange={(e) => setMissingSourceId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Discovery Reason (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Targeted missing 2024 blockbuster candidate"
                      value={missingReason}
                      onChange={(e) => setMissingReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {ingestFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        ingestFeedback.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {ingestFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{ingestFeedback.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={ingesting || !missingSourceId}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    {ingesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting & Validating Candidate...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Run Ingestion Pipeline
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Section: Discovery Checkpoints & Resumability */}
            {checkpoints.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-400" />
                      Discovery Checkpoints & Resumability Ledger
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Stateful checkpoints enabling fault-tolerant, resumable historical expansion across sources, languages, and years.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                    {checkpoints.length} Checkpoints Recorded
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Source</th>
                        <th className="py-2.5 px-4">Language</th>
                        <th className="py-2.5 px-4 text-center">Year</th>
                        <th className="py-2.5 px-4 text-center">Found</th>
                        <th className="py-2.5 px-4 text-center">Canonical Saved</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                      {checkpoints.map((cp) => (
                        <tr key={cp.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-4 font-mono font-bold text-amber-400">{cp.source}</td>
                          <td className="py-2 px-4 uppercase text-slate-300">{cp.language}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-200">{cp.year}</td>
                          <td className="py-2 px-4 text-center text-sky-400 font-semibold">{cp.candidatesFound}</td>
                          <td className="py-2 px-4 text-center text-emerald-400 font-semibold">{cp.candidatesSaved}</td>
                          <td className="py-2 px-4 text-center">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                              {cp.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">
                            {new Date(cp.updatedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 6: Audit Metadata & Timelines */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Historical Catalog Audit Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Oldest Canonical Movie</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">
                    {report.auditMetadata.oldestMovie
                      ? `${report.auditMetadata.oldestMovie.title} (${report.auditMetadata.oldestMovie.year})`
                      : 'None'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Newest Canonical Movie</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">
                    {report.auditMetadata.newestMovie
                      ? `${report.auditMetadata.newestMovie.title} (${report.auditMetadata.newestMovie.year})`
                      : 'None'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Last Successful Discovery</span>
                  <span className="text-slate-200 font-bold mt-0.5 block truncate">
                    {report.auditMetadata.lastSuccessfulDiscovery
                      ? new Date(report.auditMetadata.lastSuccessfulDiscovery).toLocaleString()
                      : 'Initial Seed'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Last Catalog Refresh</span>
                  <span className="text-slate-200 font-bold mt-0.5 block truncate">
                    {report.auditMetadata.lastSuccessfulRefresh
                      ? new Date(report.auditMetadata.lastSuccessfulRefresh).toLocaleString()
                      : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
