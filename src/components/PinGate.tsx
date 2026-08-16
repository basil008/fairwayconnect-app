'use client';

import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { useMember } from '@/lib/MemberContext';

// ─── Error Boundary to catch dashboard crashes ─────────────
class DashboardErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#666', marginBottom: 8, textAlign: 'center', maxWidth: 400 }}>
            The dashboard encountered an error after login.
          </p>
          <pre style={{
            background: '#f5f5f5', padding: 12, borderRadius: 8,
            fontSize: 12, maxWidth: 400, overflow: 'auto', marginBottom: 16,
            border: '1px solid #ddd',
          }}>
            {this.state.error}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: '' });
              this.props.onReset();
            }}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none',
              background: '#1B5E20', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Return to PIN Entry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── PinGate Component ─────────────────────────────────────
export default function PinGate({ children }: { children: React.ReactNode }) {
  const { member, isIdentified, setMember, clearMember } = useMember();
  const [pin, setPin] = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [accessing, setAccessing] = useState(false);
  const [error, setError] = useState('');

  const handlePress = useCallback((digit: string) => {
    if (verifying) return;
    const nextEmpty = pin.findIndex(d => d === '');
    if (nextEmpty === -1) return;

    const newPin = [...pin];
    newPin[nextEmpty] = digit;
    setPin(newPin);
    setError('');

    if (nextEmpty === 3) {
      setTimeout(() => submitPin(newPin.join('')), 600);
    }
  }, [pin, verifying]);

  const handleBackspace = useCallback(() => {
    if (verifying) return;
    const filledIndices = pin
      .map((d, i) => (d !== '' ? i : -1))
      .filter(i => i !== -1);
    if (filledIndices.length === 0) return;

    const lastFilled = filledIndices[filledIndices.length - 1];
    const newPin = [...pin];
    newPin[lastFilled] = '';
    setPin(newPin);
    setError('');
  }, [pin, verifying]);

  const submitPin = async (code: string) => {
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`/api/member-pin/${code}`);

      if (res.ok) {
        const data = await res.json();

        // ── DIAGNOSTIC: Log the API response to help debug ──
        console.log('PIN API response:', JSON.stringify(data, null, 2));

        // ── DEFENSIVE: Handle multiple possible response shapes ──
        // The API might return { id, name, handicap } directly
        // or wrapped as { member: { ... } } or { data: { ... } }
        const memberData = data.member || data.data || data;

        const id = memberData.id ?? memberData.member_id ?? memberData._id ?? '';
        const name = memberData.name ?? memberData.member_name ?? memberData.full_name ?? 'Member';
        const handicap = Number(memberData.handicap ?? memberData.hcp ?? memberData.handicap_index ?? 0);
        const handicapUpdatedAt = memberData.handicap_updated_at ?? null;

        if (!id && !name) {
          console.error('Could not extract member data from API response:', data);
          setError('Member data not found. Contact your organiser.');
          setPin(['', '', '', '']);
          return;
        }

        console.log('Setting member:', { id: String(id), name, handicap });

        setAccessing(true);

        // Small delay to show "Accessing..." before transition
        setTimeout(() => {
          setMember({
            id: String(id),
            name: String(name),
            handicap: handicap,
            handicap_updated_at: handicapUpdatedAt
          });
        }, 400);
      } else {
        const errData = await res.json().catch(() => null);
        console.log('PIN rejected:', res.status, errData);
        setError('Invalid code. Check with your organiser.');
        setPin(['', '', '', '']);
      }
    } catch (e) {
      console.error('PIN verification error:', e);
      setError('Something went wrong. Try again.');
      setPin(['', '', '', '']);
    } finally {
      setVerifying(false);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handlePress(e.key);
      else if (e.key === 'Backspace') handleBackspace();
    };
    if (!isIdentified) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isIdentified, handlePress, handleBackspace]);

  // If member is identified, show the app (with error boundary)
  if (isIdentified) {
    return (
      <DashboardErrorBoundary onReset={() => {
        clearMember();
        setPin(['', '', '', '']);
        setAccessing(false);
      }}>
        {children}
      </DashboardErrorBoundary>
    );
  }

  // Full-screen PIN landing page
  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-24 pointer-events-none z-0"
        style={{
          background: `repeating-linear-gradient(90deg, transparent 0px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 3px, transparent 4px)`,
        }}
      />
      <div
        className="min-h-screen flex flex-col justify-center items-center px-4 py-4 relative z-10"
        style={{
          background: 'radial-gradient(ellipse at center, #4A8C3F 0%, #3D7A35 50%, #2D5A24 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <div className="text-center max-w-sm w-full flex flex-col justify-center min-h-screen">
          <div className="mb-6">
            <div className="text-5xl filter drop-shadow-lg">⛳</div>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.12)', letterSpacing: '-0.02em', fontWeight: 700 }}
          >
            FairwayConnect
          </h1>

          <h2 className="text-lg md:text-xl text-white/75 mb-8 font-medium" style={{ letterSpacing: '-0.01em' }}>
            Aer Lingus Golf Society
          </h2>

          <h3
            className="text-3xl md:text-4xl font-semibold text-white mb-3"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.1)', letterSpacing: '-0.015em' }}
          >
            Member Access
          </h3>

          <p className="text-base text-white/65 mb-8 font-normal">
            Enter your PIN to continue
          </p>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-8">
            {pin.map((digit, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  digit
                    ? 'bg-white/90 border-white/90 shadow-lg shadow-white/30'
                    : 'bg-transparent border-white/40'
                }`}
              />
            ))}
          </div>

          {/* Status messages */}
          {(verifying || accessing) && (
            <div className="text-center mb-6">
              <div className="text-white/75 text-base font-medium">
                {accessing ? 'Accessing...' : 'Verifying...'}
              </div>
            </div>
          )}

          {error && (
            <div className="text-center mb-6">
              <div className="text-red-200 text-sm font-medium">{error}</div>
            </div>
          )}

          {/* Number pad */}
          <div className="max-w-xs mx-auto pb-8">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePress(digit)}
                  disabled={verifying}
                  className="w-16 h-16 sm:w-18 sm:h-18 bg-white/8 border border-white/12 rounded-2xl text-white text-xl sm:text-2xl font-normal hover:bg-white/15 active:bg-white/25 transition-all duration-150 shadow-lg disabled:opacity-50"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  {digit}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleBackspace()}
                disabled={verifying}
                className="w-16 h-16 sm:w-18 sm:h-18 bg-white/5 border border-white/8 rounded-2xl text-white/60 text-base font-normal hover:bg-white/10 active:bg-white/20 transition-all duration-150 disabled:opacity-50"
              >
                ←
              </button>
              <button
                onClick={() => handlePress('0')}
                disabled={verifying}
                className="w-16 h-16 sm:w-18 sm:h-18 bg-white/8 border border-white/12 rounded-2xl text-white text-xl sm:text-2xl font-normal hover:bg-white/15 active:bg-white/25 transition-all duration-150 shadow-lg disabled:opacity-50"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                0
              </button>
              <div className="w-16 h-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
