'use client';

import { useEffect, useState } from 'react';

export default function TestBanner() {
  const [isTestSite, setIsTestSite] = useState(false);
  
  useEffect(() => {
    setIsTestSite(window.location.hostname.includes('test'));
    
    // Add padding to body if test site
    if (window.location.hostname.includes('test')) {
      document.body.style.paddingTop = '88px';
    }
  }, []);
  
  if (!isTestSite) return null;
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #FFD700 0%, #FFC700 100%)',
        color: '#000',
        padding: '2px 0',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '9px',
        boxShadow: 'none',
        borderBottom: '1px solid #FF8C00',
        letterSpacing: '0.3px'
      }}>
        ⚡ TEST SITE - TRAINING ENVIRONMENT - NOT REAL DATA ⚡
      </div>
    </>
  );
}
