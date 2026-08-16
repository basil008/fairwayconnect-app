'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Scorecard {
  member_id: string;
  name: string;
  handicap: number;
  total_points: number;
  total_gross: number;
  holes_completed: number;
  status: string;
}

interface Prize {
  prize_type: string;
  position: number;
  label: string;
  value: number;
  member_name: string;
}

interface SideComp {
  type: string;
  hole_number: number;
  member_name: string;
  value: number;
  unit: string;
}

interface EventData {
  event: {
    id: string;
    name: string;
    course_name: string;
    date: string;
    format: string;
    status: string;
  };
  scorecards: Scorecard[];
  prizes: Prize[];
  sideComps: SideComp[];
}

export default function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leaderboard' | 'prizes'>('leaderboard');

  useEffect(() => {
    fetch(`/api/events/${id}/results`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.event) {
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <span className="text-5xl mb-4 block">🔍</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h1>
        <Link href="/calendar" className="text-fairway-800 font-medium">← Back to Calendar</Link>
      </div>
    );
  }

  const { event, scorecards, prizes, sideComps } = data;
  
  // Sort scorecards by points (descending)
  const sortedScores = [...scorecards].sort((a, b) => b.total_points - a.total_points);
  
  // Group prizes
  const overallPrizes = prizes.filter(p => p.prize_type === 'overall' || p.prize_type === 'class_1' || p.prize_type === 'class_2');
  const front9Prizes = prizes.filter(p => p.prize_type === 'front_9' || p.prize_type === 'class_1_front_9' || p.prize_type === 'class_2_front_9');
  const back9Prizes = prizes.filter(p => p.prize_type === 'back_9' || p.prize_type === 'class_1_back_9' || p.prize_type === 'class_2_back_9');
  const divisionPrizes = prizes.filter(p => ['division_a', 'division_b', 'best_visitor'].includes(p.prize_type));
  const ntpComps = sideComps.filter(s => s.type === 'ntp');
  const ldComps = sideComps.filter(s => s.type === 'longest_drive');
  const twosComps = sideComps.filter(s => s.type === 'twos');

  const shareWhatsApp = () => {
    let text = `🏆 ${event.name} Results\n📍 ${event.course_name}\n📅 ${new Date(event.date + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    text += `📊 Leaderboard\n`;
    sortedScores.slice(0, 10).forEach((sc, i) => {
      text += `${i + 1}. ${sc.name} — ${sc.total_points} pts\n`;
    });
    
    if (overallPrizes.length > 0) {
      text += `\n🏆 Winners\n`;
      overallPrizes.forEach(p => {
        text += `${p.label}\n`;
      });
    }
    
    text += '\n⛳ FairwayConnect';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <Link href="/calendar" className="text-sm text-fairway-800 font-medium mb-3 inline-block">
        ← Back to Calendar
      </Link>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{event.name}</h1>
      <p className="text-sm text-gray-500 mb-4">
        📍 {event.course_name} · {new Date(event.date + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      
      {/* Status badge */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          event.status === 'finalised' 
            ? 'bg-green-100 text-green-800' 
            : event.status === 'in_progress'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {event.status === 'finalised' ? '✅ Final Results' : event.status === 'in_progress' ? '🔴 Live Scoring' : '🔜 Upcoming'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('leaderboard')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'leaderboard' ? 'bg-fairway-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          📊 Leaderboard
        </button>
        <button
          onClick={() => setTab('prizes')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'prizes' ? 'bg-fairway-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          🏆 Prizes
        </button>
      </div>

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div>
          {sortedScores.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <span className="text-4xl mb-3 block">📋</span>
              <p className="text-gray-500">No scores submitted yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedScores.slice(0, 10).map((sc, index) => {
                const position = index + 1;
                const isTop3 = position <= 3;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
                
                return (
                  <div
                    key={sc.member_id}
                    className={`bg-white rounded-xl p-4 shadow-sm flex items-center ${
                      isTop3 ? 'ring-2 ring-yellow-300' : ''
                    }`}
                  >
                    <div className="w-10 text-center">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{position}</span>
                      )}
                    </div>
                    <div className="flex-1 ml-3">
                      <p className="font-bold text-gray-900">{sc.name}</p>
                      <p className="text-xs text-gray-400">
                        Hcp {sc.handicap} · {sc.total_gross} gross · {sc.holes_completed}/18 holes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isTop3 ? 'text-fairway-900' : 'text-gray-700'}`}>
                        {sc.total_points}
                      </p>
                      <p className="text-[10px] text-gray-400">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Side Competitions on leaderboard */}
          {(ntpComps.length > 0 || ldComps.length > 0 || twosComps.length > 0) && (
            <div className="mt-6 space-y-3">
              {ntpComps.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">🎯 Nearest the Pin</h4>
                  {ntpComps.map((s, i) => (
                    <p key={i} className="text-sm py-1">Hole {s.hole_number}: <span className="font-bold">{s.member_name}</span></p>
                  ))}
                </div>
              )}
              {ldComps.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">💥 Longest Drive</h4>
                  {ldComps.map((s, i) => (
                    <p key={i} className="text-sm py-1">Hole {s.hole_number}: <span className="font-bold">{s.member_name}</span></p>
                  ))}
                </div>
              )}
              {twosComps.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">🏆 Twos</h4>
                  {twosComps.map((s, i) => (
                    <p key={i} className="text-sm py-1">Hole {s.hole_number}: <span className="font-bold">{s.member_name}</span></p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prizes Tab */}
      {tab === 'prizes' && data.prizes && data.prizes.length > 0 && (
        <div className="space-y-2">
          {data.prizes.map((p, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm ${
              p.prize_type === 'overall' && p.position === 1 ? 'ring-2 ring-yellow-400' : ''
            }`}>
              <p className="font-bold text-gray-900">{p.label}</p>
              {p.value > 0 && <p className="text-sm text-fairway-800">€{p.value} prize</p>}
            </div>
          ))}
        </div>
      )}

      {/* Prizes Tab - No prizes published yet */}
      {tab === 'prizes' && (!data.prizes || data.prizes.length === 0) && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-3 block">🏆</span>
          <p className="text-gray-500">No prizes awarded yet</p>
        </div>
      )}

      {/* Share button */}
      {sortedScores.length > 0 && (
        <button
          onClick={shareWhatsApp}
          className="w-full bg-green-600 text-white rounded-2xl py-3 font-bold text-sm mt-6"
        >
          📱 Share via WhatsApp
        </button>
      )}
    </div>
  );
}
