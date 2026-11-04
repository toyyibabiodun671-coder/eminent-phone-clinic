import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { email, password, full_name, phone, role } = await req.json()

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Email, password, full_name, role required' }, { status: 400 })
  }

  if (!['admin', 'apprentice'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or apprentice' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })
  if (!newUser.user) return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })

  const { error: profileError } = await serviceSupabase.from('profiles').upsert({
    id: newUser.user.id,
    full_name,
    phone: phone || null,
    role,
    status: 'active',
  })

  if (profileError) return NextResponse.json({ error: 'User created but profile failed: ' + profileError.message }, { status: 400 })

  return NextResponse.json({ success: true, userId: newUser.user.id, email, role })
}