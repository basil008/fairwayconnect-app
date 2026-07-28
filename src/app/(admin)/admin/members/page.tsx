'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Member {
  id: string; name: string; handicap: number; email: string; phone: string;
  member_type: string; status: string; joined_date: string; created_at: string;
  access_token: string | null;
  member_pin: string | null;
}

export default function AdminMembersPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'visitors'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', handicap: 18, email: '', phone: '', member_type: 'member', member_pin: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState(false);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3334';
  };

  const getMemberLink = (token: string | null) => {
    if (!token) return '';
    return `${getBaseUrl()}/m/${token}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const copyAllLinks = async () => {
    const activeMembers = members.filter(m => m.member_type !== 'visitor' && m.status !== 'inactive' && m.access_token);
    const lines = activeMembers.map(m => `${m.name}: Link: ${getMemberLink(m.access_token)} | PIN: ${m.member_pin || '—'}`);
    const text = `🔗 FairwayConnect — Member Access Details\n\n${lines.join('\n')}`;
    await copyToClipboard(text, 'all');
  };

  const downloadCSV = () => {
    const activeMembers = members.filter(m => m.member_type !== 'visitor' && m.status !== 'inactive' && m.access_token);
    const csvHeader = 'Name,Link,PIN\n';
    const csvRows = activeMembers.map(m => `"${m.name}","${getMemberLink(m.access_token)}","${m.member_pin || ''}"`).join('\n');
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fairwayconnect-members.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const loadMembers = () => {
    fetch('/api/members').then(r => r.json()).then(data => {
      setMembers(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { if (isAuth) loadMembers(); }, [isAuth]);

  const handleSave = async () => {
    setSaving(true);
    if (editId) {
      await fetch('/api/members/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...form }),
      });
    } else {
      await fetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowAdd(false);
    setEditId(null);
    setForm({ name: '', handicap: 18, email: '', phone: '', member_type: 'member', member_pin: '' });
    loadMembers();
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this member?')) return;
    await fetch('/api/members/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadMembers();
  };

  const startEdit = (m: Member) => {
    setEditId(m.id);
    setForm({ name: m.name, handicap: m.handicap, email: m.email || '', phone: m.phone || '', member_type: m.member_type, member_pin: m.member_pin || '' });
    setShowAdd(true);
  };

  if (checking || !isAuth) return null;

  const filtered = members.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active') return m.member_type !== 'visitor' && m.status !== 'inactive';
    if (filter === 'inactive') return m.status === 'inactive';
    if (filter === 'visitors') return m.member_type === 'visitor';
    return true;
  });

  return (
    <div>
      <AdminHeader title="Members" onLock={logout} />
      <AdminNav current="/admin/members" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{members.length} Members</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowLinks(!showLinks)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${showLinks ? 'bg-fairway-50 border-fairway-800 text-fairway-900' : 'border-gray-200 text-gray-700'}`}>
              🔗 Links
            </button>
            <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', handicap: 18, email: '', phone: '', member_type: 'member', member_pin: '' }); }}
              className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium">
              + Add Member
            </button>
          </div>
        </div>

        {/* Personal Links Section */}
        {showLinks && (
          <div className="bg-fairway-50 border border-fairway-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-fairway-900">🔗 Personal Member Links</h3>
                <p className="text-xs text-gray-500 mt-0.5">Share these with members for personalised access</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyAllLinks}
                  className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  {copied === 'all' ? '✅ Copied!' : '📋 Copy All Links'}
                </button>
                <button
                  onClick={downloadCSV}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  📄 Download CSV
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl max-h-60 overflow-y-auto divide-y divide-gray-50">
              {members.filter(m => m.access_token && m.member_type !== 'visitor').map(m => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{getMemberLink(m.access_token)}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getMemberLink(m.access_token), m.id)}
                    className="ml-2 text-xs font-medium text-fairway-800 bg-fairway-50 px-3 py-1 rounded-lg flex-shrink-0"
                  >
                    {copied === m.id ? '✅' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex gap-2 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-fairway-800 focus:outline-none" />
          <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="visitors">Visitors</option>
          </select>
        </div>

        {/* Add/Edit Form */}
        {showAdd && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">{editId ? 'Edit Member' : 'New Member'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Handicap Index *</label>
                <input type="number" step="0.1" min="0" max="54" value={form.handicap} onChange={e => setForm({ ...form, handicap: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" placeholder="e.g. 18.4" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mobile</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                <select value={form.member_type} onChange={e => setForm({ ...form, member_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="member">Member</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">PIN (4 digits)</label>
                <input type="text" maxLength={4} pattern="[0-9]*" value={form.member_pin || ''} 
                  onChange={e => setForm({ ...form, member_pin: e.target.value.replace(/\D/g, '') })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" 
                  placeholder="e.g. 1234" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={saving || !form.name}
                className="bg-fairway-900 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Update' : 'Add Member'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* CSV Import placeholder */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-gray-400">📥 CSV Import — Coming Soon</p>
        </div>

        {/* Members Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs">
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-center px-2 py-2">Hcp</th>
                    <th className="text-left px-2 py-2 hidden md:table-cell">Email</th>
                    <th className="text-center px-2 py-2">Type</th>
                    <th className="text-center px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} className={`${i > 0 ? 'border-t border-gray-50' : ''} ${m.status === 'inactive' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{m.name}</span>
                        {m.access_token && (
                          <span className="ml-1 text-[10px] text-gray-400">🔗</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center">{m.handicap}</td>
                      <td className="px-2 py-2.5 hidden md:table-cell text-gray-500 text-xs">{m.email}</td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.member_type === 'visitor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>{m.member_type}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => startEdit(m)} className="text-xs text-fairway-800 font-medium mr-2">Edit</button>
                        <button onClick={() => handleDeactivate(m.id)} className="text-xs text-red-500 font-medium">Deactivate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
