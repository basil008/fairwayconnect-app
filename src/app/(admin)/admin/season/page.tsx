'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Event {
  id: string; name: string; course_name: string; date: string; format: string;
  entry_fee: number; first_tee: string; status: string; event_number: number;
  location: string; confirmed_count: number;
}

export default function AdminSeasonPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', course_name: '', location: '', date: '', first_tee: '09:30',
    format: 'Stableford', entry_fee: 60, prize_fund: 0, notes: '',
  });
  const [saving, setSaving] = useState(false);

  const loadEvents = () => {
    fetch('/api/calendar').then(r => r.json()).then(data => {
      setEvents(data?.events || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { if (isAuth) loadEvents(); }, [isAuth]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch('/api/events/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: '', course_name: '', location: '', date: '', first_tee: '09:30', format: 'Stableford', entry_fee: 60, prize_fund: 0, notes: '' });
      loadEvents();
    } catch { alert('Error creating event'); }
    setSaving(false);
  };

  const handleDelete = async (id: string, eventName: string) => {
    if (!confirm(`Permanently delete "${eventName}"?\n\nThis will remove all RSVPs, scores, and tee times for this event. This cannot be undone.`)) return;
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    loadEvents();
  };

  if (checking || !isAuth) return null;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-red-100 text-red-800',
      finalised: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return styles[status] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div>
      <AdminHeader title="Calendar" onLock={logout} />
      <AdminNav current="/admin/season" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">2026 Season · {events.length} Events</h2>
          <button onClick={() => setShowCreate(!showCreate)}
            className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-fairway-800">
            + Create Event
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">New Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Event Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Course *</label>
                <input value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">First Tee Time</label>
                <input type="time" value={form.first_tee} onChange={e => setForm({ ...form, first_tee: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Format</label>
                <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none">
                  {['Stableford', 'Strokeplay', 'Best Ball', 'Scramble', 'Matchplay', 'Team Event'].map(f => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Entry Fee (€)</label>
                <input type="number" value={form.entry_fee} onChange={e => setForm({ ...form, entry_fee: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Prize Fund (€)</label>
                <input type="number" value={form.prize_fund} onChange={e => setForm({ ...form, prize_fund: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving || !form.name || !form.course_name || !form.date}
                className="bg-fairway-900 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Event'}
              </button>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {events.filter(e => e.status !== 'cancelled').map(event => (
              <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-fairway-50 rounded-xl flex items-center justify-center text-lg font-bold text-fairway-900 flex-shrink-0">
                  {event.event_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm truncate">{event.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{event.course_name} · {event.location}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })} · {event.first_tee} · {event.format} · €{event.entry_fee}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link href={`/admin/event/${event.id}`}
                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm hover:bg-gray-200">
                    ✏️
                  </Link>
                  <button onClick={() => handleDelete(event.id, event.name)}
                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm hover:bg-red-100">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
