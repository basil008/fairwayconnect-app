'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Member {
  id: string; name: string; handicap: number; member_type: string;
}

export default function AdminHandicapsPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuth) return;
    fetch('/api/members').then(r => r.json()).then(data => {
      setMembers((data || []).filter((m: Member) => m.member_type === 'member'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isAuth]);

  const handleSave = async (id: string, handicap: number) => {
    await fetch('/api/members/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, handicap }),
    });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, handicap } : m));
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  if (checking || !isAuth) return null;

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <AdminHeader title="Handicaps" onLock={logout} />
      <AdminNav current="/admin/handicaps" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:border-fairway-800 focus:outline-none" />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-center px-2 py-2">Current Hcp</th>
                  <th className="text-center px-2 py-2">Adjust</th>
                  <th className="text-center px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={i > 0 ? 'border-t border-gray-50' : ''}>
                    <td className="px-4 py-2.5 font-medium">{m.name}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-fairway-900">{m.handicap}</td>
                    <td className="px-2 py-2.5 text-center">
                      <input type="number" value={edits[m.id] ?? m.handicap}
                        onChange={e => setEdits({ ...edits, [m.id]: Number(e.target.value) })}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:border-fairway-800 focus:outline-none" />
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {edits[m.id] !== undefined && edits[m.id] !== m.handicap && (
                        <button onClick={() => handleSave(m.id, edits[m.id])}
                          className="bg-fairway-900 text-white px-3 py-1 rounded-lg text-xs font-medium">Save</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
