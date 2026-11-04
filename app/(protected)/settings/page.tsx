import { getCurrentProfile } from '@/lib/auth/get-profile'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export default async function SettingsPage() {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as ProfileRow

  if (!profile || !profile.id) redirect('/login')

  const role = profile.role as StaffRole

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-blue-100">Manage your profile — {profile.full_name || 'User'} • {role}</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1E3A8A]">My Profile</h3>
          <p className="mt-1 text-xs text-gray-400">ID: {profile.id.slice(0, 8)}... • {role} • {profile.status || 'active'}</p>

          <form action="/api/settings/update" method="post" className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Full Name</label>
              <input name="full_name" defaultValue={profile.full_name || ''} required className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Phone</label>
              <input name="phone" defaultValue={profile.phone || ''} className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none" placeholder="080..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400">Role (read-only)</label>
                <input value={role} disabled className="mt-1 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400">Status (read-only)</label>
                <input value={profile.status || 'active'} disabled className="mt-1 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Save Changes</button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1E3A8A]">Account Info</h3>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Joined</span><span className="font-medium text-gray-700">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-NG') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Last Updated</span><span className="font-medium text-gray-700">{profile.updated_at ? new Date(profile.updated_at).toLocaleString('en-NG') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">User ID</span><span className="font-mono text- text-gray-600">{profile.id.slice(0, 8)}...</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
            <h3 className="text-sm font-bold text-amber-800">Note</h3>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-amber-700/80">
              <li>Role/Status changed only by Admin in Staff page</li>
              <li>Password reset via Supabase Auth email</li>
              <li>Lagos timezone</li>
            </ul>
          </div>

          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Sign Out</button>
          </form>
        </div>
      </div>
    </div>
  )
}