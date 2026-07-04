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

  const overallPrizes = prizes.filter(p => ['overall','class_1','class_2'].includes(p.prize_type));
  const front9Prizes = prizes.filter(p => p.prize_type.includes('front_9'));
  const back9Prizes = prizes.filter(p => p.prize_type.includes('back_9'));
  const ntpPrizes = prizes.filter(p => p.prize_type === 'ntp');
  const ldPrizes = prizes.filter(p => p.prize_type === 'longest_drive');
  const twosPrizes = prizes.filter(p => p.prize_type === 'twos');
  const divisionPrizes = prizes.filter(p => ['division_a', 'division_b', 'best_visitor'].includes(p.prize_type));

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{eventName}</h1>
      <p className="text-sm text-gray-500 mb-4">
        📍 {courseName} · {new Date(eventDate + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'long' })}
      </p>

      {/* Overall */}
      {overallPrizes.length > 0 && (
        <div className="space-y-3 mb-4">
          {overallPrizes.map((p, i) => (
            <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
              <p className="text-lg font-bold text-gray-900">{p.label}</p>
              {p.value > 0 && <p className="text-sm text-fairway-800">€{p.value} prize</p>}
            </div>
          ))}
        </div>
      )}

      {/* Front 9 */}
      {front9Prizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {front9Prizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
              {p.value > 0 && <p className="text-xs text-fairway-800">€{p.value} prize</p>}
            </div>
          ))}
        </div>
      )}

      {/* Back 9 */}
      {back9Prizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {back9Prizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
              {p.value > 0 && <p className="text-xs text-fairway-800">€{p.value} prize</p>}
            </div>
          ))}
        </div>
      )}

      {/* NTP */}
      {ntpPrizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {ntpPrizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Longest Drive */}
      {ldPrizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {ldPrizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Twos */}
      {twosPrizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {twosPrizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Division prizes */}
      {divisionPrizes.length > 0 && (
        <div className="space-y-2 mb-4">
          {divisionPrizes.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{p.label}</p>
            </div>
          ))}
        </div>
      )}

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
