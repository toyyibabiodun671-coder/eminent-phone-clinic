import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = await createClient()

  // Only existing staff can get OTP - shouldCreateUser: false
  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: { shouldCreateUser: false }
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true, message: 'OTP sent to your email - check inbox' })
}