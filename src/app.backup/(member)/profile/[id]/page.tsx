'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface PlayerData {
  id: string; name: string; handicap: number; member_type: string;
}
interface EventStat {
  event_name: string; position: number; points_earned: number;
  stableford_total: number; gross_total: number; handicap_at_event: number;
  prizes_won: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [stats, setStats] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/player/${id}`).then(r => r.json()).then(data => {
      setPlayer(data?.player || null);
      setStats(data?.event_stats || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">Player not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/merit" className="inline-flex items-center gap-1 text-sm text-fairway-800 font-medium mb-3">
        ← Back to Merit
      </Link>
      <div className="bg-fairway-900 rounded-2xl p-5 text-white mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            {player.member_type === 'visitor' ? '🏷️' : '⛳'}
          </div>
          <div>
            <h1 className="text-xl font-bold">{player.name}</h1>
            <p className="text-fairway-200">Handicap {player.handicap}</p>
            <p className="text-xs text-fairway-300 capitalize">{player.member_type}</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3">Event History</h2>
      {stats.length === 0 ? (
        <p className="text-sm text-gray-400">No event history yet</p>
      ) : (
        <div className="space-y-2">
          {stats.map((s, i) => {
            const prizes = s.prizes_won ? JSON.parse(s.prizes_won) as string[] : [];
            return (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.event_name}</p>
                    <p className="text-xs text-gray-400">Position: {s.position} · Hcp {s.handicap_at_event}</p>
                    {prizes.length > 0 && (
                      <p className="text-xs text-fairway-800 font-medium mt-0.5">🏆 {prizes.join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-fairway-900">{s.stableford_total}</p>
                    <p className="text-[10px] text-gray-400">{s.points_earned} GOTY pts</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
