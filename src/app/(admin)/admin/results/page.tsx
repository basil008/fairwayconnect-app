'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Prize {
  prize_type: string; label: string; value: number; member_name: string;
}

export default function AdminResultsPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventId, setEventId] = useState('');
  const [eventStatus, setEventStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/results').then(r => r.json()).then(data => {
      setPrizes(data.results || []);
      if (data.event) {
        setEventName(data.event.name);
        setEventId(data.event.id);
        setEventStatus(data.event.status);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { if (isAuth) loadData(); }, [isAuth]);

  const handleFinalise = async () => {
    if (!confirm('Finalise and publish results?')) return;
    await fetch('/api/finalise', { method: 'POST' });
    loadData();
  };

  const shareWhatsApp = async () => {
    try {
      // Fetch fresh data with proper event details
      const response = await fetch(`/api/events/${eventId}/results`);
      const data = await response.json();
      
      // Build message using fetched data
      let text = `🏆 Aer Lingus Golf Society Results\n`;
      
      if (data.event?.course_name) {
        text += `📍 ${data.event.course_name}\n`;
      }
      
      if (data.event?.date) {
        const dateObj = new Date(data.event.date + 'T12:00:00');
        text += `📅 ${dateObj.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
      }
      
      text += '\n';
      
      // Use pre-formatted labels from API (they already have emojis)
      if (data.prizes) {
        data.prizes.forEach((p: any) => {
          text += `${p.label}\n`;
        });
      }
      
      text += '\n⛳ FairwayConnect';
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (error: any) {
      console.error('WhatsApp share error:', error);
    }
  };

  if (checking || !isAuth) return null;

  return (
    <div>
      <AdminHeader title="Results" onLock={logout} />
      <AdminNav current="/admin/results" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{eventName || 'No event selected'}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Status: <span className="font-bold uppercase">{eventStatus || 'N/A'}</span>
        </p>

        {loading ? (
          <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        ) : prizes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm mb-4">
            <span className="text-4xl block mb-3">🏆</span>
            <p className="text-gray-500 mb-4">No results yet. Finalise the event to generate results.</p>
            <button onClick={handleFinalise}
              className="bg-fairway-900 text-white px-6 py-3 rounded-xl font-medium text-sm">
              Finalise & Publish Results
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {prizes.map((p, i) => (
                <div key={i} className={`bg-white rounded-xl p-4 shadow-sm ${
                  p.prize_type === 'overall' && i === 0 ? 'ring-2 ring-yellow-400' : ''
                }`}>
                  <p className="font-bold text-gray-900">{p.label}</p>
                  {p.value > 0 && <p className="text-sm text-fairway-800">€{p.value}</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={shareWhatsApp}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm">
                📱 Share via WhatsApp
              </button>
              <button onClick={() => window.print()}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm">
                🖨️ Print Results
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
