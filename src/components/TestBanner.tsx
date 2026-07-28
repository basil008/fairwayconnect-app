'use client';

import { useEffect, useState } from 'react';

export default function TestBanner() {
  const [isTest, setIsTest] = useState(false);

  useEffect(() => {
    // Check if we're on the test domain
    setIsTest(window.location.hostname.includes('fairwayconnect-test'));
  }, []);

  if (!isTest) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FEF3C7',
      color: '#92400E',
      padding: '2px 8px',
      fontSize: '9px',
      fontWeight: 500,
      textAlign: 'center',
      zIndex: 9999,
      borderBottom: '1px solid #FCD34D',
      letterSpacing: '0.5px',
      lineHeight: '14px'
    }}>
      TEST
    </div>
  );
}
