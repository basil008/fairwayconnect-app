'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface HandicapChange {
  id: string;
  sync_date: string;
  member_id: string;
  member_name: string;
  old_handicap: number;
  new_handicap: number;
  change_amount: number;
  source: string;
  notes: string | null;
}

export default function AdminHandicapChangesPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [changes, setChanges] = useState<HandicapChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => {
    if (isAuth) {
      loadChanges();
    }
  }, [isAuth, flaggedOnly]);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/handicap-changes?flagged=${flaggedOnly}`);
      if (res.ok) {
        const data = await res.json();
        setChanges(data.changes || []);
      }
    } catch (err) {
      console.error('Failed to load changes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checking || !isAuth) return null;

  return (
    <div>
      <AdminHeader title="Handicap Changes" onLock={logout} />
      <AdminNav current="/admin/handicap-changes" />

      <div className="max-w-6xl mx-auto p-6">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
              className="mr-3 h-5 w-5 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Show only flagged changes (&gt;2 shots)
            </span>
          </label>
        </div>

        {/* Changes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Old H/C
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New H/C
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : changes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {flaggedOnly ? 'No flagged changes' : 'No handicap changes yet'}
                    </td>
                  </tr>
                ) : (
                  changes.map((change) => {
                    const date = new Date(change.sync_date);
                    const isIncrease = change.change_amount > 0;
                    const isFlagged = Math.abs(change.change_amount) > 2;

                    return (
                      <tr key={change.id} className={isFlagged ? 'bg-amber-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {date.toLocaleDateString('en-IE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <div className="text-xs text-gray-500">
                            {date.toLocaleTimeString('en-IE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {change.member_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {change.old_handicap.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {change.new_handicap.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isIncrease 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isIncrease ? '+' : ''}{change.change_amount.toFixed(1)}
                          </span>
                          {isFlagged && (
                            <span className="ml-2 text-amber-600">⚠️</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {change.source === 'member_self_service' ? 'Member' : 
                           change.source === 'admin_override' ? 'Admin' :
                           change.source === 'gui_auto' ? 'GUI Auto' : change.source}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {change.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        {!loading && changes.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {changes.length}
                </div>
                <div className="text-sm text-gray-600">Total Changes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {changes.filter(c => Math.abs(c.change_amount) > 2).length}
                </div>
                <div className="text-sm text-gray-600">Flagged (&gt;2)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {changes.filter(c => c.change_amount < 0).length}
                </div>
                <div className="text-sm text-gray-600">Decreased</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
