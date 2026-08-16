'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface ScorecardInfo {
  id: string; member_id: string; name: string; handicap: number;
  status: string; total_points: number; total_gross: number; holes_completed: number;
}

export default function AdminScoringPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [scorecards, setScorecards] = useState<ScorecardInfo[]>([]);
  const [confirmed, setConfirmed] = useState<Array<{ member_id: string; name: string; handicap: number }>>([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingScorecardId, setEditingScorecardId] = useState<string | null>(null);
  const [editingHoles, setEditingHoles] = useState<Array<{ hole_number: number; gross_score: number; stableford_points: number }>>([]);
  const [courseHoles, setCourseHoles] = useState<Array<{ hole_number: number; par: number; stroke_index: number }>>([]);
  const [playingHandicap, setPlayingHandicap] = useState(0);

  const loadData = () => {
    Promise.all([
      fetch('/api/leaderboard').then(r => r.json()),
      fetch('/api/rsvps').then(r => r.json()),
      fetch('/api/events').then(r => r.json()),
    ]).then(([lb, rsvps, event]) => {
      setScorecards(lb.leaderboard || []);
      setConfirmed((rsvps || []).filter((r: { status: string }) => r.status === 'confirmed')
        .map((r: { member_id: string; name: string; handicap: number }) => ({
          member_id: r.member_id, name: r.name, handicap: r.handicap
        })));
      setEventName(event?.name || '');
      if (event?.holes) setCourseHoles(event.holes);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const editScorecard = async (scorecardId: string, memberName: string, handicap: number) => {
    const res = await fetch(`/api/scorecards/${scorecardId}`);
    const data = await res.json();
    setEditingHoles(data.holes || []);
    setPlayingHandicap(handicap);
    setEditingScorecardId(scorecardId);
  };

  const updateHoleScore = (holeNumber: number, grossScore: number) => {
    const hole = courseHoles.find(h => h.hole_number === holeNumber);
    if (!hole) return;
    
    const strokes = Math.max(0, playingHandicap >= hole.stroke_index ? 1 : 0);
    const netScore = grossScore - strokes;
    let stablefordPoints = 0;
    if (netScore <= hole.par - 2) stablefordPoints = 4;
    else if (netScore === hole.par - 1) stablefordPoints = 3;
    else if (netScore === hole.par) stablefordPoints = 2;
    else if (netScore === hole.par + 1) stablefordPoints = 1;
    
    setEditingHoles(prev => prev.map(h => 
      h.hole_number === holeNumber 
        ? { ...h, gross_score: grossScore, stableford_points: stablefordPoints }
        : h
    ));
  };

  const saveEditedScorecard = async () => {
    if (!editingScorecardId) return;
    await fetch(`/api/scorecards/${editingScorecardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holes: editingHoles })
    });
    setEditingScorecardId(null);
    loadData();
  };

  const deleteScorecard = async (scorecardId: string) => {
    if (!confirm('Delete this scorecard? The player can re-enter scores.')) return;
    await fetch(`/api/scorecards/${scorecardId}`, { method: 'DELETE' });
    loadData();
  };

  const resetScorecard = async (scorecardId: string) => {
    if (!confirm('Reset scorecard to empty? Player can re-enter all scores.')) return;
    await fetch(`/api/scorecards/${scorecardId}/reset`, { method: 'POST' });
    loadData();
  };

  useEffect(() => {
    if (!isAuth) return;
    loadData();
    const iv = setInterval(loadData, 15000);
    return () => clearInterval(iv);
  }, [isAuth]);

  if (checking || !isAuth) return null;

  const scoredIds = new Set(scorecards.map(s => s.member_id));
  const notStarted = confirmed.filter(c => !scoredIds.has(c.member_id));
  const submitted = scorecards.filter(s => s.status === 'submitted');
  const inProgress = scorecards.filter(s => s.status !== 'submitted');

  return (
    <div>
      <AdminHeader title="Score Monitoring" onLock={logout} />
      <AdminNav current="/admin/scoring" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{eventName}</h2>
        <p className="text-sm text-gray-500 mb-4">Live scoring overview · Auto-refreshes every 15s</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{submitted.length}</p>
            <p className="text-xs text-green-600">Submitted</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{inProgress.length}</p>
            <p className="text-xs text-orange-600">On Course</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{notStarted.length}</p>
            <p className="text-xs text-gray-600">Not Started</p>
          </div>
        </div>

        {/* In Progress */}
        {inProgress.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-2">⏳ On Course</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {inProgress.map((sc, i) => (
                <div key={sc.id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-orange-500 rounded-full h-1.5" style={{ width: `${(sc.holes_completed / 18) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">Thru {sc.holes_completed}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-fairway-900">{sc.total_points || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitted */}
        {submitted.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-2">✅ Submitted</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {submitted.map((sc, i) => (
                <div key={sc.id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sc.name}</p>
                    <p className="text-xs text-gray-400">Hcp {sc.handicap} · {sc.total_gross} gross</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-fairway-900 mr-2">{sc.total_points}</p>
                    <button onClick={() => editScorecard(sc.id, sc.name, sc.handicap)}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium hover:bg-blue-200">
                      ✏️
                    </button>
                    <button onClick={() => resetScorecard(sc.id)}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg font-medium hover:bg-yellow-200">
                      🔄
                    </button>
                    <button onClick={() => deleteScorecard(sc.id)}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-lg font-medium hover:bg-red-200">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Scorecard Modal */}
        {editingScorecardId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Scorecard</h3>
                <button onClick={() => setEditingScorecardId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {editingHoles.map(hole => {
                  const courseHole = courseHoles.find(h => h.hole_number === hole.hole_number);
                  return (
                    <div key={hole.hole_number} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Hole {hole.hole_number}</span>
                        <span className="text-xs text-gray-500">Par {courseHole?.par || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max="12"
                          value={hole.gross_score || ''}
                          onChange={(e) => updateHoleScore(hole.hole_number, parseInt(e.target.value) || 0)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm font-bold"
                        />
                        <span className="text-sm text-gray-600">→</span>
                        <div className="bg-fairway-900 text-white rounded-lg px-2 py-1 min-w-[2rem] text-center text-sm font-bold">
                          {hole.stableford_points}
                        </div>
                        <span className="text-xs text-gray-500">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-3">
                <button onClick={saveEditedScorecard}
                  className="flex-1 bg-fairway-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-fairway-800">
                  💾 Save Changes
                </button>
                <button onClick={() => setEditingScorecardId(null)}
                  className="px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Not Started */}
        {notStarted.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-2">🔴 Not Started</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {notStarted.map((p, i) => (
                <div key={p.member_id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-500">{p.name}</p>
                    <p className="text-xs text-gray-400">Hcp {p.handicap}</p>
                  </div>
                  <button className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-medium">
                    📲 Prod
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
