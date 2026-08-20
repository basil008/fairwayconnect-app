'use client';

import VersionFooter from '@/components/VersionFooter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <VersionFooter mode="full" />
    </div>
  );
}
