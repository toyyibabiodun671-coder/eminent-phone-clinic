import { getCurrentProfile } from '@/lib/auth/get-profile'
import { Sidebar } from '@/components/navigation/sidebar'
import { Header } from '@/components/layout/header'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  const role = profile.role as StaffRole
  const displayName = profile.full_name || 'User'

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <Header name={displayName} role={role} />

      <div className="flex">
        <Sidebar role={role} />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 bg-[#EFF6FF]">
          {children}
        </main>
      </div>
    </div>
  )
}