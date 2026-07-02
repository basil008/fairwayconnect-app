// src/app/page.tsx — server component (NO 'use client')
export const dynamic = 'force-dynamic';

import { MemberProvider } from '@/lib/MemberContext';
import PinGate from '@/components/PinGate';
import RedirectToMemberHome from '@/components/RedirectToMemberHome';

export default function HomePage() {
  return (
    <MemberProvider>
      <PinGate>
        <RedirectToMemberHome />
      </PinGate>
    </MemberProvider>
  );
}
