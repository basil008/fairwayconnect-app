'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/lib/MemberContext';

interface EventData {
  id: string; name: string; course_name: string; date: string; format: string;
  entry_fee: number; first_tee: string; status: string; confirmed_count: number;
}

interface LeaderboardEntry {
  name: string; total_points: number; position: number; handicap: number;
}

interface LastEventData {
  event_name: string;
  event_date?: string;
  leaderboard: LeaderboardEntry[];
  front9_winner: { name: string; handicap: number; points: number } | null;
  back9_winner: { name: string; handicap: number; points: number } | null;
  twos_winners?: Array<{ name: string; hole_number: number }>;
}

interface TeeTime {
  id: string;
  time: string;
  group_number: number;
  members: string[];
}

function YourTeeTime({ eventId, eventName, eventDate, onTeeTimeFound }: { eventId: string; eventName: string; eventDate: string; onTeeTimeFound?: (time: string) => void }) {
  const { member } = useMember();
  const [teeTime, setTeeTime] = useState<TeeTime | null>(null);
  const [partners, setPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.id) return;

    // Fetch tee times for the event
    fetch(`/api/events/${eventId}/tee-times`)
      .then(r => r.json())
      .then(data => {
        if (!data || !Array.isArray(data)) {
          setLoading(false);
          return;
        }

        // Find the group containing this member
        const myGroup = data.find((tt: TeeTime) => 
          Array.isArray(tt.members) && tt.members.includes(member.id)
        );

        if (!myGroup) {
          setLoading(false);
          return;
        }

        setTeeTime(myGroup);
        
        // Notify parent component of the tee time
        if (onTeeTimeFound && myGroup.time) {
          onTeeTimeFound(myGroup.time);
        }

        // Fetch names of other members in the group
        const otherMemberIds = myGroup.members.filter((id: string) => id !== member.id);
        
        if (otherMemberIds.length === 0) {
          setPartners([]);
          setLoading(false);
          return;
        }

        fetch('/api/members')
          .then(r => r.json())
          .then(members => {
            const partnerNames = otherMemberIds
              .map((id: string) => {
                const m = members.find((mem: any) => mem.id === id);
                return m ? m.name : null;
              })
              .filter((n: string | null) => n !== null);
            setPartners(partnerNames);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [member?.id, eventId]);

  if (loading) return null;
  if (!teeTime) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 mb-6 border border-green-200">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">⏰</span>
        <div>
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Your Tee Time</p>
          <p className="text-sm font-bold text-gray-900">{eventName}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="text-2xl font-bold text-green-700">{teeTime.time}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Group</p>
            <p className="text-2xl font-bold text-gray-900">{teeTime.group_number}</p>
          </div>
        </div>
      </div>

      {partners.length > 0 && (
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Playing with</p>
          <div className="space-y-1">
            {partners.map((name, i) => (
              <div key={i} className="flex items-center">
                <span className="text-sm text-gray-700">👤 {name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberHome() {
  const router = useRouter();
  const { member, isIdentified } = useMember();
  const [event, setEvent] = useState<EventData | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<{ events_complete: number; total_events: number } | null>(null);
  const [oomLeader, setOomLeader] = useState<{ name: string; total_points: number } | null>(null);
  const [lastEventData, setLastEventData] = useState<LastEventData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'declined'>('none');
  const [myTeeTime, setMyTeeTime] = useState<{ group_number: number; tee_time: string; players: string[] } | null>(null);
  const [memberTeeTime, setMemberTeeTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const memberAuth = sessionStorage.getItem('member_auth');
    const guestMode = sessionStorage.getItem('guest_mode');
    
    if (!memberAuth && !guestMode && !isIdentified) {
      router.push('/');
      return;
    }
  }, [router, isIdentified]);

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/seasons').then(r => r.json()),
      fetch('/api/goty').then(r => r.json()),
      fetch('/api/calendar').then(r => r.json()),
    ]).then(async ([e, season, goty, calendar]) => {
      setEvent(e);
      setSeasonInfo(season);
      // Get GOTY leader from the standings
      const leader = goty?.standings?.[0] || null;
      setOomLeader(leader ? {
        name: leader.name,
        total_points: leader.total_points
      } : null);
      // Get last finalized AND published event results
      const finalized = calendar?.events?.filter((ev: any) => ev.status === 'finalised' && ev.results_published === 1);
      if (finalized && finalized.length > 0) {
        const lastEvent = finalized[finalized.length - 1];
        const results = await fetch(`/api/events/${lastEvent.id}/results`).then(r => r.json());
        const twosWinners = results.sideComps
          ?.filter((sc: any) => sc.type === 'twos')
          ?.map((sc: any) => ({
            name: sc.member_name,
            hole_number: sc.hole_number
          })) || [];
        
        // Get top 2 from published prizes (respects Captain's Prize special rules)
        const overallPrizes = results.prizes?.filter((p: any) => p.prize_type === 'overall') || [];
        const leaderboard = overallPrizes.length >= 2 ? overallPrizes.slice(0, 2).map((p: any) => ({
          name: p.member_name,
          total_points: p.label?.match(/(\d+) pts/)?.[1] || 0,
          handicap: results.scorecards?.find((sc: any) => sc.name === p.member_name)?.handicap || 0
        })) : results.scorecards?.slice(0, 2) || [];
        
        setLastEventData({
          event_name: lastEvent.course_name,
          event_date: lastEvent.date,
          leaderboard,
          front9_winner: results.prizes?.find((p: any) => p.prize_type === 'front_9'),
          back9_winner: results.prizes?.find((p: any) => p.prize_type === 'back_9'),
          twos_winners: twosWinners
        });
      }
      
      // Load RSVP status for identified member
      if (member && e?.id) {
        fetch('/api/rsvps').then(r => r.json()).then(rsvps => {
          const memberRsvp = rsvps?.find((r: any) => r.member_id === member.id && r.event_id === e.id);
          if (memberRsvp) {
            setRsvpStatus(memberRsvp.status);
          }
        });

        // Load tee time
        fetch(`/api/tee-times/${e.id}`).then(r => r.json()).then(times => {
          const memberTime = times?.find((t: any) => 
            t.players.some((p: any) => p.member_id === member.id)
          );
          if (memberTime) {
            setMyTeeTime({
              group_number: memberTime.group_number,
              tee_time: memberTime.tee_time,
              players: memberTime.players.map((p: any) => p.name)
            });
          }
        });
      }
      
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [member]);

  // Update countdown
  useEffect(() => {
    if (!event?.date) return;
    const updateCountdown = () => {
      try {
        const now = new Date();
        // Use member's tee time if available, otherwise use event's first tee
        let eventDateTime = new Date(event.date);
        const teeTimeToUse = memberTeeTime || event.first_tee;
        if (teeTimeToUse) {
          const [hours, minutes] = teeTimeToUse.split(':');
          eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        if (isNaN(eventDateTime.getTime())) {
          setCountdown('Soon');
          return;
        }
      const diff = eventDateTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Event day!');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
      } catch (e) {
        console.error('Countdown error:', e);
        setCountdown('Soon');
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event?.date, memberTeeTime]);

  const handleRsvp = async (status: 'confirmed' | 'declined') => {
    if (!member || !event) return;
    
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          member_id: member.id,
          status
        })
      });
      
      if (response.ok) {
        setRsvpStatus(status);
      }
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fairway-900 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-2xl mr-3">🏌️</div>
          <div>
            <p className="text-lg font-bold text-gray-900">Hi {member?.name || 'Guest'}! 👋</p>
            <p className="text-sm text-gray-600">Aer Lingus Golf Society • 2026</p>
          </div>
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
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Logout"
        >
          🚪
        </button>
      </div>

      {/* Tee Time Card */}
      {myTeeTime && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-800">⏰ YOUR TEE TIME</p>
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
              Group {myTeeTime.group_number}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 mb-1">{myTeeTime.tee_time}</p>
          <p className="text-sm text-green-700">Playing with:</p>
          <p className="text-sm font-medium text-green-900">{myTeeTime.players.join(', ')}</p>
        </div>
      )}

      {/* Season Progress & GOTY Leader */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">🏆</span>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Season Progress</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {seasonInfo?.events_complete || 0} of {seasonInfo?.total_events || 8}
          </p>
          <p className="text-xs text-gray-500">events played</p>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">🏆</span>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">GOTY Leader</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{oomLeader?.name || 'TBD'}</p>
          <p className="text-xs text-gray-500">
            {oomLeader?.total_points ? `${oomLeader.total_points} pts (best 6)` : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Next Event */}
      {event && (
        <div className="bg-green-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold uppercase tracking-wide opacity-90">Your Next Event</p>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              {event.course_name}
            </span>
          </div>
          
          <p className="text-2xl font-bold mb-1">{event.name}</p>
          <div className="flex items-center mb-4">
            <span className="text-lg mr-2">📍</span>
            <span className="text-sm">{event.course_name}</span>
          </div>

          <div className="bg-green-500 rounded-lg p-4 mb-4 text-center">
            <p className="text-3xl font-bold">{countdown}</p>
            <p className="text-sm opacity-90">until first tee</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-lg mr-2">👥</span>
              <span className="text-sm">{event.confirmed_count} confirmed</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">📅</span>
              <span className="text-sm">{(() => {
                try {
                  if (!event?.date) return 'TBD';
                  const d = new Date(event.date);
                  if (isNaN(d.getTime())) return 'TBD';
                  return d.toLocaleDateString('en-GB', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  });
                } catch (e) {
                  return 'TBD';
                }
              })()}</span>
            </div>
          </div>

          {member && (
            <div className="flex gap-3">
              <button
                onClick={() => handleRsvp('confirmed')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  rsvpStatus === 'confirmed'
                    ? 'bg-white text-green-600'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                {rsvpStatus === 'confirmed' ? "✅ You're In!" : "✅ I'm In!"}
              </button>
              <button
                onClick={() => handleRsvp('declined')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  rsvpStatus === 'declined'
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white hover:bg-green-400'
                }`}
              >
                {rsvpStatus === 'declined' ? "❌ Can't Make It" : "Can't Make It"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Your Tee Time (only for upcoming/in-progress events) */}
      {event && (event.status === 'upcoming' || event.status === 'in_progress') && (
        <YourTeeTime 
          eventId={event.id} 
          eventName={event.name} 
          eventDate={event.date} 
          onTeeTimeFound={(time) => setMemberTeeTime(time)}
        />
      )}

      {/* Last Event Results */}
      {lastEventData && lastEventData.leaderboard && lastEventData.leaderboard.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-lg mr-2">🏆</span>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Event Results</p>
            </div>
            <Link href="/results" className="text-xs text-blue-600 font-medium">
              View All Results →
            </Link>
          </div>
          
          <p className="font-bold text-gray-900 mb-1">{lastEventData.event_name}</p>
          <p className="text-xs text-gray-500 mb-3">{(() => {
            try {
              if (!lastEventData.event_date) return '';
              const d = new Date(lastEventData.event_date);
              if (isNaN(d.getTime())) return lastEventData.event_date;
              return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) {
              return lastEventData.event_date || '';
            }
          })()}</p>

          <div className="space-y-2">
            {lastEventData.leaderboard.slice(0, 3).map((player, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 mr-3">
                    {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{player.member_name || player.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">({player.handicap})</span>
                  <span className="text-sm font-bold text-gray-900">{player.total_points} pts</span>
                </div>
              </div>
            ))}

            {/* Front 9 and Back 9 winners */}
            <div className="border-t pt-2 mt-3 grid grid-cols-2 gap-4 text-xs">
              {lastEventData.front9_winner && (
                <div>
                  <p className="text-gray-600 font-medium">Front 9</p>
                  <p className="font-bold text-gray-900">{lastEventData.front9_winner.member_name}</p>
                  <p className="text-gray-500">{lastEventData.front9_winner.label?.match(/\d+ pts/)?.[0] || ''}</p>
                </div>
              )}
              {lastEventData.back9_winner && (
                <div>
                  <p className="text-gray-600 font-medium">Back 9</p>
                  <p className="font-bold text-gray-900">{lastEventData.back9_winner.member_name}</p>
                  <p className="text-gray-500">{lastEventData.back9_winner.label?.match(/\d+ pts/)?.[0] || ''}</p>
                </div>
              )}
            </div>

            {/* Twos winners */}
            {lastEventData.twos_winners && lastEventData.twos_winners.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-gray-600 font-medium text-xs mb-2">🎯 Twos ({lastEventData.twos_winners.length})</p>
                <div className="space-y-1">
                  {lastEventData.twos_winners.map((winner, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-900">{winner.name}</span>
                      <span className="text-gray-500">Hole {winner.hole_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Icons Row */}
      <div className="flex justify-center space-x-8 mt-8">
        <Link href="/calendar" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-1 shadow-sm">
            <span className="text-xl">📅</span>
          </div>
          <span className="text-xs text-gray-600">Calendar</span>
        </Link>
        
        <Link href="/results" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-1 shadow-sm">
            <span className="text-xl">📊</span>
          </div>
          <span className="text-xs text-gray-600">Results</span>
        </Link>
        
        <Link href="/goty" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-1 shadow-sm">
            <span className="text-xl">🏆</span>
          </div>
          <span className="text-xs text-gray-600">GOTY</span>
        </Link>
        
        <Link href="/member-handicap" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-1 shadow-sm">
            <span className="text-xl">📊</span>
          </div>
          <span className="text-xs text-gray-600">My H/C</span>
        </Link>
      </div>

      {/* Discreet Admin Access */}
      <div className="flex justify-center mt-6 mb-4">
        <Link href="/admin" className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-sm">⚙️</span>
          </div>
          <span className="text-xs text-gray-400 mt-1">Admin</span>
        </Link>
      </div>
    </div>
  );
}