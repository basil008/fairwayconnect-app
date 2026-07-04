'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MemberProvider } from '@/lib/MemberContext';
import PinGate from '@/components/PinGate';

function RedirectToDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/member-home');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #4A8C3F 0%, #3D7A35 50%, #2D5A24 100%)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛳</div>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>FairwayConnect</h1>
        <p style={{ opacity: 0.8 }}>Loading...</p>
      </div>
    </div>
  );
}

export default function PinGateClient() {
  return (
    <MemberProvider>
      <PinGate>
        <RedirectToDashboard />
      </PinGate>
    </MemberProvider>
  );
}
