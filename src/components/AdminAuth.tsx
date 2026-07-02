'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // The server middleware is the real gate; this hook just drives the UI.
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => {
        if (s.authenticated && s.role === 'admin') {
          setIsAuth(true);
        } else {
          router.replace('/admin');
        }
      })
      .catch(() => router.replace('/admin'))
      .finally(() => setChecking(false));
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('fairway_remembered_user');
    router.replace('/');
  };

  return { isAuth, checking, logout };
}

export function AdminHeader({ title = 'Admin', onLock }: { title?: string; onLock?: () => void } = {}) {
  return (
    <div className="bg-fairway-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-xs text-fairway-200 opacity-75">Aer Lingus Golf Society</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            // Clear admin session and go to member view
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            window.location.href = '/';
          }}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          🏠 Member View
        </button>
        <button
          onClick={onLock ?? (async () => {
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            window.location.href = '/admin';
          })}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          🔒 Lock
        </button>
      </div>
    </div>
  );
}

export function AdminNav({ current }: { current: string }) {
  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/publish', label: 'Publish', icon: '📢' },
    { href: '/admin/season', label: 'Season', icon: '📅' },
    { href: '/admin/members', label: 'Members', icon: '👥' },
    { href: '/admin/handicaps', label: 'Handicaps', icon: '⛳' },
    { href: '/admin/adj-handicaps', label: 'Adj Hcaps', icon: '📉' },
    { href: '/admin/handicap-changes', label: 'H/C Changes', icon: '🔄' },
    { href: '/admin/merit', label: 'GOTY', icon: '🏆' },
    { href: '/admin/pricing', label: 'Pricing', icon: '💰' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto hide-scrollbar">
      <div className="flex px-2 py-2 gap-1 min-w-max">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              current === link.href
                ? 'bg-fairway-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
