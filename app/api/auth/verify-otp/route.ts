import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, token } = await req.json()
  if (!email || !token) return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })

  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.toLowerCase().trim(),
    token: token.trim(),
    type: 'email',
  })

  if (error) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })

  return NextResponse.json({ success: true, user: data.user?.email })
}