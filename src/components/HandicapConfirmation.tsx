'use client';

import { useState } from 'react';

interface HandicapConfirmationProps {
  currentHandicap: number;
  lastUpdated: string | null;
  memberName: string;
  onConfirm: (newHandicap?: number) => Promise<void>;
}

export default function HandicapConfirmation({
  currentHandicap,
  lastUpdated,
  memberName,
  onConfirm
}: HandicapConfirmationProps) {
  const [mode, setMode] = useState<'confirm' | 'update'>('confirm');
  const [newHandicap, setNewHandicap] = useState(currentHandicap.toString());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const daysAgo = lastUpdated 
    ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm handicap');
    } finally {
      setConfirming(false);
    }
  };

  const handleUpdate = async () => {
    const parsed = parseFloat(newHandicap);
    if (isNaN(parsed) || parsed < 0 || parsed > 54) {
      setError('Please enter a valid handicap between 0 and 54');
      return;
    }

    const change = parsed - currentHandicap;
    if (Math.abs(change) > 5) {
      if (!confirm(`Large change detected (${change > 0 ? '+' : ''}${change.toFixed(1)}). Are you sure this is correct?`)) {
        return;
      }
    }

    setConfirming(true);
    setError('');
    try {
      await onConfirm(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to update handicap');
    } finally {
      setConfirming(false);
    }
  };

  if (mode === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {memberName}! ⛳
          </h2>
          
          <p className="text-gray-600 mb-6">
            Before you can enter your score, please confirm your current handicap
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current Handicap</div>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {currentHandicap.toFixed(1)}
              </div>
              {lastUpdated && daysAgo !== null && (
                <div className="text-sm text-gray-500">
                  Last updated: {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                </div>
              )}
              {!lastUpdated && (
                <div className="text-sm text-amber-600">
                  ⚠️ Never updated - please verify
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : '✓ This is correct'}
            </button>

            <button
              onClick={() => setMode('update')}
              disabled={confirming}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              I need to update it
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Make sure this matches your Golf Ireland WHS Handicap Index
          </p>
        </div>
      </div>
    );
  }

  // Update mode
  const change = parseFloat(newHandicap) - currentHandicap;
  const isLargeChange = Math.abs(change) > 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Update Your Handicap
        </h2>
        
        <p className="text-gray-600 mb-6">
          Enter your current WHS Handicap Index
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Handicap Index
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="54"
            value={newHandicap}
            onChange={(e) => setNewHandicap(e.target.value)}
            className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="0.0"
            autoFocus
          />
        </div>

        {!isNaN(parseFloat(newHandicap)) && (
          <div className={`rounded-lg p-4 mb-6 ${isLargeChange ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="text-sm text-gray-600 mb-2">Change Summary</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">Previous</div>
                <div className="text-xl font-semibold">{currentHandicap.toFixed(1)}</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div>
                <div className="text-sm text-gray-500">New</div>
                <div className="text-xl font-semibold">{parseFloat(newHandicap).toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Change</div>
                <div className={`text-xl font-semibold ${change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}
                </div>
              </div>
            </div>
            {isLargeChange && (
              <div className="mt-3 text-sm text-amber-700 font-medium">
                ⚠️ Large change detected - admin will review
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleUpdate}
            disabled={confirming || newHandicap === currentHandicap.toString()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {confirming ? 'Updating...' : 'Confirm Update'}
          </button>

          <button
            onClick={() => {
              setMode('confirm');
              setNewHandicap(currentHandicap.toString());
              setError('');
            }}
            disabled={confirming}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Make sure this matches your Golf Ireland handicap exactly
        </p>
      </div>
    </div>
  );
}
