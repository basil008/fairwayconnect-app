'use client';

import { useState } from 'react';
import { useMember } from '@/lib/MemberContext';

export default function MemberPickerBanner() {
  const { isIdentified, setMember } = useMember();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isIdentified || dismissed) return null;

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/auth/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        setMember({ id: data.id, name: data.name, handicap: data.handicap });
        setShowPinEntry(false);
      } else {
        setError('Invalid code. Check with your organiser.');
        setPin('');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setChecking(false);
  };

  const handleKeyPress = (digit: string) => {
    if (digit === 'back') {
      setPin(p => p.slice(0, -1));
      setError('');
    } else if (digit === 'enter') {
      handlePinSubmit();
    } else if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        // Auto-submit when 4 digits entered
        setTimeout(() => {
          setChecking(true);
          fetch('/api/auth/member-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: newPin }),
          })
            .then(r => { if (r.ok) return r.json(); throw new Error('invalid'); })
            .then(data => { setMember({ id: data.id, name: data.name, handicap: data.handicap }); setShowPinEntry(false); })
            .catch(() => { setError('Invalid code. Check with your organiser.'); setPin(''); })
            .finally(() => setChecking(false));
        }, 200);
      }
    }
  };

  return (
    <>
      {/* Banner */}
      {!showPinEntry && (
        <div className="bg-fairway-50 border border-fairway-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-xl">👋</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-fairway-900">Welcome! Enter your 4-digit code</p>
            <p className="text-xs text-gray-500">Ask your organiser for your personal code or link</p>
          </div>
          <button
            onClick={() => setShowPinEntry(true)}
            className="bg-fairway-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Enter Code
          </button>
          <button onClick={() => setDismissed(true)} className="text-gray-400 text-xs ml-1">✕</button>
        </div>
      )}

      {/* PIN Entry Modal */}
      {showPinEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <div />
              <h2 className="text-lg font-bold text-gray-900">Enter Your Code</h2>
              <button onClick={() => { setShowPinEntry(false); setPin(''); setError(''); }} className="text-gray-400 text-lg">✕</button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Your 4-digit member code</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  pin.length > i 
                    ? 'border-fairway-900 bg-fairway-50 text-fairway-900' 
                    : 'border-gray-200 bg-gray-50'
                } ${error ? 'border-red-400 animate-shake' : ''}`}>
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium mb-3">{error}</p>
            )}

            {checking && (
              <p className="text-xs text-fairway-800 font-medium mb-3">Checking...</p>
            )}

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','','0','back'].map(digit => (
                <button
                  key={digit || 'empty'}
                  onClick={() => digit && handleKeyPress(digit)}
                  disabled={!digit || checking}
                  className={`h-14 rounded-xl text-xl font-bold transition-colors ${
                    !digit ? 'invisible' :
                    digit === 'back' ? 'bg-gray-100 text-gray-600 active:bg-gray-200 text-base' :
                    'bg-gray-50 text-gray-900 active:bg-fairway-100 active:text-fairway-900'
                  }`}
                >
                  {digit === 'back' ? '⌫' : digit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
