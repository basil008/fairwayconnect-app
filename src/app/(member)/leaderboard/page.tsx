'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMember } from '@/lib/MemberContext';

interface LeaderboardEntry {
  name?: string; member_name?: string; handicap: number; total_points: number; total_gross?: number;
  holes_played?: number; holes_completed?: number; status?: string; member_type?: string; member_id: string;
}

export default function LeaderboardPage() {
  const { member, isIdentified } = useMember();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sideComps, setSideComps] = useState<Array<{ type: string; hole_number: number; member_name: string; value: number; unit: string }>>([]);
  const [live, setLive] = useState(false);
  const [eventFinalised, setEventFinalised] = useState(false);
  const [eventName, setEventName] = useState('');
  const [tab, setTab] = useState<'all' | 'visitors'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Get current/upcoming event
      const eventRes = await fetch('/api/events');
      const event = await eventRes.json();
      
      if (!event || !event.id) {
        setLoading(false);
        return;
      }
      
      // Fetch results for current event only
      const resultsRes = await fetch(`/api/events/${event.id}/results`);
      const results = await resultsRes.json();
      
      setEntries(results.scorecards || []);
      setSideComps(results.sideComps || []);
      setEventName(event.course_name || event.name);
      setEventFinalised(event.status === 'finalised');
      setLive(event.status === 'in_progress');
      setLoading(false);
    } catch (err) {
      console.error('Failed to load live board:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000); // Auto-refresh every 30s
    return () => clearInterval(iv);
  }, []);

  const filtered = entries.filter(e => {
    if (tab === 'visitors') return e.member_type === 'visitor';
    return true;
  });

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h1>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        {live && <span className="flex items-center gap-1 text-xs font-bold text-red-600"><span className="pulse-live">🔴</span> LIVE</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">{eventName}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {(['all', 'visitors'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-fairway-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'all' ? 'All' : 'Visitors'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-gray-400 mt-2">No scores yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {filtered.map((entry, i) => {
            const isMe = isIdentified && member && entry.member_id === member.id;
            return (
              <div key={entry.member_id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''} ${
                isMe ? 'bg-fairway-50 border-l-4 border-l-fairway-800' : ''
              }`}>
                <div className="w-8 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' :
                    <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                </div>
                <div className="flex-1 ml-3 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? 'text-fairway-900' : 'text-gray-900'}`}>
                    {entry.member_name || entry.name} {isMe && <span className="text-xs font-normal text-fairway-800">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400">Hcp {entry.handicap}
                    {entry.member_type === 'visitor' && <span className="ml-1 text-blue-500">(V)</span>}
                    {live && entry.status !== 'submitted' && entry.holes_played && entry.holes_played > 0 &&
                      <span className="ml-1 text-orange-500">Thru {entry.holes_played}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${isMe ? 'text-fairway-900' : 'text-fairway-900'}`}>{entry.total_points}</p>
                  <p className="text-[10px] text-gray-400">{entry.total_gross} gross</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Competitions removed from live leaderboard — shown on Prizes tab in Results instead */}

      {/* View Results link when event is finalised */}
      {eventFinalised && (
        <Link href="/results" className="block w-full text-center bg-white border border-gray-200 text-fairway-900 rounded-2xl py-3 font-bold text-sm mt-4">
          🏆 View Full Results
        </Link>
      )}
    </div>
  );
}
