'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Prize {
  prize_type: string; position: number; label: string; value: number;
  member_name: string; handicap: number;
}

export default function ResultsPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/results').then(r => r.json()).then(data => {
      const rawPrizes = data.results || [];
      const event = data.event;
      
      // Check if this is Captain's Prize or President's Prize (special ordering)
      const isSpecialPrize = event?.name?.includes("Captain") || event?.name?.includes("President");
      
      // Sort prizes with special ordering for Captain's/President's Prize
      const sortedPrizes = isSpecialPrize ? [...rawPrizes].sort((a, b) => {
        // Special order: 1st Overall, 2nd Overall, Class prizes, 3rd Overall, Other prizes
        const getOrder = (prize: Prize) => {
          if (prize.prize_type === 'overall' && prize.position === 1) return 1;
          if (prize.prize_type === 'overall' && prize.position === 2) return 2;
          if (prize.prize_type === 'class_1' || prize.prize_type === 'class_2' || prize.prize_type === 'class') return 3;
          if (prize.prize_type === 'overall' && prize.position === 3) return 4;
          if (prize.prize_type === 'third_overall') return 4; // Handle 3rd overall as separate type
          return 5; // All other prizes (NTP, Longest Drive, Twos, Visitors)
        };
        const orderA = getOrder(a);
        const orderB = getOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        // Within class prizes, sort by position then class
        if (orderA === 3 && orderB === 3) {
          if (a.position !== b.position) return (a.position || 0) - (b.position || 0);
          return a.prize_type === 'class_1' ? -1 : 1;
        }
        // Within same group, sort by position
        return (a.position || 0) - (b.position || 0);
      }) : rawPrizes; // Regular events: use original order
      
      setPrizes(sortedPrizes);
      if (event) {
        setEventName(event.name);
        setEventDate(event.date);
        setCourseName(event.course_name);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // WhatsApp share removed - admin only feature

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Latest Results</h1>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (prizes.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">🎖️</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No Results Yet</h1>
        <p className="text-sm text-gray-500 mb-4">Results will appear here after the first event.</p>
        <Link href="/calendar" className="text-sm text-fairway-800 font-medium">
          📅 View Calendar →
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{eventName}</h1>
      <p className="text-sm text-gray-500 mb-4">
        📍 {courseName} · {new Date(eventDate + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long' })}
      </p>

      {/* All Prizes in Order */}
      <div className="space-y-2 mb-4">
        {prizes.map((p, i) => (
          <div key={i} className={`bg-white rounded-xl p-4 shadow-sm ${
            p.prize_type === 'overall' && p.position === 1 ? 'ring-2 ring-yellow-400' : ''
          }`}>
            <p className="font-bold text-gray-900">{p.label}</p>
            {p.value > 0 && <p className="text-sm text-fairway-800">€{p.value} prize</p>}
          </div>
        ))}
      </div>

      {/* WhatsApp share button removed - admin only */}

      <Link href="/calendar" className="block w-full text-center bg-white border border-gray-200 text-gray-700 rounded-2xl py-3 font-bold text-sm mt-3">
        📅 View Calendar
      </Link>
    </div>
  );
}
