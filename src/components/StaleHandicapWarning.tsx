'use client';

interface StaleHandicapWarningProps {
  staleMembers: Array<{
    id: string;
    name: string;
    handicap: number;
    lastUpdated: string | null;
    daysAgo: number | null;
  }>;
  onProceed: () => void;
  onCancel: () => void;
}

export default function StaleHandicapWarning({
  staleMembers,
  onProceed,
  onCancel
}: StaleHandicapWarningProps) {
  if (staleMembers.length === 0) {
    onProceed();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center">
            <span className="text-3xl mr-3">⚠️</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Handicap Update Required
              </h2>
              <p className="text-sm text-gray-600">
                {staleMembers.length} member{staleMembers.length !== 1 ? 's' : ''} ha{staleMembers.length !== 1 ? 've' : 's'} not updated handicaps recently
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-700 mb-4">
            The following members should update their handicaps before scoring opens:
          </p>

          <div className="space-y-2">
            {staleMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <div className="font-semibold text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600">
                    H/C: {member.handicap.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  {member.lastUpdated ? (
                    <div className="text-sm text-amber-600 font-medium">
                      {member.daysAgo} days ago
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 font-medium">
                      Never updated
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Members will be prompted to confirm/update their handicap when they log in to enter scores.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Open Scoring Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
