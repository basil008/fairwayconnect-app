'use client';

import { useEffect, useState, use } from 'react';

interface PlayerData {
  name: string; handicap: number; member_id: string;
}

interface HoleData {
  hole_number: number; par: number; stroke_index: number; yardage: number;
}

export default function PrintScorecardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [holes, setHoles] = useState<HoleData[]>([]);
  const [eventName, setEventName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`).then(r => r.json()).then(data => {
      if (data.event) {
        setEventName(data.event.name);
        setCourseName(data.event.course_name);
        setEventDate(data.event.date);
      }
      setHoles(data.holes || []);
      const confirmed = (data.rsvps || []).filter((r: { status: string }) => r.status === 'confirmed');
      setPlayers(confirmed.map((r: { name: string; handicap: number; member_id: string }) => ({
        name: r.name, handicap: r.handicap, member_id: r.member_id,
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const front9 = holes.filter(h => h.hole_number <= 9).sort((a, b) => a.hole_number - b.hole_number);
  const back9 = holes.filter(h => h.hole_number > 9).sort((a, b) => a.hole_number - b.hole_number);
  const par3Holes = holes.filter(h => h.par === 3).map(h => h.hole_number);
  const par5Holes = holes.filter(h => h.par === 5).map(h => h.hole_number);
  const frontPar = front9.reduce((s, h) => s + h.par, 0);
  const backPar = back9.reduce((s, h) => s + h.par, 0);

  if (loading) return <div className="p-8 text-center">Loading scorecards...</div>;

  return (
    <div>
      {/* Print button - hidden on print */}
      <div className="no-print p-4 bg-fairway-900 text-white flex items-center justify-between">
        <div>
          <h1 className="font-bold">Print Scorecards</h1>
          <p className="text-sm text-fairway-200">{players.length} players · {eventName}</p>
        </div>
        <button onClick={() => window.print()}
          className="bg-white text-fairway-900 px-6 py-2 rounded-xl font-bold text-sm">
          🖨️ Print All
        </button>
      </div>

      {players.map((player, idx) => (
        <div key={player.member_id} className={`p-8 ${idx < players.length - 1 ? 'print-page-break' : ''}`}
          style={{ maxWidth: '800px', margin: '0 auto', pageBreakAfter: idx < players.length - 1 ? 'always' : 'auto' }}>

          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
            <p className="text-sm text-gray-500 font-medium">FairwayConnect — Aer Lingus Golf Society</p>
            <h2 className="text-xl font-bold mt-1">{eventName}</h2>
            <p className="text-sm text-gray-600">{courseName}</p>
            <p className="text-sm text-gray-500">
              {new Date(eventDate + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Player info */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-lg font-bold">{player.name}</p>
              <p className="text-sm text-gray-600">Handicap: {player.handicap}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Marker: ________________________</p>
            </div>
          </div>

          {/* Front 9 */}
          <table className="w-full border-collapse mb-3 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left w-16">Hole</th>
                {front9.map(h => (
                  <th key={h.hole_number} className="border border-gray-300 px-1.5 py-1.5 text-center w-10">{h.hole_number}</th>
                ))}
                <th className="border border-gray-300 px-2 py-1.5 text-center font-bold w-12">Out</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-2 py-1 font-medium text-gray-600">Par</td>
                {front9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-1 text-center">{h.par}</td>)}
                <td className="border border-gray-300 px-2 py-1 text-center font-bold">{frontPar}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 font-medium text-gray-600">SI</td>
                {front9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-1 text-center text-gray-400">{h.stroke_index}</td>)}
                <td className="border border-gray-300 px-2 py-1 text-center"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1.5 font-medium">Score</td>
                {front9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-3 text-center"></td>)}
                <td className="border border-gray-300 px-2 py-3 text-center"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1.5 font-medium">Pts</td>
                {front9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-3 text-center"></td>)}
                <td className="border border-gray-300 px-2 py-3 text-center"></td>
              </tr>
            </tbody>
          </table>

          {/* Back 9 */}
          <table className="w-full border-collapse mb-4 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left w-16">Hole</th>
                {back9.map(h => (
                  <th key={h.hole_number} className="border border-gray-300 px-1.5 py-1.5 text-center w-10">{h.hole_number}</th>
                ))}
                <th className="border border-gray-300 px-2 py-1.5 text-center font-bold w-12">In</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-2 py-1 font-medium text-gray-600">Par</td>
                {back9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-1 text-center">{h.par}</td>)}
                <td className="border border-gray-300 px-2 py-1 text-center font-bold">{backPar}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 font-medium text-gray-600">SI</td>
                {back9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-1 text-center text-gray-400">{h.stroke_index}</td>)}
                <td className="border border-gray-300 px-2 py-1 text-center"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1.5 font-medium">Score</td>
                {back9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-3 text-center"></td>)}
                <td className="border border-gray-300 px-2 py-3 text-center"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1.5 font-medium">Pts</td>
                {back9.map(h => <td key={h.hole_number} className="border border-gray-300 px-1.5 py-3 text-center"></td>)}
                <td className="border border-gray-300 px-2 py-3 text-center"></td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-between mb-6 border-t-2 border-gray-300 pt-3">
            <div className="flex gap-8">
              <div><span className="text-sm text-gray-500">Total Gross:</span> <span className="font-bold">_______</span></div>
              <div><span className="text-sm text-gray-500">Total Points:</span> <span className="font-bold">_______</span></div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mb-6">
            <div><span className="text-sm text-gray-500">Player Signature:</span> <span className="inline-block w-48 border-b border-gray-400">&nbsp;</span></div>
            <div><span className="text-sm text-gray-500">Marker Signature:</span> <span className="inline-block w-48 border-b border-gray-400">&nbsp;</span></div>
          </div>

          {/* Side competitions */}
          <div className="border-t border-gray-200 pt-3 flex gap-8 text-sm text-gray-500">
            {par3Holes.slice(0, 2).map(h => (
              <div key={h}>NTP Hole {h}: _______ m</div>
            ))}
            {par5Holes.length > 0 && <div>Longest Drive Hole {par5Holes[0]}: _______ yds</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
