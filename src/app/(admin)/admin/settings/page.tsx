'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

export default function AdminSettingsPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setSettings(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isAuth]);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (checking || !isAuth) return null;

  return (
    <div>
      <AdminHeader title="Settings" onLock={logout} />
      <AdminNav current="/admin/settings" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-6">
            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-fairway-800 to-fairway-900 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">⛳ Golf Courses</h3>
                    <p className="text-fairway-200 text-sm">Add and manage golf courses</p>
                  </div>
                  <a href="/admin/courses" 
                    className="bg-white text-fairway-800 px-6 py-2.5 rounded-xl font-medium hover:bg-fairway-50 transition-colors text-center mt-4">
                    Manage Courses →
                  </a>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">📋 Course Scorecards</h3>
                    <p className="text-green-200 text-sm">Create master scorecards with tee/slope/CR</p>
                  </div>
                  <a href="/admin/scorecards" 
                    className="bg-white text-green-800 px-6 py-2.5 rounded-xl font-medium hover:bg-green-50 transition-colors text-center mt-4">
                    Manage Scorecards →
                  </a>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">📊 Member Engagement</h3>
                    <p className="text-blue-200 text-sm">Track app usage and member activity</p>
                  </div>
                  <a href="/admin/engagement" 
                    className="bg-white text-blue-700 px-6 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors text-center mt-4">
                    View Engagement →
                  </a>
                </div>
              </div>
            </div>

            {/* Society Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Society Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Society Name</label>
                  <input value={settings.society_name || ''} onChange={e => updateSetting('society_name', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* PIN */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">🔒 Admin PIN</h3>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">PIN Code</label>
                <input value={settings.admin_pin || ''} onChange={e => updateSetting('admin_pin', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none max-w-xs"
                  maxLength={6} />
                <p className="text-xs text-gray-400 mt-1">Used to access the committee admin area</p>
              </div>
            </div>

            {/* Committee */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">👥 Committee Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Captain</label>
                  <input value={settings.captain || ''} onChange={e => updateSetting('captain', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Secretary</label>
                  <input value={settings.secretary || ''} onChange={e => updateSetting('secretary', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Treasurer</label>
                  <input value={settings.treasurer || ''} onChange={e => updateSetting('treasurer', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Defaults */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">⛳ Default Event Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Default Format</label>
                  <select value={settings.default_format || 'Stableford'} onChange={e => updateSetting('default_format', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                    {['Stableford', 'Strokeplay', 'Best Ball', 'Scramble', 'Matchplay'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Default Entry Fee (€)</label>
                  <input type="number" value={settings.default_fee || '60'} onChange={e => updateSetting('default_fee', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Handicap Deductions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">🏆 Handicap Deductions</h3>
              <p className="text-sm text-gray-500 mb-4">Number of shots deducted from handicap when winning a prize</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">1st Place</label>
                  <input type="number" min="0" max="10" value={settings.deduction_1st || '3'} 
                    onChange={e => updateSetting('deduction_1st', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">2nd Place</label>
                  <input type="number" min="0" max="10" value={settings.deduction_2nd || '2'} 
                    onChange={e => updateSetting('deduction_2nd', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">3rd Place</label>
                  <input type="number" min="0" max="10" value={settings.deduction_3rd || '2'} 
                    onChange={e => updateSetting('deduction_3rd', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Front 9</label>
                  <input type="number" min="0" max="10" value={settings.deduction_front9 || '1'} 
                    onChange={e => updateSetting('deduction_front9', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Back 9</label>
                  <input type="number" min="0" max="10" value={settings.deduction_back9 || '1'} 
                    onChange={e => updateSetting('deduction_back9', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Applied automatically when results are finalised. If a player wins multiple prizes, only the highest deduction applies.</p>
            </div>

            {/* Member Score Entry */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">📝 Member Score Entry</h3>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Allow members to enter their own scores?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateSetting('member_score_entry', 'enabled')}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
                      settings.member_score_entry !== 'disabled'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✅ Enabled
                  </button>
                  <button
                    onClick={() => updateSetting('member_score_entry', 'disabled')}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
                      settings.member_score_entry === 'disabled'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🔒 Disabled
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  When disabled, only committee members can enter scores through the admin area.
                </p>
              </div>
            </div>

            {/* Notifications placeholder */}
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">🔔 Notification Preferences — Coming Soon</p>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="bg-fairway-900 text-white px-8 py-3 rounded-xl font-medium text-sm disabled:opacity-50">
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
