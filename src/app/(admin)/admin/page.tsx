'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, go to dashboard
    if (sessionStorage.getItem('admin_auth') === 'true') {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleEnter = async () => {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_auth', 'true');
        router.replace('/admin/dashboard');
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setPin(''), 500);
      }
    } catch {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-fairway-900 to-fairway-800 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">⛳</span>
        <h1 className="text-2xl font-bold text-white">Committee Access</h1>
        <p className="text-fairway-200 text-sm mt-1">Enter your PIN to continue</p>
      </div>

      {/* PIN display */}
      <div className={`flex gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? 'bg-white scale-110'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-300 text-sm font-medium mb-4">Incorrect PIN</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleDigit(String(num))}
            className="w-20 h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-2xl text-white text-2xl font-bold transition-all flex items-center justify-center mx-auto"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="w-20 h-16 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-2xl text-white text-lg font-medium transition-all flex items-center justify-center mx-auto"
        >
          ⌫
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="w-20 h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-2xl text-white text-2xl font-bold transition-all flex items-center justify-center mx-auto"
        >
          0
        </button>
        <button
          onClick={handleEnter}
          disabled={pin.length === 0}
          className="w-20 h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-2xl text-white text-lg font-bold transition-all flex items-center justify-center mx-auto disabled:opacity-30"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
