'use client';

import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { MemberProvider } from '@/lib/MemberContext';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberProvider>
      <div className="pb-nav">
        <main className="max-w-lg mx-auto min-h-screen">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </div>
    </MemberProvider>
  );
}
