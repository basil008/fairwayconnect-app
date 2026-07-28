'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface DashboardData {
  season: { events_complete: number; total_events: number } | null;
  currentEvent: Record<string, unknown> | null;
  totalMembers: number;
  revenue: { collected: number; outstanding: number };
  oomLeader: { name: string; total_points: number } | null;
  alerts: Array<{ type: string; message: string; link?: string }>;
}

export default function AdminDashboard() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) return;
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isAuth]);

  if (checking || !isAuth) return null;

  const evt = data?.currentEvent;
  const statusActions: Record<string, Array<{ label: string; href: string }>> = {
    upcoming: [
      { label: '📝 Edit Event', href: `/admin/event/${evt?.id}` },
    ],
    in_progress: [
      { label: '📊 Monitor Scores', href: '/admin/scoring' },
      { label: '🏆 Finalise Results', href: '/admin/results' },
    ],
    finalised: [
      { label: '📋 View Results', href: '/admin/results' },
    ],
  };

  return (
    <div>
      <AdminHeader title="Committee Dashboard" onLock={logout} />
      <AdminNav current="/admin/dashboard" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        ) : data && (
          <>
            {/* Alerts */}
            {data.alerts.length > 0 && (
              <div className="space-y-2 mb-6">
                {data.alerts.map((alert, i) => (
                  <div key={i} className={`rounded-xl p-3 flex items-center gap-3 ${
                    alert.type === 'danger' ? 'bg-red-50 border border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}>
                    <span>{alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '🟡' : '🟢'}</span>
                    <p className="text-sm flex-1">{alert.message}</p>
                    {alert.link && (
                      <Link href={alert.link} className="text-xs font-medium text-fairway-800">View →</Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TWO MAIN ACTIONS */}
            {evt && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Manage Event */}
                <Link href={`/admin/event/${evt.id}`}
                  className="bg-fairway-900 text-white rounded-2xl p-6 shadow-lg hover:bg-fairway-800 transition-colors">
                  <div className="text-4xl mb-3">⚙️</div>
                  <h2 className="text-xl font-bold mb-1">Manage Event</h2>
                  <p className="text-fairway-200 text-sm mb-3">Setup, tee times, RSVPs, scoring</p>
                  <div className="bg-white/20 rounded-xl px-3 py-2 inline-block">
                    <p className="text-xs font-medium">{evt.name as string}</p>
                    <p className="text-[10px] opacity-75">{evt.course_name as string} · {evt.date as string}</p>
                  </div>
                </Link>

                {/* Publish Scores */}
                <Link href="/admin/publish"
                  className={`rounded-2xl p-6 shadow-lg transition-colors ${
                    evt.status === 'in_progress' 
                      ? 'bg-amber-500 text-white hover:bg-amber-600' 
                      : evt.status === 'finalised'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                  <div className="text-4xl mb-3">📢</div>
                  <h2 className="text-xl font-bold mb-1">Publish Scores</h2>
                  <p className={`text-sm mb-3 ${evt.status === 'finalised' ? 'text-green-100' : evt.status === 'in_progress' ? 'text-amber-100' : 'text-gray-400'}`}>
                    {evt.status === 'finalised' ? 'Results published ✓' : evt.status === 'in_progress' ? 'Review & release results' : 'Available after event'}
                  </p>
                  <div className={`rounded-xl px-3 py-2 inline-block ${
                    evt.status === 'in_progress' ? 'bg-white/20' : evt.status === 'finalised' ? 'bg-white/20' : 'bg-gray-300'
                  }`}>
                    <p className="text-xs font-medium">
                      {evt.status === 'in_progress' ? '🟡 Scores being entered' : evt.status === 'finalised' ? '✅ Published' : '⏳ Event not started'}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Event Summary */}
            {evt && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Event Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    evt.status === 'in_progress' ? 'bg-red-100 text-red-800' :
                    evt.status === 'finalised' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{evt.status as string}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-fairway-900">{evt.confirmed_count as number}</p>
                    <p className="text-[10px] text-gray-500">Confirmed</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{evt.maybe_count as number}</p>
                    <p className="text-[10px] text-gray-500">Maybe</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">€{evt.entry_fee as number}</p>
                    <p className="text-[10px] text-gray-500">Entry Fee</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">📅 Season Progress</p>
                <p className="text-2xl font-bold text-fairway-900 mt-1">
                  {data.season?.events_complete || 0} / {data.season?.total_events || 12}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div className="bg-fairway-900 rounded-full h-1.5" style={{
                    width: `${((data.season?.events_complete || 0) / (data.season?.total_events || 12)) * 100}%`
                  }} />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">👥 Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalMembers}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">💰 Collected</p>
                <p className="text-2xl font-bold text-green-700 mt-1">€{data.revenue.collected.toLocaleString()}</p>
              </div>
              {data.oomLeader && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500">🏆 GOTY Leader</p>
                  <p className="text-sm font-bold text-fairway-900 mt-1 truncate">{data.oomLeader.name}</p>
                  <p className="text-xs text-gray-400">{data.oomLeader.total_points} pts</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: '/admin/season', icon: '📅', label: 'Calendar' },
                { href: '/admin/members', icon: '👥', label: 'Members' },
                { href: '/admin/handicaps', icon: '⛳', label: 'Handicaps' },
                { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-shadow">
                  <span className="text-2xl block mb-1">{link.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{link.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
