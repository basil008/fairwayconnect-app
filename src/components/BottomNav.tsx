'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/member-home', icon: '🏠', label: 'Home' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
  { href: '/scoring', icon: '⛳', label: 'Score' },
  { href: '/leaderboard', icon: '📊', label: 'Live Board' },
  { href: '/goty', icon: '🏆', label: 'GOTY' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 no-print"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive ? 'text-fairway-900' : 'text-gray-400'
              }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-fairway-900 font-bold' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && <span className="w-1 h-1 rounded-full bg-fairway-900 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
