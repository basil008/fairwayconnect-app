'use client';

import { useEffect, useState } from 'react';
import { useMember } from '@/lib/MemberContext';
import HandicapConfirmation from '@/components/HandicapConfirmation';

interface HandicapChange {
  id: string;
  sync_date: string;
  old_handicap: number;
  new_handicap: number;
  change_amount: number;
  source: string;
  notes: string | null;
}

export default function MemberHandicapPage() {
  const { member, loading } = useMember();
  const [history, setHistory] = useState<HandicapChange[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (member) {
      loadHistory();
    }
  }, [member]);

  const loadHistory = async () => {
    if (!member) return;
    
    try {
      const res = await fetch(`/api/member/${member.id}/handicap-history?limit=3`); // Show last 3 updates only
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirm = async (newHandicap?: number) => {
    if (!member) return;

    const res = await fetch('/api/member/update-handicap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: member.id,
        newHandicap,
        confirmed: !newHandicap
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update');
    }

    const updateData = await res.json();
    
    // Update localStorage (MemberContext keys)
    localStorage.setItem('fc_member_handicap', String(updateData.handicap));
    localStorage.setItem('fc_member_handicap_updated_at', new Date().toISOString());
    
    // Force hard reload to get fresh data
    window.location.replace(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!member) {
    return null; // MemberAuth will handle redirect
  }

  if (showConfirmation) {
    return (
      <HandicapConfirmation
        currentHandicap={member.handicap}
        lastUpdated={member.handicap_updated_at}
        memberName={member.name}
        onConfirm={handleConfirm}
      />
    );
  }

  const daysAgo = member.handicap_updated_at
    ? Math.floor((Date.now() - new Date(member.handicap_updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ My Handicap
          </h1>
          <p className="text-gray-600">
            Manage your WHS Handicap Index
          </p>
        </div>

        {/* Current Handicap */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-600 mb-2">Current Handicap</div>
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {member.handicap.toFixed(1)}
            </div>
            {member.handicap_updated_at && daysAgo !== null && (
              <div className="text-sm text-gray-500">
                Last updated: {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
              </div>
            )}
            {!member.handicap_updated_at && (
              <div className="text-sm text-amber-600">
                ⚠️ Never updated
              </div>
            )}
          </div>

          <button
            onClick={() => setShowConfirmation(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Update Handicap
          </button>
        </div>

        {/* History */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Update History
          </h2>

          {loadingHistory ? (
            <div className="text-center py-8 text-gray-500">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No updates yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((change) => {
                const date = new Date(change.sync_date);
                const isIncrease = change.change_amount > 0;
                
                return (
                  <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {change.old_handicap.toFixed(1)} → {change.new_handicap.toFixed(1)}
                        </div>
                        <div className={`text-sm font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                          {isIncrease ? '+' : ''}{change.change_amount.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {date.toLocaleDateString('en-IE', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    {change.notes && (
                      <div className="text-xs text-amber-600 mt-2">
                        {change.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <a
            href="/member-home"
            className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
