import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export async function POST(request: NextRequest) {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as { id: string }
  if (!profile?.id) return NextResponse.redirect(new URL('/login', request.url))

  const formData = await request.formData()
  const full_name = String(formData.get('full_name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()

  if (!full_name) return NextResponse.json({ error: 'Full name required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone: phone || null, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.redirect(new URL('/settings?saved=1', request.url))
}