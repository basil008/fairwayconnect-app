'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function GOTYPage() {
  const [standings, setStandings] = useState<GOTYEntry[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/goty?season=${season}&limit=100`)
      .then(r => r.json())
      .then(data => {
        const s = data.standings || [];
        setStandings(s);
        setTotalEvents(data.total_events || 0);
        // Extract unique event names and sort by event number (1-8)
        const evtMap = new Map<string, { name: string; date: string }>();
        for (const entry of s) {
          for (const b of entry.breakdown) {
            if (!evtMap.has(b.event_id)) {
              evtMap.set(b.event_id, { name: b.event_name, date: b.event_date });
            }
          }
        }
        // Sort by date to ensure correct sequence (event 1 to 8)
        const sortedEvents = Array.from(evtMap.values())
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(e => e.name);
        setEventNames(sortedEvents);
        setLoading(false);
      });
  }, [season]);

  const getMedal = (pos: number) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}`;

  const shortName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length <= 2) return name.trim();
    return name.trim();
  };

  const shortEvent = (name: string) => {
    // Abbreviate long course names for column headers
    return name.replace(' Golf Club', '').replace(' Golf & Country Club', '').substring(0, 12);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-fairway-900 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-fairway-200 text-sm mb-2 block">← Back</Link>
          <h1 className="text-2xl font-bold">🏆 Golfer of the Year {season}</h1>
          <p className="text-fairway-200 text-sm mt-1">Golfer of the Year — Best 6 of 8 Stableford Scores</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Rules */}
        <div className="bg-amber-50 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm text-amber-800">
            Best <span className="font-bold">6 of 8</span> Stableford scores count. {totalEvents} event{totalEvents !== 1 ? 's' : ''} played.
            <span className="ml-2 text-xs text-amber-600">Highlighted scores = counting towards total. Faded = lowest scores (dropped).</span>
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
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto relative">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-fairway-900 text-white">
                  <th className="px-2 py-3 text-left text-xs font-bold sticky left-0 bg-fairway-900 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]" style={{ minWidth: '40px' }}>#</th>
                  <th className="px-2 py-3 text-left text-xs font-bold sticky bg-fairway-900 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]" style={{ left: '40px', minWidth: '150px' }}>Player</th>
                  <th className="px-3 py-3 text-center text-xs font-bold bg-yellow-600 sticky z-20 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.3)]" style={{ left: '190px', minWidth: '70px' }}>
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
                      <td className={`px-2 py-2.5 text-center font-bold text-gray-500 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] ${isTop3 ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{ minWidth: '40px' }}>
                        {getMedal(entry.position)}
                      </td>
                      <td className={`px-2 py-2.5 sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] ${isTop3 ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{ left: '40px', minWidth: '150px' }}>
                        <span className={`font-semibold ${isTop3 ? 'text-fairway-900' : 'text-gray-800'}`}>
                          {shortName(entry.name)}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-center font-bold text-lg sticky z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] ${isTop3 ? 'text-fairway-900 bg-yellow-50' : i % 2 === 0 ? 'text-gray-800 bg-white' : 'text-gray-800 bg-gray-50'}`}
                        style={{ left: '190px', minWidth: '70px' }}>
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
                        {entry.events_played}/{totalEvents > 0 ? totalEvents : 8}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span><span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span> Counting score (best 6)</span>
          <span><span className="inline-block w-3 h-3 bg-gray-100 rounded mr-1"></span> Dropped score</span>
          <span>— = Did not play</span>
        </div>
      </div>
    </div>
  );
}
