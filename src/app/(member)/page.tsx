'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMember } from '@/lib/MemberContext';
import MemberPickerBanner from '@/components/MemberPickerBanner';

interface EventData {
  id: string; name: string; course_name: string; date: string; format: string;
  entry_fee: number; first_tee: string; status: string; confirmed_count: number;
}

interface LeaderboardEntry {
  name: string; total_points: number; position: number; handicap: number;
}

interface NineWinner {
  name: string; handicap: number; points: number;
}

interface ClassWinner {
  name: string; handicap: number; points: number; position: number;
}

interface LastEventData {
  event_name: string;
  event_date?: string;
  leaderboard: LeaderboardEntry[];
  class1_winners?: ClassWinner[];
  class2_winners?: ClassWinner[];
  front9_winner: NineWinner | null;
  back9_winner: NineWinner | null;
}

export default function HomePage() {
  const { member, isIdentified, clearMember } = useMember();
  const [event, setEvent] = useState<EventData | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<{ events_complete: number; total_events: number } | null>(null);
  const [oomLeader, setOomLeader] = useState<{ name: string; total_points: number } | null>(null);
  const [recentResult, setRecentResult] = useState<{ event_name: string; winner_name: string; winner_score: number } | null>(null);
  const [lastEventData, setLastEventData] = useState<LastEventData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'declined'>('none');
  const [rsvpSaving, setRsvpSaving] = useState(false);
  const [myTeeTime, setMyTeeTime] = useState<{ group_number: number; tee_time: string; players: string[] } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/seasons').then(r => r.json()),
      fetch('/api/merit?division=all').then(r => r.json()),
      fetch('/api/calendar').then(r => r.json()),
      fetch('/api/leaderboard').then(r => r.json()),
    ]).then(([e, season, merit, calendar, leaderboard]) => {
      setEvent(e);
      if (season) {
        setSeasonInfo({ events_complete: season.events_complete || 0, total_events: season.total_events || 12 });
      }
      if (merit?.standings?.length > 0) {
        setOomLeader({ name: merit.standings[0].name, total_points: merit.standings[0].total_points });
      }
      if (calendar?.events) {
        const completed = calendar.events.filter((ev: Record<string, unknown>) => ev.status === 'finalised');
        if (completed.length > 0) {
          const last = completed[completed.length - 1];
          if (last.winner_name) {
            setRecentResult({ event_name: last.name as string, winner_name: last.winner_name as string, winner_score: last.winner_score as number });
          }
        }
      }
      // Set prizes from last finalised event (top 3 + front9/back9)
      if (leaderboard?.finalised && leaderboard.leaderboard?.length > 0) {
        setLastEventData({
          event_name: leaderboard.event_name,
          event_date: leaderboard.event_date,
          leaderboard: leaderboard.leaderboard.slice(0, 3).map((e: { name: string; total_points: number; position: number; handicap: number }) => ({
            name: e.name,
            total_points: e.total_points,
            position: e.position,
            handicap: e.handicap,
          })),
          front9_winner: leaderboard.front9_winner || null,
          back9_winner: leaderboard.back9_winner || null,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Check existing RSVP and tee time for identified member
  useEffect(() => {
    if (!isIdentified || !event) return;
    fetch('/api/rsvps')
      .then(r => r.json())
      .then(rsvps => {
        const myRsvp = (rsvps || []).find((r: { member_id: string; status: string }) => r.member_id === member!.id);
        if (myRsvp) {
          setRsvpStatus(myRsvp.status === 'confirmed' ? 'confirmed' : myRsvp.status === 'declined' ? 'declined' : 'none');
        }
      })
      .catch(() => {});
    
    // Fetch tee times
    fetch(`/api/admin/events/${event.id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.teeTimes) {
          const myGroup = data.teeTimes.find((tt: { members: Array<{ id: string }> }) => 
            tt.members.some((m: { id: string }) => m.id === member!.id)
          );
          if (myGroup) {
            setMyTeeTime({
              group_number: myGroup.group_number,
              tee_time: myGroup.tee_time,
              players: myGroup.members.map((m: { name: string }) => m.name)
            });
          }
        }
      })
      .catch(() => {});
  }, [isIdentified, event, member]);

  useEffect(() => {
    if (!event || event.status === 'finalised') return;
    const update = () => {
      const target = new Date(event.date + 'T' + (event.first_tee || '09:00') + ':00');
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setCountdown('Event Day!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${d}d ${h}h ${m}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [event]);

  const handleRsvp = async (status: 'confirmed' | 'declined') => {
    if (!event || !member) return;
    setRsvpSaving(true);
    try {
      await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, member_id: member.id, status }),
      });
      setRsvpStatus(status);
    } catch {
      alert('Error saving RSVP');
    }
    setRsvpSaving(false);
  };

  const isLive = event?.status === 'in_progress';
  const firstName = member?.name?.split(' ')[0] || '';

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">⛳</span>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse mb-4" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⛳</span>
          <div>
            {isIdentified ? (
              <>
                <h1 className="text-2xl font-bold text-fairway-900">Hi {firstName}! 👋</h1>
                <p className="text-sm text-gray-500">Aer Lingus Golf Society · 2026</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-fairway-900">Aer Lingus Golf Society</h1>
                <p className="text-sm text-gray-500">2026 Season</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-fairway-50 hover:text-fairway-900 transition-colors" title="Committee Admin">
            ⚙️
          </Link>
        </div>
      </div>

      {/* Member Picker Banner (only shows if not identified) */}
      <MemberPickerBanner />

      {/* Live Event Banner */}
      {isLive && (
        <Link href="/scoring">
          <div className="bg-red-600 rounded-2xl p-4 text-white mb-4 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl pulse-live">🔴</span>
              <div>
                <p className="font-bold text-lg">Event Live!</p>
                <p className="text-sm text-red-100">{event?.name} — Enter your scores</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>
      )}

      {/* My Tee Time Card - for identified members with a group */}
      {isIdentified && myTeeTime && (
        <div className="bg-gradient-to-r from-fairway-50 to-white border-2 border-fairway-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-fairway-800 uppercase tracking-wider">⛳ Your Tee Time</p>
            <span className="bg-fairway-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">Group {myTeeTime.group_number}</span>
          </div>
          <p className="text-3xl font-black text-fairway-900">{myTeeTime.tee_time}</p>
          <div className="mt-2 pt-2 border-t border-fairway-200">
            <p className="text-xs text-gray-500 mb-1">Playing with:</p>
            <p className="text-sm font-medium text-gray-700">
              {myTeeTime.players.filter(p => p !== member?.name).join(', ') || 'Solo'}
            </p>
          </div>
        </div>
      )}

      {/* Season Progress + OOM */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {seasonInfo && (
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">📅 Season Progress</p>
            <p className="text-lg font-black text-fairway-900 mt-1">
              {seasonInfo.events_complete} of {seasonInfo.total_events}
            </p>
            <p className="text-[10px] text-gray-400">events played</p>
          </div>
        )}
        {oomLeader && (
          <Link href="/merit" className="bg-white rounded-xl p-3 shadow-sm active:bg-gray-50">
            <p className="text-xs text-gray-500 font-medium">🏆 OOM Leader</p>
            <p className="text-sm font-black text-fairway-900 mt-1 truncate">{oomLeader.name}</p>
            <p className="text-[10px] text-gray-400">{oomLeader.total_points} pts (best 6)</p>
          </Link>
        )}
      </div>

      {/* Last Event Prizes (ALGS Format) */}
      {lastEventData && (
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-yellow-100">
            <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">🏆 Last Event Results</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{lastEventData.event_name}</p>
            {lastEventData.event_date && (
              <p className="text-xs text-gray-500">{new Date(lastEventData.event_date + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {/* Top 3 */}
            {lastEventData.leaderboard.map((entry, idx) => (
              <div key={idx} className="flex items-center px-4 py-2.5 bg-yellow-50/30">
                <span className="w-16 text-xs font-bold text-gray-500">
                  {entry.position === 1 ? '1st' : entry.position === 2 ? '2nd' : '3rd'}
                </span>
                <span className="flex-1 font-semibold text-gray-900 truncate">{entry.name}</span>
                <span className="text-xs text-gray-400 mx-2">({entry.handicap})</span>
                <span className="font-bold text-fairway-900 text-sm">{entry.total_points} pts</span>
              </div>
            ))}
            {/* Class 1 Winners */}
            {lastEventData.class1_winners && lastEventData.class1_winners.map((winner, idx) => (
              <div key={`class1-${idx}`} className="flex items-center px-4 py-2.5 bg-blue-50/30">
                <span className="w-16 text-xs font-bold text-blue-600">Class 1 {winner.position === 1 ? '1st' : '2nd'}</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{winner.name}</span>
                <span className="text-xs text-gray-400 mx-2">({winner.handicap})</span>
                <span className="font-semibold text-gray-700 text-sm">{winner.points} pts</span>
              </div>
            ))}
            {/* Class 2 Winners */}
            {lastEventData.class2_winners && lastEventData.class2_winners.map((winner, idx) => (
              <div key={`class2-${idx}`} className="flex items-center px-4 py-2.5 bg-green-50/30">
                <span className="w-16 text-xs font-bold text-green-600">Class 2 {winner.position === 1 ? '1st' : '2nd'}</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{winner.name}</span>
                <span className="text-xs text-gray-400 mx-2">({winner.handicap})</span>
                <span className="font-semibold text-gray-700 text-sm">{winner.points} pts</span>
              </div>
            ))}
            {/* Front 9 */}
            {lastEventData.front9_winner && (
              <div className="flex items-center px-4 py-2.5">
                <span className="w-16 text-xs font-bold text-gray-500">Front 9</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{lastEventData.front9_winner.name}</span>
                <span className="text-xs text-gray-400 mx-2">({lastEventData.front9_winner.handicap})</span>
                <span className="font-semibold text-gray-700 text-sm">{lastEventData.front9_winner.points} pts</span>
              </div>
            )}
            {/* Back 9 */}
            {lastEventData.back9_winner && (
              <div className="flex items-center px-4 py-2.5">
                <span className="w-16 text-xs font-bold text-gray-500">Back 9</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{lastEventData.back9_winner.name}</span>
                <span className="text-xs text-gray-400 mx-2">({lastEventData.back9_winner.handicap})</span>
                <span className="font-semibold text-gray-700 text-sm">{lastEventData.back9_winner.points} pts</span>
              </div>
            )}
          </div>
          <Link href="/results" className="block text-center py-2.5 text-sm font-medium text-fairway-800 bg-gray-50 hover:bg-gray-100">
            View All Results →
          </Link>
        </div>
      )}

      {/* Next Event Hero Card */}
      {event && event.status !== 'finalised' && !isLive && (
        <div className="bg-fairway-900 rounded-2xl p-5 text-white mb-4 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-fairway-100 text-xs font-medium uppercase tracking-wider">
                {isIdentified ? 'Your Next Event' : 'Next Event'}
              </p>
              <h2 className="text-xl font-bold mt-1">{event.name}</h2>
              <p className="text-fairway-200 text-sm mt-0.5">📍 {event.course_name}</p>
            </div>
            <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">{event.format}</span>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center mt-3">
            <p className="text-2xl font-bold">{countdown}</p>
            <p className="text-xs text-fairway-200 mt-0.5">until first tee</p>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span className="text-sm">{event.confirmed_count} confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span className="text-sm">
                {new Date(event.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
          {/* RSVP buttons */}
          {isIdentified ? (
            <div className="flex gap-2 mt-4">
              {rsvpStatus === 'confirmed' ? (
                <div className="flex-1 bg-green-500 text-white rounded-xl py-2.5 font-bold text-sm text-center">
                  ✅ You&apos;re In!
                </div>
              ) : (
                <button
                  onClick={() => handleRsvp('confirmed')}
                  disabled={rsvpSaving}
                  className="flex-1 bg-white text-fairway-900 rounded-xl py-2.5 font-bold text-sm disabled:opacity-50"
                >
                  I&apos;m In! ✅
                </button>
              )}
              {rsvpStatus === 'declined' ? (
                <div className="flex-1 bg-white/20 text-white/70 rounded-xl py-2.5 font-bold text-sm text-center">
                  Can&apos;t Make It 😢
                </div>
              ) : (
                <button
                  onClick={() => handleRsvp('declined')}
                  disabled={rsvpSaving}
                  className="flex-1 bg-white/20 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-50"
                >
                  Can&apos;t Make It
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => alert('Select your name first to RSVP!')}
                className="flex-1 bg-white text-fairway-900 rounded-xl py-2.5 font-bold text-sm"
              >
                I&apos;m In! ✅
              </button>
              <button
                onClick={() => alert('Select your name first to RSVP!')}
                className="flex-1 bg-white/20 text-white rounded-xl py-2.5 font-bold text-sm"
              >
                Can&apos;t Make It
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Links if event is live */}
      {isLive && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/scoring" className="bg-fairway-900 text-white rounded-2xl p-4 shadow-sm text-center">
            <span className="text-3xl mb-2 block">⛳</span>
            <span className="font-semibold text-sm">Enter Scores</span>
          </Link>
          <Link href="/leaderboard" className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <span className="text-3xl mb-2 block">📊</span>
            <span className="font-semibold text-sm text-gray-900">Leaderboard</span>
          </Link>
        </div>
      )}

      {/* Mini links */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link href="/calendar" className="bg-white rounded-xl p-3 shadow-sm text-center active:bg-gray-50">
          <span className="text-2xl block mb-1">📅</span>
          <span className="text-xs font-medium text-gray-700">Calendar</span>
        </Link>
        <Link href="/results" className="bg-white rounded-xl p-3 shadow-sm text-center active:bg-gray-50">
          <span className="text-2xl block mb-1">🎖️</span>
          <span className="text-xs font-medium text-gray-700">Results</span>
        </Link>
        <Link href="/goty" className="bg-white rounded-xl p-3 shadow-sm text-center active:bg-gray-50">
          <span className="text-2xl block mb-1">🏆</span>
          <span className="text-xs font-medium text-gray-700">GOTY</span>
        </Link>
      </div>
    </div>
  );
}
