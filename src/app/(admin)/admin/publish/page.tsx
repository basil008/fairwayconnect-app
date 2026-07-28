'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Event {
  id: string;
  name: string;
  course_name: string;
  date: string;
  status: string;
  results_published: number;
}

interface Prize {
  prize_type: string;
  position: number | null;
  label: string;
  value: number;
  member_name: string;
}

interface LeaderboardEntry {
  name: string;
  handicap: number;
  total_points: number;
  position: number;
}

export default function PublishScoresPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [finalizedEvents, setFinalizedEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventData, setEventData] = useState<{
    event: Event;
    prizes: Prize[];
    leaderboard: LeaderboardEntry[];
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    loadFinalizedEvents();
  }, [isAuth]);

  useEffect(() => {
    if (selectedEventId) {
      loadEventPreview(selectedEventId);
    }
  }, [selectedEventId]);

  const loadFinalizedEvents = async () => {
    try {
      // Use dedicated API endpoint that checks prize_allocations table
      const res = await fetch('/api/events-awaiting-publication');
      const data = await res.json();
      
      const finalized = data.events || [];
      setFinalizedEvents(finalized);
      
      // Auto-select if only one event
      if (finalized.length === 1) {
        setSelectedEventId(finalized[0].id);
      } else if (finalized.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  };

  const loadEventPreview = async (eventId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}/results`);
      const data = await res.json();
      
      setEventData({
        event: data.event,
        prizes: data.prizes || [],
        leaderboard: data.scorecards?.slice(0, 10) || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading event preview:', error);
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirmed || !selectedEventId) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_id: selectedEventId,
          confirmed: true 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setJustPublished(true);
        // Reload to remove published event from list
        await loadFinalizedEvents();
      } else {
        alert(`Error: ${data.error || 'Failed to publish'}`);
      }
    } catch (err) {
      alert('Error publishing results');
    }
    setProcessing(false);
  };

  if (checking || !isAuth) return null;

  // STATE 3: Just Published
  if (justPublished && eventData) {
    return (
      <div>
        <AdminHeader title="Publish Scores" onLock={logout} />
        <AdminNav current="/admin/publish" />

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Results Published!</h2>
            <p className="text-green-700 mb-2">
              <strong>{eventData.event.name}</strong> results are now visible to all members.
            </p>
            <p className="text-sm text-green-600 mb-6">
              {eventData.leaderboard.length} scorecards · {eventData.prizes.length} prizes
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/" className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-800">
                View Homepage →
              </Link>
              <Link href={`/event/${eventData.event.id}/results`} className="inline-block bg-white text-green-700 border-2 border-green-700 px-6 py-3 rounded-xl font-medium hover:bg-green-50">
                View Public Results →
              </Link>
              <button
                onClick={() => {
                  setJustPublished(false);
                  setSelectedEventId(null);
                  setEventData(null);
                  setConfirmed(false);
                  loadFinalizedEvents();
                }}
                className="inline-block bg-white text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">
                Publish Another Event
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STATE 1: No Finalized Events
  if (!loading && finalizedEvents.length === 0) {
    return (
      <div>
        <AdminHeader title="Publish Scores" onLock={logout} />
        <AdminNav current="/admin/publish" />

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Events Ready for Publication</h2>
            <p className="text-gray-500 mb-6">
              Finalize an event first to see it here.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Go to <strong>Admin → Events</strong>, select an event, then navigate to the <strong>Results</strong> tab and click <strong>"Finalize Results (Admin Preview)"</strong>.
            </p>
            <Link href="/admin/dashboard" className="inline-block bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE 2: Events Ready to Publish
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
        ) : (
          <>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-amber-800 font-medium text-center">
                ⚠️ {finalizedEvents.length} event{finalizedEvents.length > 1 ? 's' : ''} finalized and awaiting publication
              </p>
            </div>

            {/* Event Selector */}
            {finalizedEvents.length > 1 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event to Publish:
                </label>
                <select
                  value={selectedEventId || ''}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose an event --</option>
                  {finalizedEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.course_name} - {new Date(event.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview Section */}
            {eventData && (
              <>
                {/* Event Header */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{eventData.event.name}</h2>
                  <p className="text-sm text-gray-500">
                    {eventData.event.course_name} · {new Date(eventData.event.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                      🔒 Awaiting Publication
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {eventData.leaderboard.length} scorecards
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      {eventData.prizes.length} prizes
                    </span>
                  </div>
                </div>

                {/* Prize Preview */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-yellow-100">
                    <p className="text-sm font-bold text-yellow-800">🏆 Results Preview (What Members Will See)</p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {eventData.prizes.length > 0 ? (
                      eventData.prizes.map((prize, idx) => (
                        <div key={idx} className="flex items-center px-4 py-3">
                          <span className="flex-1 font-medium text-gray-800">{prize.label}</span>
                          {prize.value > 0 && (
                            <span className="text-sm font-bold text-green-700">€{prize.value}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-400">
                        No prizes calculated
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaderboard Preview */}
                <details className="bg-white rounded-2xl shadow-sm mb-6">
                  <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                    📋 View Leaderboard Preview (Top 10)
                  </summary>
                  <div className="border-t border-gray-100">
                    {eventData.leaderboard.map((entry, idx) => (
                      <div key={idx} className="flex items-center px-4 py-2 text-sm border-b border-gray-50 last:border-0">
                        <span className="w-8 text-gray-400 font-medium">{entry.position}</span>
                        <span className="flex-1 text-gray-900">{entry.name}</span>
                        <span className="text-xs text-gray-400 mx-2">({entry.handicap})</span>
                        <span className="font-semibold text-gray-700">{entry.total_points} pts</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">I confirm these results are correct</p>
                    <p className="text-sm text-gray-500">
                      Once published, results will be immediately visible to all members on the homepage, calendar, and results pages.
                    </p>
                  </div>
                </label>

                {/* Publish Button */}
                <button
                  onClick={handlePublish}
                  disabled={!confirmed || processing}
                  className={`w-full py-4 rounded-xl text-lg font-bold transition-colors mb-3 ${
                    confirmed && !processing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {processing ? '⏳ Publishing...' : '📢 Publish to All Members'}
                </button>

                {/* Back Link */}
                <p className="text-center text-sm text-gray-500">
                  Need to make changes?{' '}
                  <Link href={`/admin/event/${eventData.event.id}`} className="text-blue-600 font-medium hover:underline">
                    Go to Event Management →
                  </Link>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
