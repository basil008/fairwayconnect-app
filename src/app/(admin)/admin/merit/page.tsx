'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface GOTYEntry {
  position: number;
  member_id: string;
  name: string;
  handicap: number;
  total_points: number;
  events_played: number;
  counting_events: number;
  best_score: number;
  breakdown: Array<{
    event_id: string;
    event_name: string;
    event_date: string;
    points: number;
    counting: boolean;
  }>;
}

export default function AdminMeritPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [standings, setStandings] = useState<GOTYEntry[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [season] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) return;
    fetch(`/api/goty?season=${season}&limit=100`)
      .then(r => r.json())
      .then(data => {
        const s = data.standings || [];
        setStandings(s);
        setTotalEvents(data.total_events || 0);
        // Extract unique event names in date order from all breakdowns
        const evtMap = new Map<string, string>();
        for (const entry of s) {
          for (const b of entry.breakdown) {
            if (!evtMap.has(b.event_id)) evtMap.set(b.event_id, b.event_name);
          }
        }
        const uniqueEvents = s.length > 0
          ? s[0].breakdown.sort((a: any, b: any) => a.event_date.localeCompare(b.event_date)).map((b: any) => b.event_name)
          : [];
        setEventNames(uniqueEvents);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuth, season]);

  if (checking || !isAuth) return null;

  const getMedal = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return pos;
  };

  const shortEvent = (evt: string) => {
    return evt.replace(' Golf Club', '').replace('Golf Club', '').substring(0, 12);
  };

  const shortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name;
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last}`;
  };

  return (
    <div>
      <AdminHeader title="Order of Merit" onLock={logout} />
      <AdminNav current="/admin/merit" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-fairway-900">2026 Season Standings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Best 6 scores count | {standings.length} players
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-400">No results yet for {season}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-fairway-900 text-white">
                  <th className="px-2 py-3 text-left text-xs font-bold w-8">#</th>
                  <th className="px-2 py-3 text-left text-xs font-bold min-w-[140px]">Player</th>
                  <th className="px-3 py-3 text-center text-xs font-bold w-16 bg-yellow-600">
                    Total<br /><span className="text-[9px] font-normal">(Best 6)</span>
                  </th>

                  {eventNames.map((evt, idx) => (
                    <th key={evt} className="px-2 py-3 text-center text-xs font-bold min-w-[60px]" title={evt}>
                      <div>Evt {idx + 1}</div>
                      <div className="text-[9px] font-normal opacity-75">{shortEvent(evt)}</div>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-xs font-bold w-14">Played</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry, i) => {
                  const isTop3 = entry.position <= 3;
                  return (
                    <tr key={entry.member_id} className={`border-b border-gray-100 ${isTop3 ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-2 py-2.5 text-center font-bold text-gray-500">
                        {getMedal(entry.position)}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={`font-semibold ${isTop3 ? 'text-fairway-900' : 'text-gray-800'}`}>
                          {shortName(entry.name)}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-center font-bold text-lg ${isTop3 ? 'text-fairway-900' : 'text-gray-800'}`}
                        style={isTop3 ? { background: 'rgba(234, 179, 8, 0.15)' } : {}}>
                        {entry.total_points}
                      </td>

                      {eventNames.map((evt, evtIdx) => {
                        const score = entry.breakdown.find(b => b.event_name === evt);
                        // Calculate running total: best 6 of scores up to and including this event
                        const scoresUpToHere = entry.breakdown
                          .filter(b => eventNames.indexOf(b.event_name) <= evtIdx)
                          .map(b => b.points)
                          .sort((a, b) => b - a)
                          .slice(0, 6);
                        const runningTotal = scoresUpToHere.reduce((s, p) => s + p, 0);
                        if (!score) {
                          return <td key={evt} className="px-2 py-2.5 text-center text-gray-300 text-xs">—</td>;
                        }
                        return (
                          <td key={evt} className="px-2 py-2.5 text-center">
                            <span className={`inline-block min-w-[28px] px-1 py-0.5 rounded text-xs font-semibold ${
                              score.counting
                                ? 'bg-green-100 text-green-800'
                                : 'text-gray-400'
                            }`}>
                              {score.points}
                            </span>
                            <div className="text-[9px] text-gray-400 mt-0.5">{runningTotal}</div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2.5 text-center text-xs text-gray-600">
                        {entry.events_played}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
