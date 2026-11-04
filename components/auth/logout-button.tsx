'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)

    const supabase = createClient()

    await supabase.auth.signOut()

    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Logout'}
    </button>
  )
}