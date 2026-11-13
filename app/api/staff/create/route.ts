import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','manager','owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { email, password, full_name, phone, role } = await req.json()

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Email, password, full_name, role required' }, { status: 400 })
  }

  const allowedRoles = ['admin','manager','technician','sales','apprentice','owner']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${allowedRoles.join(', ')}` }, { status: 400 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create auth user - trigger will also try to insert profile, but we handle exception now
  const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (createError) {
    console.error('createUser error:', createError)
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }
  if (!newUser.user) return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })

  // Upsert profile - now safe even if trigger already inserted
  const { error: profileError } = await serviceSupabase.from('profiles').upsert({
    id: newUser.user.id,
    email: email.toLowerCase().trim(),
    full_name,
    phone: phone || null,
    role,
    status: 'active',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (profileError) {
    // User created but profile failed - delete auth user to avoid orphan
    await serviceSupabase.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: 'Profile failed: ' + profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}