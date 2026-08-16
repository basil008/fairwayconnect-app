'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MemberLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'welcome' | 'invalid'>('loading');
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    if (!token) return;

    fetch(`/api/member/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(member => {
        // Store in localStorage
        localStorage.setItem('fc_member_id', member.id);
        localStorage.setItem('fc_member_name', member.name);
        localStorage.setItem('fc_member_handicap', String(member.handicap));
        setMemberName(member.name.split(' ')[0]); // First name
        setStatus('welcome');

        // Redirect after 1.5 seconds
        setTimeout(() => {
          router.push('/');
        }, 1500);
      })
      .catch(() => {
        setStatus('invalid');
      });
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fairway-50">
        <div className="text-center">
          <span className="text-5xl animate-pulse">⛳</span>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-sm">
          <span className="text-5xl block mb-4">🚫</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-sm text-gray-500 mb-6">
            This personal link is not valid. It may have expired or been entered incorrectly.
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-700 font-medium mb-1">Need help?</p>
            <p className="text-xs text-gray-500">
              Contact your society organiser to get your personal link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-fairway-900 to-fairway-800">
      <div className="text-center text-white">
        <span className="text-6xl block mb-4">👋</span>
        <h1 className="text-3xl font-bold mb-2">Welcome, {memberName}!</h1>
        <p className="text-fairway-200 text-sm">Setting up your personalised experience...</p>
        <div className="mt-6">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}
