import { redirect } from 'next/navigation'
import { getCurrentProfile } from './get-profile'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string
  status: string | null
}

export async function requireAdmin() {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as ProfileRow

  if (!profile || !profile.id) redirect('/login')

  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) redirect('/dashboard')

  return profile
}