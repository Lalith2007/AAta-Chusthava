'use client';

import React from 'react';
import { ClueResult } from '@/domain/clue/types';
import PersonAvatar from './PersonAvatar';
import { Users, Check, Layers, X } from 'lucide-react';

interface CastTileProps {
  leadActorClue?: ClueResult;
  leadActressClue?: ClueResult;
  supportingCastClue?: ClueResult;
  delayIndex?: number;
}

interface PersonItem {
  id: string;
  name: string;
  image: string | null;
  matched: boolean;
  roleGroup: 'lead' | 'supporting';
}

function parsePersons(
  clue: ClueResult | undefined,
  roleGroup: 'lead' | 'supporting'
): PersonItem[] {
  if (!clue) return [];

  // Check if metadata has structured persons
  const rawPersons = clue.metadata?.persons as Array<{
    id?: string;
    canonicalName?: string;
    name?: string;
    image?: string | null;
    matched?: boolean;
  }> | undefined;

  if (rawPersons && Array.isArray(rawPersons) && rawPersons.length > 0) {
    return rawPersons.map((p, idx) => ({
      id: p.id || `${roleGroup}-${idx}-${p.canonicalName || p.name || 'person'}`,
      name: p.canonicalName || p.name || 'Unknown',
      image: p.image ?? null,
      matched: Boolean(p.matched),
      roleGroup,
    }));
  }

  // Fallback: parse from displayValue and matchedValues
  if (clue.displayValue && clue.displayValue !== '—' && clue.displayValue !== 'None' && clue.displayValue !== 'Unknown') {
    const matchedSet = new Set(
      (clue.matchedValues || []).map((v) => v.toLowerCase().trim())
    );
    const names = clue.displayValue.split(',').map((s) => s.trim()).filter(Boolean);
    return names.map((name, idx) => ({
      id: `${roleGroup}-${idx}-${name}`,
      name,
      image: null,
      matched: matchedSet.has(name.toLowerCase()),
      roleGroup,
    }));
  }

  return [];
}

export default function CastTile({
  leadActorClue,
  leadActressClue,
  supportingCastClue,
  delayIndex = 3,
}: CastTileProps) {
  // Parse all lead persons (combining actor and actress into unified Lead Cast)
  const leadActorPersons = parsePersons(leadActorClue, 'lead');
  const leadActressPersons = parsePersons(leadActressClue, 'lead');

  // Deduplicate lead persons by id or lowercased name
  const seenLead = new Set<string>();
  const leadPersons: PersonItem[] = [];

  for (const p of [...leadActorPersons, ...leadActressPersons]) {
    const key = (p.id || p.name).toLowerCase();
    if (!seenLead.has(key)) {
      seenLead.add(key);
      leadPersons.push(p);
    }
  }

  // Parse supporting cast
  const supportingPersons = parsePersons(supportingCastClue, 'supporting');

  // Compute aggregate match status
  const allPersons = [...leadPersons, ...supportingPersons];
  const matchedPersons = allPersons.filter((p) => p.matched);
  const totalMatched = matchedPersons.length;

  const isExact =
    (leadActorClue?.status === 'EXACT' || leadActressClue?.status === 'EXACT') &&
    allPersons.length > 0 &&
    allPersons.every((p) => p.matched);

  const hasAnyMatch = totalMatched > 0;

  // Visual styling based on aggregate match
  let tileStyle = {
    bg: 'bg-slate-900/80 border-slate-800 text-slate-400',
    badge: 'bg-slate-800 text-slate-400 border border-slate-700',
    statusTag: 'bg-slate-800/40 text-slate-400 border border-slate-700/60',
    statusText: 'No Match',
    icon: <X className="w-3 h-3" />,
  };

  if (isExact) {
    tileStyle = {
      bg: 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 shadow-emerald-950/40',
      badge: 'bg-emerald-500 text-slate-950',
      statusTag: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      statusText: 'Exact Match',
      icon: <Check className="w-3 h-3 stroke-[3]" />,
    };
  } else if (hasAnyMatch) {
    tileStyle = {
      bg: 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-purple-950/40',
      badge: 'bg-purple-500 text-white',
      statusTag: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
      statusText: totalMatched === 1 ? '1 Shared Cast' : `${totalMatched} Shared Cast`,
      icon: <Layers className="w-3 h-3 stroke-[2.5]" />,
    };
  }

  const animationDelay = `${delayIndex * 50}ms`;

  return (
    <div
      style={{ animationDelay }}
      className={`clue-flip relative flex flex-col justify-between p-2.5 rounded-xl border transition-all min-w-[210px] sm:min-w-[240px] max-w-[280px] min-h-[86px] sm:min-h-[92px] shadow-md select-none ${tileStyle.bg}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-1.5 pb-1 border-b border-slate-800/60">
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90">
            Cast
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${tileStyle.statusTag}`}>
            {tileStyle.statusText}
          </span>
          <div className={`p-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${tileStyle.badge}`}>
            {tileStyle.icon}
          </div>
        </div>
      </div>

      {/* Cast Avatars & Names */}
      <div className="space-y-1.5 my-auto w-full">
        {/* Lead Cast */}
        {leadPersons.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Lead Cast
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {leadPersons.map((p) => (
                <PersonAvatar
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  image={p.image}
                  matched={p.matched}
                  size="sm"
                  showName={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Supporting Cast (up to 4 avatars) */}
        {supportingPersons.length > 0 && (
          <div className="pt-0.5 border-t border-slate-800/40">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center justify-between">
              <span>Supporting</span>
              {supportingPersons.length > 4 && (
                <span className="text-[9px] text-slate-400">
                  +{supportingPersons.length - 4} more
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {supportingPersons.slice(0, 4).map((p) => (
                <PersonAvatar
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  image={p.image}
                  matched={p.matched}
                  size="sm"
                  showName={false}
                />
              ))}
            </div>
          </div>
        )}

        {leadPersons.length === 0 && supportingPersons.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-1">
            Cast details unavailable
          </div>
        )}
      </div>
    </div>
  );
}
