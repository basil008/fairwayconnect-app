'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Standing {
  member_id: string; name: string; handicap: number; total_points: number;
  events_played: number; best_finish: number; wins: number; position: number;
}

export default function AdminMeritPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadData = () => {
    fetch('/api/goty').then(r => r.json()).then(data => {
      console.log('GOTY data:', data);
      // Convert API format to expected format
      const converted = (data.standings || []).map((p: any) => ({
        member_id: p.member_id,
        name: p.name,
        handicap: p.handicap,
        total_points: p.total_points,
        events_played: p.events_played,
        best_finish: p.best_score,
        wins: 0, // TODO: Calculate from tournament results
        position: p.position
      }));
      setStandings(converted);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { if (isAuth) loadData(); }, [isAuth]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetch('/api/seasons/recalculate', { method: 'POST' });
    loadData();
    setRecalculating(false);
  };

  if (checking || !isAuth) return null;

  return (
    <div>
      <AdminHeader title="Order of Merit" onLock={logout} />
      <AdminNav current="/admin/merit" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">2026 Season Standings</h2>
          <button onClick={handleRecalculate} disabled={recalculating}
            className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {recalculating ? 'Recalculating...' : '🔄 Recalculate'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-center px-2 py-2 w-10">#</th>
                  <th className="text-left px-4 py-2">Player</th>
                  <th className="text-center px-2 py-2">Hcp</th>
                  <th className="text-center px-2 py-2">Events</th>
                  <th className="text-center px-2 py-2">Best</th>
                  <th className="text-center px-2 py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.member_id} className={i > 0 ? 'border-t border-gray-50' : ''}>
                    <td className="px-2 py-2.5 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                    <td className="px-2 py-2.5 text-center text-gray-500">{s.handicap}</td>
                    <td className="px-2 py-2.5 text-center">{s.events_played}</td>
                    <td className="px-2 py-2.5 text-center">{s.best_finish === 99 ? '-' : s.best_finish}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-fairway-900">{s.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
