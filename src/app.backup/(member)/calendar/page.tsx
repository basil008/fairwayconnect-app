'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/lib/MemberContext';

interface CalendarEvent {
  id: string; name: string; course_name: string; date: string; format: string;
  entry_fee: number; first_tee: string; status: string; event_number: number;
  location: string; confirmed_count: number; winner_name: string | null; winner_score: number | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const { member, isIdentified } = useMember();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpMap, setRsvpMap] = useState<Record<string, string>>({});
  const [rsvpSaving, setRsvpSaving] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  
  useEffect(() => {
    // Check if this is guest mode
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('guest') === 'true') {
      setIsGuest(true)
    }
  }, [])

  useEffect(() => {
    fetch('/api/calendar').then(r => r.json()).then(data => {
      setEvents(data?.events || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load RSVPs for identified member
  useEffect(() => {
    if (!isIdentified || !member) return;
    // Load RSVPs for all events
    fetch('/api/rsvps').then(r => r.json()).then(rsvps => {
      const map: Record<string, string> = {};
      for (const r of (rsvps || [])) {
        if (r.member_id === member.id) {
          map[r.event_id] = r.status;
        }
      }
      setRsvpMap(map);
    }).catch(() => {});
  }, [isIdentified, member]);

  const handleRsvp = async (eventId: string, status: 'confirmed' | 'declined') => {
    if (!member) return;
    setRsvpSaving(eventId);
    try {
      await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, member_id: member.id, status }),
      });
      setRsvpMap(prev => ({ ...prev, [eventId]: status }));
    } catch { /* ignore */ }
    setRsvpSaving(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finalised': return '✅';
      case 'in_progress': return '🔴';
      default: return '🔜';
    }
  };

  const isNext = (event: CalendarEvent) => {
    return event.status === 'upcoming' && events.filter(e => e.status === 'upcoming').indexOf(event) === 0;
  };

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Season Calendar</h1>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header with Logout */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Season Calendar</h1>
          <p className="text-sm text-gray-500">2026 Season · {events.length} events</p>
        </div>
        <button 
          onClick={() => {
            // Clear all authentication and member data
            sessionStorage.removeItem('member_auth')
            sessionStorage.removeItem('member_pin')
            sessionStorage.removeItem('guest_mode')
            localStorage.removeItem('fc_member_id')
            localStorage.removeItem('fc_member_name')
            localStorage.removeItem('fc_member_handicap')
            localStorage.removeItem('fairway_remembered_user')
            
            // Redirect to landing page
            window.location.href = '/'
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          title="Logout"
        >
          🚪
        </button>
      </div>

      <div className="space-y-3">
        {events.map(event => {
          const myRsvp = rsvpMap[event.id];
          return (
            <div key={event.id}>
              <button
                onClick={() => {
                  // Navigate to results for finalised or in-progress events
                  if (event.status === 'finalised' || event.status === 'in_progress') {
                    router.push(`/event/${event.id}/results`);
                  } else {
                    setExpanded(expanded === event.id ? null : event.id);
                  }
                }}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm text-left transition-all ${
                  isNext(event) ? 'ring-2 ring-fairway-800' : ''
                } ${event.status === 'in_progress' ? 'ring-2 ring-red-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{getStatusIcon(event.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">
                          {event.event_number}. {event.name}
                        </p>
                        <p className="text-sm text-gray-500">{event.course_name}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 ml-2 flex-shrink-0">
                        {new Date(event.date + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {event.status === 'finalised' && event.winner_name && (
                      <p className="text-sm text-fairway-800 font-medium mt-1">
                        🏆 {(event as any).winner_label || `${event.winner_name} — ${event.winner_score} pts`}
                      </p>
                    )}
                    
                    {event.status === 'finalised' && (
                      <span className="inline-block text-xs text-fairway-600 mt-1">
                        📊 Tap to view full results →
                      </span>
                    )}

                    {isNext(event) && (
                      <span className="inline-block bg-fairway-50 text-fairway-900 text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                        📋 Next Event
                      </span>
                    )}

                    {/* RSVP status badge */}
                    {isIdentified && myRsvp && event.status === 'upcoming' && (
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ml-1 ${
                        myRsvp === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {myRsvp === 'confirmed' ? '✅ Going' : '❌ Not going'}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {expanded === event.id && (
                <div className="bg-gray-50 rounded-b-2xl px-4 py-3 -mt-2 pt-5 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">📍 Location:</span> <span className="font-medium">{event.location || event.course_name}</span></div>
                    <div><span className="text-gray-500">⛳ Format:</span> <span className="font-medium">{event.format}</span></div>
                    <div><span className="text-gray-500">🕐 Tee Time:</span> <span className="font-medium">{event.first_tee}</span></div>
                    <div><span className="text-gray-500">💶 Entry Fee:</span> <span className="font-medium">€{event.entry_fee}</span></div>
                  </div>
                  {event.confirmed_count > 0 && (
                    <p className="text-sm text-gray-600">👥 {event.confirmed_count} confirmed</p>
                  )}

                  {/* One-tap RSVP for upcoming events */}
                  {isIdentified && event.status === 'upcoming' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleRsvp(event.id, 'confirmed')}
                        disabled={rsvpSaving === event.id}
                        className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
                          myRsvp === 'confirmed'
                            ? 'bg-green-500 text-white'
                            : 'bg-fairway-900 text-white'
                        }`}
                      >
                        {myRsvp === 'confirmed' ? '✅ Going' : "I'm In! ✅"}
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'declined')}
                        disabled={rsvpSaving === event.id}
                        className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
                          myRsvp === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {myRsvp === 'declined' ? "❌ Can't Make It" : "Can't Make It"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
