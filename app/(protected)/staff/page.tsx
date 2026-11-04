import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StaffTable } from './components/staff-table'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  status: string | null
  created_at: string | null
}

export default async function StaffPage() {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as ProfileRow

  if (!profile || !profile.id) redirect('/login')

  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) redirect('/dashboard')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Unable to load staff: ' + error.message)

  const staff = (data as ProfileRow[] | null) || []
  const profileId = profile.id

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Staff</h1>
          <p className="mt-1 text-sm text-blue-100">{staff.length} staff members — manage roles, deactivate, or delete. Deactivated staff cannot login.</p>
        </div>
        <Link href="/staff/new" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 shadow">+ Add Staff</Link>
      </div>

      <div className="mt-6">
        <StaffTable staff={staff} currentUserId={profileId} />
      </div>
    </div>
  )
}