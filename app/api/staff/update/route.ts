import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'apprentice'
type StaffStatus = 'active' | 'inactive'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json() as { id?: string; role?: StaffRole; status?: StaffStatus; full_name?: string; phone?: string }

  if (!body.id) return NextResponse.json({ error: 'Staff id required' }, { status: 400 })
  if (body.id === user.id) return NextResponse.json({ error: 'Cannot modify yourself' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.role && ['admin', 'apprentice'].includes(body.role)) updates.role = body.role
  if (body.status && ['active', 'inactive'].includes(body.status)) updates.status = body.status
  if (typeof body.full_name === 'string' && body.full_name.trim()) updates.full_name = body.full_name.trim()
  if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await serviceSupabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}