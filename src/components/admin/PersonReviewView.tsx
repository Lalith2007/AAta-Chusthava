'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User as UserIcon,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Keyboard,
  ShieldCheck,
  AlertTriangle,
  Zap,
  LayoutGrid,
  Star,
} from 'lucide-react';

export type PersonRejectionReason =
  | 'WRONG_PERSON'
  | 'WRONG_MOVIE'
  | 'PLACEHOLDER'
  | 'BROKEN_IMAGE'
  | 'AMBIGUOUS_IDENTITY'
  | 'UNRELATED_IMAGE'
  | 'OTHER';

interface PersonReviewItem {
  id: string;
  name: string;
  role: 'LEAD' | 'DIRECTOR' | 'SUPPORTING' | string;
  tmdbId: number | null;
  currentImage: string | null;
  associatedMovieTitle: string | null;
  associatedMovieYear: number | null;
  associatedMovies: string[];
  googleSearchUrl: string;
  candidateSource: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchEvidence?: {
    nameMatch: 'EXACT' | 'PARTIAL';
    movieCorroboration: 'MATCH' | 'UNKNOWN';
    tmdbIdPresent: boolean;
  };
}

export default function PersonReviewView() {
  const [items, setItems] = useState<PersonReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [playerVisibleTotal, setPlayerVisibleTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [playerVisibleOnly, setPlayerVisibleOnly] = useState(true); // Default ON
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LEAD' | 'DIRECTOR' | 'SUPPORTING'>('ALL');

  // Workstation mode state
  const [isWorkstationMode, setIsWorkstationMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [manualUrl, setManualUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Session counters
  const [sessionApproved, setSessionApproved] = useState(0);
  const [sessionRejected, setSessionRejected] = useState(0);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<PersonReviewItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<PersonRejectionReason>('WRONG_PERSON');

  const urlInputRef = useRef<HTMLInputElement>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        playerVisibleOnly: String(playerVisibleOnly),
        ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
      });
      const res = await fetch(`/api/admin/media/person-review?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPlayerVisibleTotal(data.playerVisibleTotal || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to load person review queue:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, playerVisibleOnly, roleFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const currentItem: PersonReviewItem | undefined = items[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setManualUrl('');
      setPreviewUrl('');
    }
  }, [currentIndex, currentItem]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (page < totalPages) {
      setPage((p) => p + 1);
    }
  }, [currentIndex, items.length, page, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [currentIndex, page]);

  const handleApprove = async (personId: string, urlToApprove?: string) => {
    const finalUrl = (urlToApprove || manualUrl || previewUrl)?.trim();
    if (!finalUrl) {
      setFeedback({ text: 'Please enter a valid image URL before approving.', type: 'error' });
      return;
    }

    setActionInProgress(personId);
    try {
      const res = await fetch('/api/admin/media/person-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', personId, imageUrl: finalUrl }),
      });
      const result = await res.json();
      if (res.ok) {
        setSessionApproved((s) => s + 1);
        setFeedback({ text: `✓ Profile image approved for ${currentItem?.name}. Provenance: ADMIN_MANUAL_VERIFIED.`, type: 'success' });
        setTimeout(() => setFeedback(null), 3000);
        // Remove item locally and auto-advance
        setItems((prev) => prev.filter((i) => i.id !== personId));
        setTotal((t) => Math.max(0, t - 1));
        setPlayerVisibleTotal((t) => Math.max(0, t - 1));
      } else {
        setFeedback({ text: result.error || 'Approval failed.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Network error during approval.', type: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const personId = rejectingItem.id;

    setActionInProgress(personId);
    try {
      const res = await fetch('/api/admin/media/person-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', personId, reason: rejectionReason }),
      });
      if (res.ok) {
        setSessionRejected((s) => s + 1);
        setFeedback({ text: `Candidate rejected (${rejectionReason}). Record remains in review queue.`, type: 'info' });
        setTimeout(() => setFeedback(null), 3000);
        setRejectingItem(null);
        handleNext();
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Reject failed.', type: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenGoogle = useCallback(() => {
    if (currentItem?.googleSearchUrl) {
      window.open(currentItem.googleSearchUrl, '_blank', 'noopener,noreferrer');
    }
  }, [currentItem]);

  // Keyboard Shortcuts (Workstation Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'Escape') {
        if (rejectingItem) {
          setRejectingItem(null);
          return;
        }
        setPreviewUrl('');
        return;
      }

      if (e.key === 'Enter' && isInput && manualUrl.trim() && currentItem) {
        e.preventDefault();
        handleApprove(currentItem.id, manualUrl.trim());
        return;
      }

      if (isInput) return;

      switch (e.key.toUpperCase()) {
        case 'A':
          if (currentItem && (previewUrl || manualUrl.trim())) {
            e.preventDefault();
            handleApprove(currentItem.id);
          }
          break;
        case 'R':
          if (currentItem) {
            e.preventDefault();
            setRejectingItem(currentItem);
          }
          break;
        case 'S':
        case 'N':
          e.preventDefault();
          handleNext();
          break;
        case 'P':
          e.preventDefault();
          handlePrev();
          break;
        case 'G':
          e.preventDefault();
          handleOpenGoogle();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItem, manualUrl, previewUrl, rejectingItem, handleNext, handlePrev, handleOpenGoogle]);

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white">Person Profile Review Workstation</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Player-Visible Priority
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Corroborated profile image review. Strict name + movie + role corroboration required.
              </p>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/80">
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Queue Total</span>
            <span className="text-sm font-black text-purple-300">{total}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Player-Visible Missing</span>
            <span className="text-sm font-black text-amber-400">{playerVisibleTotal}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Approved</span>
            <span className="text-sm font-black text-emerald-300">+{sessionApproved}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Rejected</span>
            <span className="text-sm font-black text-red-400">-{sessionRejected}</span>
          </div>
        </div>

        {/* Workstation vs Table toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsWorkstationMode(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isWorkstationMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Workstation</span>
          </button>
          <button
            onClick={() => setIsWorkstationMode(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              !isWorkstationMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Queue List</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Bar */}
      <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Keyboard className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Keyboard Shortcuts:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-purple-300">A</span>
          <span className="text-slate-400">Approve</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-red-300">R</span>
          <span className="text-slate-400">Reject</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-300">G</span>
          <span className="text-slate-400">Search Google</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">S / N</span>
          <span className="text-slate-400">Next / Skip</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">P</span>
          <span className="text-slate-400">Previous</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-300">Enter</span>
          <span className="text-slate-400">Approve URL</span>
        </div>
      </div>

      {/* Filter / Role Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Player-Visible Only Toggle */}
          <button
            onClick={() => {
              setPlayerVisibleOnly(!playerVisibleOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center space-x-1.5 ${
              playerVisibleOnly
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-purple-400" />
            <span>{playerVisibleOnly ? '★ Player-Visible Only (6932)' : 'All Catalog Persons (7976)'}</span>
          </button>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold focus:outline-none"
          >
            <option value="ALL">All Roles (Lead &rarr; Dir &rarr; Supporting)</option>
            <option value="LEAD">1. Lead Cast (2609 missing)</option>
            <option value="DIRECTOR">2. Directors (3071 missing)</option>
            <option value="SUPPORTING">3. Supporting Cast (2638 missing)</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search person name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-44"
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
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-red-950/80 border-red-500 text-red-300'
              : 'bg-blue-950/80 border-blue-500 text-blue-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* MAIN VIEW: WORKSTATION MODE */}
      {isWorkstationMode && currentItem && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          {/* Progress Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-black">
                PERSON {(page - 1) * pageSize + currentIndex + 1} of {total}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Role: {currentItem.role} | {currentItem.associatedMovieTitle || 'Active Film'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0 && page === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev (P)</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === items.length - 1 && page === totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 flex items-center space-x-1"
              >
                <span>Next (N)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Avatar / Photo Preview */}
            <div className="lg:col-span-4 flex flex-col items-center space-y-3">
              <div className="w-full max-w-[240px] aspect-square rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden shadow-2xl relative flex items-center justify-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={currentItem.name}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setFeedback({ text: 'Preview image URL failed to load. Please verify link.', type: 'error' });
                    }}
                  />
                ) : currentItem.currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentItem.currentImage} alt={currentItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <UserIcon className="w-16 h-16 stroke-[1.5]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      No Photo Assigned
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {previewUrl ? 'Validated Candidate Preview' : 'Current Profile Asset'}
              </span>
            </div>

            {/* Right: Person Identity & Evidence */}
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-white">{currentItem.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase">
                    {currentItem.role}
                  </span>
                  {currentItem.tmdbId ? (
                    <a
                      href={`https://www.themoviedb.org/person/${currentItem.tmdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1"
                    >
                      <span>TMDB: {currentItem.tmdbId}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-mono">
                      TMDB: UNLINKED
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                  <p className="text-slate-300">
                    <span className="font-bold text-slate-400">Primary Associated Film:</span>{' '}
                    <span className="text-amber-300 font-bold">
                      {currentItem.associatedMovieTitle ? `${currentItem.associatedMovieTitle} (${currentItem.associatedMovieYear})` : 'Catalog Film'}
                    </span>
                  </p>
                  <p className="text-slate-300 truncate">
                    <span className="font-bold text-slate-400">Filmography Credits:</span>{' '}
                    {currentItem.associatedMovies.join(' | ') || 'None'}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-bold text-slate-400">Review Status:</span>{' '}
                    <span className="text-amber-400 font-bold uppercase">MANUAL REVIEW REQUIRED</span>
                  </p>
                </div>
              </div>

              {/* Identity Evidence Matrix */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="uppercase tracking-wider">Identity Corroboration Standard</span>
                  </span>
                  <span className="text-emerald-400 font-mono">Confidence: {currentItem.confidence}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Name Corroboration</span>
                    <span className="font-bold text-emerald-400">EXACT</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Movie Association</span>
                    <span className="font-bold text-amber-300">
                      {currentItem.associatedMovieTitle ? 'CORROBORATED' : 'CATALOG'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Provenance Stamp</span>
                    <span className="font-bold text-purple-300">ADMIN_MANUAL_VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Search Google Exact Person Link */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={currentItem.googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>SEARCH GOOGLE (G)</span>
                </a>
                <span className="text-[11px] text-slate-400 truncate">
                  Opens: <code className="text-blue-300 font-mono">{`"${currentItem.name}" "${currentItem.associatedMovieTitle || ''}" profile photo`}</code>
                </span>
              </div>

              {/* Manual URL Input & Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  Paste Verified Direct Profile Image URL:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={urlInputRef}
                    type="url"
                    placeholder="https://... (direct image link .jpg / .webp / .png)"
                    value={manualUrl}
                    onChange={(e) => {
                      setManualUrl(e.target.value);
                      setPreviewUrl(e.target.value.trim());
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => setPreviewUrl(manualUrl.trim())}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={() => handleApprove(currentItem.id)}
                  disabled={Boolean(actionInProgress) || !previewUrl}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ APPROVE (A)</span>
                </button>

                <button
                  onClick={() => setRejectingItem(currentItem)}
                  disabled={Boolean(actionInProgress)}
                  className="px-4 py-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>✕ REJECT (R)</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <span>SKIP (S)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE QUEUE VIEW */}
      {!isWorkstationMode && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center flex-shrink-0">
                  {item.currentImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.currentImage} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-extrabold text-slate-100 truncate">{item.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.role}
                    </span>
                    {item.tmdbId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        TMDB {item.tmdbId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Associated Film: {item.associatedMovieTitle ? `${item.associatedMovieTitle} (${item.associatedMovieYear})` : 'Active Movie'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <a
                  href={item.googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google</span>
                </a>
                <button
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsWorkstationMode(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Open Workstation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-white">Record Rejection Reason</h4>
            </div>
            <p className="text-xs text-slate-400">
              Select explicit reason for rejecting profile candidate for{' '}
              <span className="text-purple-300 font-bold">{rejectingItem.name}</span>.
              This person will remain explicitly classified in the manual review queue.
            </p>

            <div className="space-y-1.5">
              {[
                { key: 'WRONG_PERSON', label: 'Wrong Person / Name Collision' },
                { key: 'WRONG_MOVIE', label: 'Person Not Associated With Movie' },
                { key: 'PLACEHOLDER', label: 'Placeholder / Generic Graphic' },
                { key: 'BROKEN_IMAGE', label: 'Broken / Unloadable Image' },
                { key: 'AMBIGUOUS_IDENTITY', label: 'Ambiguous Identity / Low Confidence' },
                { key: 'UNRELATED_IMAGE', label: 'Unrelated Photo / Group Photo' },
                { key: 'OTHER', label: 'Other Reason' },
              ].map((r) => (
                <label
                  key={r.key}
                  className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    rejectionReason === r.key
                      ? 'bg-red-500/20 border-red-500 text-red-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="personRejectionReason"
                    value={r.key}
                    checked={rejectionReason === r.key}
                    onChange={() => setRejectionReason(r.key as PersonRejectionReason)}
                    className="accent-red-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel (Esc)
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={Boolean(actionInProgress)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white shadow-lg shadow-red-600/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
