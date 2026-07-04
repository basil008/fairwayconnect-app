'use client';

import { useEffect, useState } from 'react';

export default function TestBanner() {
  const [isTestSite, setIsTestSite] = useState(false);
  
  useEffect(() => {
    setIsTestSite(window.location.hostname.includes('test'));
    
    // Add padding to body if test site
    if (window.location.hostname.includes('test')) {
      document.body.style.paddingTop = '120px';
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
        padding: '12px 20px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        borderBottom: '4px solid #FF8C00',
        letterSpacing: '1px'
      }}>
        🧪 TEST SITE - TRAINING ENVIRONMENT - NOT REAL DATA 🧪
      </div>
    </>
  );
}
