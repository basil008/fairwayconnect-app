'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commit: string;
  built: string;
  env: string;
}

interface VersionFooterProps {
  mode?: 'full' | 'simple'; // 'full' for admin, 'simple' for members
}

export default function VersionFooter({ mode = 'simple' }: VersionFooterProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(r => r.json())
      .then(setVersionInfo)
      .catch(() => setVersionInfo({ version: 'unknown', commit: '', built: '', env: '' }));
  }, []);

  if (!versionInfo) return null;

  const builtDate = versionInfo.built ? new Date(versionInfo.built).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return (
    <footer className="text-center py-3 text-xs text-gray-500 bg-white border-t border-gray-200">
      {mode === 'full' ? (
        // Admin/Committee view: Full stamp with commit and build time
        <div>
          <span className="font-medium">FairwayConnect {versionInfo.version}</span>
          {versionInfo.commit && versionInfo.commit !== 'unknown' && (
            <span className="text-gray-400"> ({versionInfo.commit})</span>
          )}
          {builtDate && (
            <span className="text-gray-400"> · {builtDate}</span>
          )}
          {versionInfo.env === 'test' && (
            <span className="ml-2 text-yellow-600 font-semibold">TEST</span>
          )}
        </div>
      ) : (
        // Member view: Version only
        <div>
          FairwayConnect v{versionInfo.version}
          {versionInfo.env === 'test' && (
            <span className="ml-2 text-yellow-600 font-semibold">TEST</span>
          )}
        </div>
      )}
    </footer>
  );
}
