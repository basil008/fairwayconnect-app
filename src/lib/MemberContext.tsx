'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface MemberIdentity {
  id: string;
  name: string;
  handicap: number;
  handicap_updated_at?: string | null;
}

interface MemberContextType {
  member: MemberIdentity | null;
  isIdentified: boolean;
  setMember: (m: MemberIdentity) => void;
  clearMember: () => void;
}

const MemberContext = createContext<MemberContextType>({
  member: null,
  isIdentified: false,
  setMember: () => {},
  clearMember: () => {},
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMemberState] = useState<MemberIdentity | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('fc_member_id');
      const name = localStorage.getItem('fc_member_name');
      const handicap = localStorage.getItem('fc_member_handicap');
      const handicapUpdatedAt = localStorage.getItem('fc_member_handicap_updated_at');
      if (id && name) {
        setMemberState({ 
          id, 
          name, 
          handicap: Number(handicap) || 0,
          handicap_updated_at: handicapUpdatedAt
        });
      }
    }
    setLoaded(true);
  }, []);

  const setMember = useCallback((m: MemberIdentity) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_member_id', m.id);
      localStorage.setItem('fc_member_name', m.name);
      localStorage.setItem('fc_member_handicap', String(m.handicap));
      if (m.handicap_updated_at) {
        localStorage.setItem('fc_member_handicap_updated_at', m.handicap_updated_at);
      }
    }
    setMemberState(m);
  }, []);

  const clearMember = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fc_member_id');
      localStorage.removeItem('fc_member_name');
      localStorage.removeItem('fc_member_handicap');
      localStorage.removeItem('fc_member_handicap_updated_at');
    }
    setMemberState(null);
  }, []);

  if (!loaded) return null;

  return (
    <MemberContext.Provider value={{ member, isIdentified: !!member, setMember, clearMember }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
