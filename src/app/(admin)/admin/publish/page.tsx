'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface LeaderboardEntry {
  name: string;
  handicap: number;
  total_points: number;
  total_gross: number;
  position: number;
}

interface Prize {
  prize_type: string;
  position: number | null;
  label: string;
  value: number;
  member_name: string;
}

export default function PublishScoresPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [eventData, setEventData] = useState<{
    id: string;
    name: string;
    course_name: string;
    date: string;
    status: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    // Fetch finalized but unpublished events
    fetch('/api/events-list')
      .then(r => r.json())
      .then(async (events) => {
        // Find events where status='finalised' AND results_published=0
        const pendingEvents = events.filter((e: any) => 
          e.status === 'finalised' && (e.results_published === 0 || e.results_published === null)
        );
        
        if (pendingEvents.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get the most recent one
        const event = pendingEvents.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        // Fetch event-specific results
        const resultsRes = await fetch(`/api/events/${event.id}/results`);
        const results = await resultsRes.json();
        
        setEventData(event);
        setLeaderboard(results.scorecards || []);
        setPrizes(results.prizes || []);
        
        setPublished(event.results_published === 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuth]);

  const handlePublish = async () => {
    if (!confirmed || !eventData) return;
    setPublishing(true);
    try {
      await fetch('/api/publish-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventData.id }),
      });
      setPublished(true);
    } catch (err) {
      alert('Error publishing results');
    }
    setPublishing(false);
  };

  if (checking || !isAuth) return null;

  const canPublish = eventData?.status === 'finalised' && eventData?.results_published === 0 && prizes.length > 0;

  return (
    <div>
      <AdminHeader title="Publish Scores" onLock={logout} />
      <AdminNav current="/admin/publish" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        ) : published ? (
          /* Already Published */
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Results Published!</h2>
            <p className="text-green-700 mb-6">
              {eventData?.name} results are now visible to all members.
            </p>
            <Link href="/" className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-800">
              View Homepage →
            </Link>
          </div>
        ) : !eventData ? (
          /* No Events Awaiting Publication */
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Events Awaiting Publication</h2>
            <p className="text-gray-500 mb-6">
              All finalized events have been published. Finalize an event first to publish its results.
            </p>
            <Link href="/admin/dashboard" className="inline-block bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
              Go to Dashboard →
            </Link>
          </div>
        ) : !canPublish ? (
          /* Event exists but can't publish */
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Not Ready to Publish</h2>
            <p className="text-gray-500 mb-6">
              Event needs to be finalized first.
            </p>
            <Link href={`/admin/event/${eventData?.id}`} className="inline-block bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
              Go to Event Management →
            </Link>
          </div>
        ) : (
          /* Review & Publish */
          <>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-amber-800 font-medium text-center">
                ⚠️ Review the results below before publishing to all members
              </p>
            </div>

            {/* Event Header */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-900">{eventData?.name}</h2>
              <p className="text-sm text-gray-500">{eventData?.course_name} · {eventData?.date}</p>
              <p className="text-xs text-gray-400 mt-1">{leaderboard.length} scorecards submitted</p>
            </div>

            {/* Prize Preview - Shows ALL prizes exactly as in Admin/Event/Results */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-yellow-100">
                <p className="text-sm font-bold text-yellow-800">🏆 Results Preview</p>
              </div>
              {prizes.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {prizes.map((prize, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{prize.label}</span>
                      {prize.value > 0 && (
                        <span className="text-sm text-fairway-800 font-bold">€{prize.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No prizes calculated yet. Please finalize the event first.
                </div>
              )}
            </div>

            {/* Full Leaderboard */}
            <details className="bg-white rounded-2xl shadow-sm mb-6">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                📋 View Full Leaderboard ({leaderboard.length} players)
              </summary>
              <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center px-4 py-2 text-sm border-b border-gray-50 last:border-0">
                    <span className="w-8 text-gray-400 font-medium">{entry.position}</span>
                    <span className="flex-1 text-gray-900">{entry.name}</span>
                    <span className="text-xs text-gray-400 mx-2">({entry.handicap})</span>
                    <span className="font-semibold text-gray-700">{entry.total_points}</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-fairway-900 focus:ring-fairway-800"
              />
              <div>
                <p className="font-medium text-gray-900">I confirm these results are correct</p>
                <p className="text-sm text-gray-500">Once published, results will be visible to all members on the homepage and leaderboard.</p>
              </div>
            </label>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={!confirmed || publishing}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-colors ${
                confirmed && !publishing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {publishing ? '⏳ Publishing...' : '📢 Publish to All Members'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
