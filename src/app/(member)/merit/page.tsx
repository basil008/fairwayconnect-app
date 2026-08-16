'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMember } from '@/lib/MemberContext';

interface Standing {
  member_id: string; name: string; handicap: number; total_points: number;
  events_played: number; best_finish: number; wins: number; top_3: number;
  avg_score: number; best_score: number; ntp_wins: number; ld_wins: number;
  position: number; prev_position: number;
}

export default function MeritPage() {
  const { member, isIdentified } = useMember();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [tab, setTab] = useState<'all' | 'div_a' | 'div_b'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<{ events_complete: number; total_events: number; best_of_x: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/merit?division=${tab}`).then(r => r.json()),
      fetch('/api/seasons').then(r => r.json()),
    ]).then(([data, season]) => {
      setStandings(data?.standings || []);
      if (season) {
        setSeasonInfo({ events_complete: season.events_complete || 0, total_events: season.total_events || 12, best_of_x: season.best_of_x || 8 });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tab]);

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order of Merit</h1>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Order of Merit</h1>
      <p className="text-sm text-gray-500 mb-4">
        2026 Season
        {seasonInfo && ` · ${seasonInfo.events_complete} of ${seasonInfo.total_events} events`}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {(['all', 'div_a', 'div_b'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-fairway-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'all' ? 'Overall' : t === 'div_a' ? 'Div A (0-14)' : 'Div B (15+)'}
          </button>
        ))}
      </div>

      {standings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <span className="text-3xl">🏆</span>
          <p className="text-sm text-gray-400 mt-2">No standings yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {standings.map((s, i) => {
            const isMe = isIdentified && member && s.member_id === member.id;
            return (
              <div key={s.member_id}>
                <button onClick={() => setExpanded(expanded === s.member_id ? null : s.member_id)}
                  className={`w-full rounded-xl p-3 shadow-sm text-left flex items-center ${
                    isMe ? 'bg-fairway-50 border-2 border-fairway-800' : 'bg-white'
                  }`}>
                  <div className="w-8 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' :
                      <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                  </div>
                  <div className="flex-1 ml-2 min-w-0">
                    <Link href={`/profile/${s.member_id}`} className={`font-semibold text-sm truncate block ${isMe ? 'text-fairway-900' : 'text-gray-900 hover:text-fairway-800'}`}>
                      {s.name} {isMe && <span className="text-xs font-normal text-fairway-800">(You)</span>}
                    </Link>
                    <p className="text-xs text-gray-400">Hcp {s.handicap} · {s.events_played} event{s.events_played !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${isMe ? 'text-fairway-900' : 'text-fairway-900'}`}>{s.total_points}</p>
                    <p className="text-[10px] text-gray-400">pts</p>
                  </div>
                </button>

                {expanded === s.member_id && (
                  <div className="bg-gray-50 rounded-b-xl px-4 py-3 -mt-1 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-xs text-gray-400">Best Finish</p><p className="font-bold text-sm">{s.best_finish === 99 ? '-' : s.best_finish}</p></div>
                    <div><p className="text-xs text-gray-400">Wins</p><p className="font-bold text-sm">{s.wins}</p></div>
                    <div><p className="text-xs text-gray-400">Top 3</p><p className="font-bold text-sm">{s.top_3}</p></div>
                    <div><p className="text-xs text-gray-400">Best Score</p><p className="font-bold text-sm">{s.best_score || '-'}</p></div>
                    <div><p className="text-xs text-gray-400">NTP Wins</p><p className="font-bold text-sm">{s.ntp_wins}</p></div>
                    <div><p className="text-xs text-gray-400">LD Wins</p><p className="font-bold text-sm">{s.ld_wins}</p></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Points System */}
      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2">How It Works</h3>
        <p className="text-xs text-gray-500 mb-2">
          Sum of your <strong>best 6 Stableford scores</strong> from 8 events.
          The more outings you play, the better your chance to build a strong total!
        </p>
      </div>
    </div>
  );
}
