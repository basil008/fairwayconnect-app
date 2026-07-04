'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useMember } from '@/lib/MemberContext';

interface Hole { hole_number: number; par: number; stroke_index: number; yardage: number; }
interface Player { id: string; name: string; handicap: number; can_enter_scores: number; }
interface HoleScore { hole_number: number; gross_score: number; stableford_points: number; }

function calcStablefordPoints(gross: number, par: number, si: number, hcp: number): number {
  // Round handicap index to playing handicap for stroke allocation
  const playingHcp = Math.round(hcp);
  // Using handicap >= SI for stroke allocation (standard golf rules)
  let strokes = 0;
  if (playingHcp >= si) strokes++;
  if (playingHcp >= si + 18) strokes++;
  const net = gross - strokes;
  return Math.max(0, 2 - (net - par));
}

export default function ScoringPage() {
  const { member: identifiedMember, isIdentified } = useMember();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [holes, setHoles] = useState<Hole[]>([]);
  const [eventId, setEventId] = useState('');
  const [eventStatus, setEventStatus] = useState('');
  const [eventName, setEventName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState<Map<number, HoleScore>>(new Map());
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [noEvent, setNoEvent] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);
  const [memberScoringEnabled, setMemberScoringEnabled] = useState(true);
  const [scorecardStatus, setScorecardStatus] = useState<'none' | 'in_progress' | 'submitted'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(data => {
      if (!data || (data.status !== 'in_progress' && data.status !== 'upcoming')) {
        setNoEvent(true);
        return;
      }
      if (data.scoring_open !== 1) {
        setNoEvent(true);
        return;
      }
      setHoles(data.holes || []);
      setEventId(data.id);
      setEventStatus(data.status);
      setEventName(data.name);
      setCourseName(data.course_name);
    });
    fetch('/api/rsvps').then(r => r.json()).then(rsvps => {
      const confirmed = (rsvps || []).filter((r: { status: string }) => r.status === 'confirmed');
      setPlayers(confirmed.sort((a: any, b: any) => { const sA = (a.name||'').trim().split(' ').slice(-1)[0]; const sB = (b.name||'').trim().split(' ').slice(-1)[0]; return sA.localeCompare(sB); }).map((r: { member_id: string; name: string; handicap: number; can_enter_scores?: number }) => ({
        id: r.member_id, name: r.name, handicap: r.handicap, can_enter_scores: r.can_enter_scores ?? 1
      })));
    });
    // Check if member scoring is enabled
    fetch('/api/admin/settings').then(r => r.json()).then(settings => {
      setMemberScoringEnabled(settings.member_score_entry !== 'disabled');
    }).catch(() => {});
  }, []);

  // Auto-select identified member
  useEffect(() => {
    if (isIdentified && identifiedMember && players.length > 0 && !selectedPlayer && !autoSelected) {
      const found = players.find(p => p.id === identifiedMember.id);
      if (found) {
        setSelectedPlayer(found.id);
        setAutoSelected(true);
      }
    }
  }, [isIdentified, identifiedMember, players, selectedPlayer, autoSelected]);

  useEffect(() => {
    if (!selectedPlayer || !eventId) return;
    fetch(`/api/scorecards?member_id=${selectedPlayer}&event_id=${eventId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          // Check scorecard status
          if (data.status === 'submitted') {
            setScorecardStatus('submitted');
          } else if (data.status === 'in_progress') {
            setScorecardStatus('in_progress');
          }
          
          if (data.scores) {
            const map = new Map<number, HoleScore>();
            for (const s of data.scores) { map.set(s.hole_number, s); }
            setScores(map);
            const scored = new Set(data.scores.map((s: HoleScore) => s.hole_number));
            for (let h = 1; h <= 18; h++) { if (!scored.has(h)) { setCurrentHole(h); return; } }
            setCurrentHole(18);
          }
        }
      }).catch(() => {});
  }, [selectedPlayer, eventId]);

  const player = players.find(p => p.id === selectedPlayer);
  const hole = holes.find(h => h.hole_number === currentHole);

  const saveScore = useCallback(async (holeNum: number, gross: number) => {
    if (!player) return;
    const holeData = holes.find(h => h.hole_number === holeNum);
    if (!holeData) return;
    const pts = calcStablefordPoints(gross, holeData.par, holeData.stroke_index, player.handicap);
    const newScores = new Map(scores);
    newScores.set(holeNum, { hole_number: holeNum, gross_score: gross, stableford_points: pts });
    setScores(newScores);
    localStorage.setItem(`scores_${eventId}_${selectedPlayer}`, JSON.stringify(Array.from(newScores.entries())));
    try {
      await fetch('/api/scorecards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, member_id: selectedPlayer, scores: [{ hole_number: holeNum, gross_score: gross }] }),
      });
    } catch { /* offline */ }
  }, [player, holes, scores, eventId, selectedPlayer]);

  const submitScorecard = async () => {
    setSaving(true);
    try {
      const allScores = Array.from(scores.values()).map(s => ({ hole_number: s.hole_number, gross_score: s.gross_score }));
      await fetch('/api/scorecards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, member_id: selectedPlayer, scores: allScores }),
      });
      alert('Scorecard submitted! ⛳');
    } catch { alert('Error submitting — scores saved locally.'); }
    setSaving(false);
  };

  const totalPoints = Array.from(scores.values()).reduce((s, h) => s + h.stableford_points, 0);
  const totalGross = Array.from(scores.values()).reduce((s, h) => s + h.gross_score, 0);

  // No event in progress
  if (noEvent) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">⛳</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No Event In Progress</h1>
        <p className="text-sm text-gray-500 text-center">Scoring is currently closed. The admin will open scoring when the event begins.</p>
      </div>
    );
  }

  // Member scoring not enabled
  if (!memberScoringEnabled) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">🔒</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Score Entry Disabled</h1>
        <p className="text-sm text-gray-500 text-center">Member score entry is currently disabled by the committee. Contact your organiser to have your scores entered.</p>
        <Link href="/" className="mt-6 bg-fairway-900 text-white rounded-xl px-6 py-3 font-semibold text-sm">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Check if selected player is allowed to enter scores
  const selectedPlayerRecord = players.find(p => p.id === selectedPlayer);
  if (selectedPlayer && selectedPlayerRecord && !selectedPlayerRecord.can_enter_scores) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <span className="text-6xl mb-4">🚫</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Score Entry Not Allowed</h1>
          <p className="text-sm text-gray-500 text-center mb-2">
            You are not authorised to enter your own scores.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Your organiser will enter your scorecard.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-center">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-bold text-gray-900">{selectedPlayerRecord.name}</p>
          </div>
        </div>
        <Link href="/leaderboard" className="block w-full bg-fairway-900 text-white rounded-2xl py-4 text-center font-bold mt-6">
          📊 View Leaderboard
        </Link>
        <Link href="/" className="block w-full text-center text-fairway-800 font-medium mt-4">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Scorecard already submitted
  if (scorecardStatus === 'submitted' && selectedPlayer) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <span className="text-6xl mb-4">✅</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Scorecard Already Submitted</h1>
          <p className="text-sm text-gray-500 text-center mb-4">
            Your scorecard for this round has been submitted and cannot be edited.
          </p>
          <p className="text-xs text-gray-400 text-center mb-4">
            Contact your organiser if you need to make changes.
          </p>
          <div className="bg-fairway-50 rounded-xl p-4 text-center">
            <p className="text-xs text-fairway-600">Your Score</p>
            <p className="text-2xl font-bold text-fairway-900">{totalPoints} pts</p>
          </div>
        </div>
        <Link href="/leaderboard" className="block w-full bg-fairway-900 text-white rounded-2xl py-4 text-center font-bold mt-6">
          📊 View Leaderboard
        </Link>
        <Link href="/" className="block w-full text-center text-fairway-800 font-medium mt-4">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Player selection — members can ONLY score for themselves
  if (!selectedPlayer) {
    // If identified, check if they're authorised for this event
    if (isIdentified && identifiedMember) {
      // Still loading players
      if (players.length === 0) {
        return (
          <div className="px-4 pt-6 pb-24 text-center">
            <span className="text-4xl block mb-4">⛳</span>
            <p className="text-gray-500">Loading...</p>
          </div>
        );
      }
      
      // Check if member is confirmed for this event
      const playerRecord = players.find(p => p.id === identifiedMember.id);
      
      // Not confirmed for event
      if (!playerRecord) {
        return (
          <div className="px-4 pt-6 pb-24">
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <span className="text-6xl mb-4">🚫</span>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Not Authorised</h1>
              <p className="text-sm text-gray-500 text-center mb-2">
                You are not confirmed for this event.
              </p>
              <p className="text-sm text-gray-500 text-center">
                Contact your organiser to be added to the event.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mt-6 text-center">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="text-sm font-bold text-gray-900">{identifiedMember.name}</p>
              </div>
            </div>
            <Link href="/" className="block w-full bg-gray-200 text-gray-700 rounded-2xl py-4 text-center font-bold mt-6">
              ← Back to Home
            </Link>
          </div>
        );
      }
      
      // Confirmed but not allowed to enter scores
      if (!playerRecord.can_enter_scores) {
        return (
          <div className="px-4 pt-6 pb-24">
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <span className="text-6xl mb-4">🚫</span>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Score Entry Not Allowed</h1>
              <p className="text-sm text-gray-500 text-center mb-2">
                You are not authorised to enter your own scores.
              </p>
              <p className="text-sm text-gray-500 text-center">
                Your organiser will enter your scorecard.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mt-6 text-center">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="text-sm font-bold text-gray-900">{identifiedMember.name}</p>
              </div>
            </div>
            <Link href="/leaderboard" className="block w-full bg-fairway-900 text-white rounded-2xl py-4 text-center font-bold mt-6">
              📊 View Leaderboard
            </Link>
            <Link href="/" className="block w-full text-center text-fairway-800 font-medium mt-4">
              ← Back to Home
            </Link>
          </div>
        );
      }
      
      // Authorised - loading scorecard
      return (
        <div className="px-4 pt-6 pb-24 text-center">
          <span className="text-4xl block mb-4">⛳</span>
          <p className="text-gray-500">Loading your scorecard...</p>
        </div>
      );
    }

    // Not identified — must identify first
    return (
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter Scores</h1>
        <p className="text-sm text-gray-500 mb-4">{eventName} — {courseName}</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <span className="text-5xl block mb-4">🔐</span>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Identify Yourself First</h2>
          <p className="text-sm text-gray-500 mb-6">
            To enter scores, you need to be logged in. Use your personal link or enter your 4-digit member code.
          </p>
          <a href="/"
            className="inline-block bg-fairway-900 text-white rounded-xl px-6 py-3 font-semibold text-sm">
            Go to Home & Enter Code
          </a>
          <p className="text-xs text-gray-400 mt-4">
            Ask your society organiser for your personal link or code
          </p>
        </div>
      </div>
    );
  }

  // Summary
  if (showSummary) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scorecard Summary</h1>
            <p className="text-sm text-gray-500">{player?.name} · Hcp {player?.handicap}</p>
          </div>
          <button onClick={() => setShowSummary(false)} className="text-sm text-fairway-800 font-medium">Edit</button>
        </div>
        <div className="bg-fairway-900 rounded-2xl p-4 text-white mb-4">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-xs text-fairway-200">Stableford</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{totalGross}</p>
              <p className="text-xs text-fairway-200">Gross</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-fairway-50 text-fairway-900">
                <th className="py-2 px-2 text-left">Hole</th>
                <th className="py-2 px-2 text-center">Par</th>
                <th className="py-2 px-2 text-center">SI</th>
                <th className="py-2 px-2 text-center">Score</th>
                <th className="py-2 px-2 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {holes.map(h => {
                const score = scores.get(h.hole_number);
                return (
                  <tr key={h.hole_number} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-medium">{h.hole_number}</td>
                    <td className="py-2 px-2 text-center">{h.par}</td>
                    <td className="py-2 px-2 text-center text-gray-400">{h.stroke_index}</td>
                    <td className="py-2 px-2 text-center font-bold">{score?.gross_score ?? '-'}</td>
                    <td className="py-2 px-2 text-center font-bold text-fairway-900">{score?.stableford_points ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={submitScorecard} disabled={saving || scores.size < 18}
          className="w-full bg-fairway-900 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-50">
          {saving ? 'Submitting...' : '✅ Submit Scorecard'}
        </button>
        <Link href="/leaderboard" className="block w-full text-center bg-white border-2 border-fairway-900 text-fairway-900 rounded-2xl py-3 font-bold text-sm mt-3">
          📊 View Leaderboard
        </Link>
      </div>
    );
  }

  // Calculate points for display
  const getPointsForHole = (holeNum: number): number | null => {
    const score = scores.get(holeNum);
    if (!score) return null;
    return score.stableford_points;
  };

  const front9Points = holes.slice(0, 9).reduce((sum, h) => sum + (getPointsForHole(h.hole_number) || 0), 0);
  const back9Points = holes.slice(9, 18).reduce((sum, h) => sum + (getPointsForHole(h.hole_number) || 0), 0);
  const front9Strokes = holes.slice(0, 9).reduce((sum, h) => sum + (scores.get(h.hole_number)?.gross_score || 0), 0);
  const back9Strokes = holes.slice(9, 18).reduce((sum, h) => sum + (scores.get(h.hole_number)?.gross_score || 0), 0);

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="bg-fairway-900 rounded-2xl p-4 text-white mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-bold text-lg">{player?.name}</p>
            <p className="text-xs text-fairway-200">Handicap: {player?.handicap} · {courseName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-xs text-fairway-200">points</p>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-6 gap-1 mb-2 text-[10px] font-bold text-gray-500 text-center px-1">
        <span>Hole</span>
        <span>Par</span>
        <span>SI</span>
        <span>Strokes</span>
        <span>Pts</span>
        <span></span>
      </div>

      {/* Front 9 */}
      <div className="space-y-1 mb-2">
        {holes.slice(0, 9).map((h) => {
          const score = scores.get(h.hole_number);
          const pts = getPointsForHole(h.hole_number);
          return (
            <div key={h.hole_number} className="grid grid-cols-6 gap-1 items-center bg-white rounded-lg p-1.5 shadow-sm">
              <span className="text-xs font-bold text-center text-gray-700">{h.hole_number}</span>
              <span className="text-xs text-center text-gray-500">{h.par}</span>
              <span className="text-xs text-center text-amber-600 font-medium">{h.stroke_index}</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="15"
                value={score?.gross_score || ''}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  if (val > 0) saveScore(h.hole_number, val);
                }}
                className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm font-bold focus:border-fairway-800 focus:outline-none"
                placeholder="-"
              />
              <span className={`text-sm font-bold text-center ${pts === null ? 'text-gray-300' : pts >= 2 ? 'text-green-600' : pts === 1 ? 'text-amber-600' : 'text-red-500'}`}>
                {pts !== null ? pts : '-'}
              </span>
              <span></span>
            </div>
          );
        })}
      </div>

      {/* Front 9 subtotal */}
      <div className="bg-fairway-100 rounded-lg p-2 mb-3 grid grid-cols-6 gap-1 text-xs font-bold">
        <span className="text-center text-fairway-800">OUT</span>
        <span className="text-center text-gray-500">{holes.slice(0,9).reduce((s,h) => s+h.par, 0)}</span>
        <span></span>
        <span className="text-center text-fairway-900">{front9Strokes || '-'}</span>
        <span className="text-center text-fairway-900">{front9Points}</span>
        <span></span>
      </div>

      {/* Back 9 */}
      <div className="space-y-1 mb-2">
        {holes.slice(9, 18).map((h) => {
          const score = scores.get(h.hole_number);
          const pts = getPointsForHole(h.hole_number);
          return (
            <div key={h.hole_number} className="grid grid-cols-6 gap-1 items-center bg-white rounded-lg p-1.5 shadow-sm">
              <span className="text-xs font-bold text-center text-gray-700">{h.hole_number}</span>
              <span className="text-xs text-center text-gray-500">{h.par}</span>
              <span className="text-xs text-center text-amber-600 font-medium">{h.stroke_index}</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="15"
                value={score?.gross_score || ''}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  if (val > 0) saveScore(h.hole_number, val);
                }}
                className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm font-bold focus:border-fairway-800 focus:outline-none"
                placeholder="-"
              />
              <span className={`text-sm font-bold text-center ${pts === null ? 'text-gray-300' : pts >= 2 ? 'text-green-600' : pts === 1 ? 'text-amber-600' : 'text-red-500'}`}>
                {pts !== null ? pts : '-'}
              </span>
              <span></span>
            </div>
          );
        })}
      </div>

      {/* Back 9 subtotal */}
      <div className="bg-fairway-100 rounded-lg p-2 mb-3 grid grid-cols-6 gap-1 text-xs font-bold">
        <span className="text-center text-fairway-800">IN</span>
        <span className="text-center text-gray-500">{holes.slice(9,18).reduce((s,h) => s+h.par, 0)}</span>
        <span></span>
        <span className="text-center text-fairway-900">{back9Strokes || '-'}</span>
        <span className="text-center text-fairway-900">{back9Points}</span>
        <span></span>
      </div>

      {/* Totals */}
      <div className="bg-fairway-900 text-white rounded-xl p-4 mb-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-fairway-200">Total Strokes</p>
          <p className="text-2xl font-bold">{totalGross || '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-fairway-200">Stableford Points</p>
          <p className="text-2xl font-bold">{totalPoints}</p>
        </div>
      </div>

      {/* Submit button */}
      <button onClick={() => setShowSummary(true)} disabled={scores.size < 18}
        className="w-full bg-fairway-900 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-50">
        {scores.size < 18 ? `Enter all 18 holes (${scores.size}/18)` : '✅ Review & Submit'}
      </button>
      
      <Link href="/leaderboard" className="block w-full text-center text-fairway-800 font-medium mt-4">
        📊 View Leaderboard
      </Link>
    </div>
  );
}
