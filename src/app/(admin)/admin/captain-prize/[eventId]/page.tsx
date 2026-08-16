'use client';

import { useEffect, useState } from 'react';
import { useRouter, use } from 'next/navigation';

interface CaptainPrizeConfig {
  event_id: string;
  first_overall_amount: number;
  second_overall_amount: number;
  third_overall_amount: number;
  class1_enabled: boolean;
  class1_name: string;
  class1_handicap_min: number;
  class1_handicap_max: number;
  class1_first_amount: number;
  class1_second_amount: number;
  class2_enabled: boolean;
  class2_name: string;
  class2_handicap_min: number;
  class2_handicap_max: number;
  class2_first_amount: number;
  class2_second_amount: number;
  front9_amount: number;
  back9_amount: number;
  longest_drive_amount: number;
  nearest_pin_amount: number;
}

export default function CaptainPrizeConfigPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [config, setConfig] = useState<CaptainPrizeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/captain-prize?event_id=${resolvedParams.eventId}`);
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/captain-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        alert('✅ Captain\'s Prize configuration saved!');
        router.back();
      } else {
        alert('❌ Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Captain's Prize Configuration</h1>
            <p className="text-gray-600 mt-1">Configure handicap classes and prize amounts</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          
          {/* Overall Prizes */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Overall Prizes</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1st Prize</label>
                <input
                  type="number"
                  value={config.first_overall_amount}
                  onChange={(e) => setConfig({ ...config, first_overall_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2nd Prize</label>
                <input
                  type="number"
                  value={config.second_overall_amount}
                  onChange={(e) => setConfig({ ...config, second_overall_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">3rd Prize</label>
                <input
                  type="number"
                  value={config.third_overall_amount}
                  onChange={(e) => setConfig({ ...config, third_overall_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Class 1 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Class 1</h2>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.class1_enabled}
                  onChange={(e) => setConfig({ ...config, class1_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                <input
                  type="text"
                  value={config.class1_name}
                  onChange={(e) => setConfig({ ...config, class1_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class1_enabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Handicap</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.class1_handicap_min}
                  onChange={(e) => setConfig({ ...config, class1_handicap_min: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class1_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Handicap</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.class1_handicap_max}
                  onChange={(e) => setConfig({ ...config, class1_handicap_max: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class1_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1st Prize</label>
                <input
                  type="number"
                  value={config.class1_first_amount}
                  onChange={(e) => setConfig({ ...config, class1_first_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class1_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2nd Prize</label>
                <input
                  type="number"
                  value={config.class1_second_amount}
                  onChange={(e) => setConfig({ ...config, class1_second_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class1_enabled}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Class 2 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Class 2</h2>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.class2_enabled}
                  onChange={(e) => setConfig({ ...config, class2_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                <input
                  type="text"
                  value={config.class2_name}
                  onChange={(e) => setConfig({ ...config, class2_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class2_enabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Handicap</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.class2_handicap_min}
                  onChange={(e) => setConfig({ ...config, class2_handicap_min: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class2_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Handicap</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.class2_handicap_max}
                  onChange={(e) => setConfig({ ...config, class2_handicap_max: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class2_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1st Prize</label>
                <input
                  type="number"
                  value={config.class2_first_amount}
                  onChange={(e) => setConfig({ ...config, class2_first_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class2_enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2nd Prize</label>
                <input
                  type="number"
                  value={config.class2_second_amount}
                  onChange={(e) => setConfig({ ...config, class2_second_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!config.class2_enabled}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Front 9 / Back 9 */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nine Holes</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Front 9</label>
                <input
                  type="number"
                  value={config.front9_amount}
                  onChange={(e) => setConfig({ ...config, front9_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Back 9</label>
                <input
                  type="number"
                  value={config.back9_amount}
                  onChange={(e) => setConfig({ ...config, back9_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Side Competitions */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Side Competitions</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longest Drive</label>
                <input
                  type="number"
                  value={config.longest_drive_amount}
                  onChange={(e) => setConfig({ ...config, longest_drive_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nearest the Pin</label>
                <input
                  type="number"
                  value={config.nearest_pin_amount}
                  onChange={(e) => setConfig({ ...config, nearest_pin_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
