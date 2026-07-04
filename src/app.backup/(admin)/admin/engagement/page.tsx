'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface MemberEngagement {
  name: string;
  member_pin: string;
  last_login_at: string | null;
  login_count: number;
  first_login_at: string | null;
  self_rsvp_count: number;
  admin_rsvp_count: number;
  engagement_level: 'High' | 'Medium' | 'Low' | 'None';
}

interface Stats {
  total_members: number;
  logged_in: number;
  never_logged_in: number;
  total_rsvps: number;
  self_service_rsvps: number;
  admin_created_rsvps: number;
}

export default function EngagementPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [members, setMembers] = useState<MemberEngagement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'none'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) return;
    loadData();
  }, [isAuth]);

  const loadData = async () => {
    try {
      const [membersRes, statsRes] = await Promise.all([
        fetch('/api/admin/engagement/members'),
        fetch('/api/admin/engagement/stats')
      ]);
      
      const membersData = await membersRes.json();
      const statsData = await statsRes.json();
      
      setMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    if (filter === 'all') return true;
    return m.engagement_level.toLowerCase() === filter;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getEngagementBadge = (level: string) => {
    switch (level) {
      case 'High': return '🟢 High';
      case 'Medium': return '🟡 Medium';
      case 'Low': return '🟠 Low';
      default: return '🔴 None';
    }
  };

  if (checking || !isAuth) return null;
  
  if (loading) {
    return (
      <div>
        <AdminHeader title="Member Engagement" onLock={logout} />
        <AdminNav current="/admin/engagement" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Member Engagement" onLock={logout} />
      <AdminNav current="/admin/engagement" />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-900">📊 Member Engagement</h1>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-gray-600 text-sm mb-2">Total Members</div>
              <div className="text-4xl font-bold text-green-600">{stats.total_members}</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.logged_in} active ({Math.round((stats.logged_in / stats.total_members) * 100)}%)
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-gray-600 text-sm mb-2">App Logins</div>
              <div className="text-4xl font-bold text-blue-600">{stats.logged_in}</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.never_logged_in} never logged in
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-gray-600 text-sm mb-2">Self-Service RSVPs</div>
              <div className="text-4xl font-bold text-purple-600">
                {stats.total_rsvps > 0 
                  ? Math.round((stats.self_service_rsvps / stats.total_rsvps) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.self_service_rsvps} of {stats.total_rsvps} RSVPs
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All Members ({members.length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg ${filter === 'high' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🟢 High ({members.filter(m => m.engagement_level === 'High').length})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-4 py-2 rounded-lg ${filter === 'medium' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🟡 Medium ({members.filter(m => m.engagement_level === 'Medium').length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg ${filter === 'low' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🟠 Low ({members.filter(m => m.engagement_level === 'Low').length})
            </button>
            <button
              onClick={() => setFilter('none')}
              className={`px-4 py-2 rounded-lg ${filter === 'none' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🔴 None ({members.filter(m => m.engagement_level === 'None').length})
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Member</th>
                <th className="px-6 py-3 text-left">Last Login</th>
                <th className="px-6 py-3 text-center">Logins</th>
                <th className="px-6 py-3 text-center">Self-RSVPs</th>
                <th className="px-6 py-3 text-center">Admin-RSVPs</th>
                <th className="px-6 py-3 text-center">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => (
                <tr key={member.member_pin} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">PIN: {member.member_pin}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={member.last_login_at ? 'text-gray-900' : 'text-gray-400'}>
                      {formatDate(member.last_login_at)}
                    </div>
                    {member.first_login_at && (
                      <div className="text-xs text-gray-500">
                        First: {new Date(member.first_login_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-semibold text-gray-900">{member.login_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-semibold text-green-600">{member.self_rsvp_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-semibold text-orange-600">{member.admin_rsvp_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold">
                      {getEngagementBadge(member.engagement_level)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No members match this filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
