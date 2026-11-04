import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: 'admin' | 'manager' | 'technician' | 'sales'
  status: 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export async function getCurrentProfile(): Promise<ProfileRow> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, status, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`)
  }

  if (!data) {
    const emergency: ProfileRow = {
      id: user.id,
      full_name: user.email?.split('@')[0] || 'Admin',
      phone: null,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: emergency.id,
        full_name: emergency.full_name,
        phone: emergency.phone,
        role: emergency.role,
        status: emergency.status,
      })
      .select('id, full_name, phone, role, status, created_at, updated_at')
      .single<ProfileRow>()

    if (insertError) {
      return emergency
    }

    return inserted as ProfileRow
  }

  if (data.status !== 'active') {
    redirect('/login?error=suspended')
  }

  return data as ProfileRow
}