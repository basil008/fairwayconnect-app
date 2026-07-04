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
      setPrizes(data.results || []);
      if (data.event) {
        setEventName(data.event.name);
        setEventDate(data.event.date);
        setCourseName(data.event.course_name);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const shareWhatsApp = () => {
    let text = `🏆 ${eventName} Results\n📍 ${courseName}\n📅 ${new Date(eventDate + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    prizes.forEach(p => { text += `${p.label}\n`; });
    text += '\n⛳ FairwayConnect';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

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

      <button onClick={shareWhatsApp}
        className="w-full bg-green-600 text-white rounded-2xl py-3 font-bold text-sm mt-4">
        📱 Share via WhatsApp
      </button>

      <Link href="/calendar" className="block w-full text-center bg-white border border-gray-200 text-gray-700 rounded-2xl py-3 font-bold text-sm mt-3">
        📅 View Calendar
      </Link>
    </div>
  );
}
