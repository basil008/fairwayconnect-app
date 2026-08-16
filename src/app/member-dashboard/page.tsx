'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Check for member authentication
    const memberAuth = sessionStorage.getItem('member_auth')
    const guestMode = sessionStorage.getItem('guest_mode')
    
    if (memberAuth === 'true' || guestMode === 'true') {
      console.log('Member authenticated, redirecting to member home')
      // Redirect to member home with the proper context
      setTimeout(() => {
        window.location.href = '/member-home'
      }, 500)
    } else {
      console.log('No member auth, redirecting to login')
      router.push('/')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-green-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <p className="text-lg font-semibold mb-2">ALGS Member Area</p>
        <p className="text-sm">Loading your member dashboard...</p>
        <div className="mt-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  )
}