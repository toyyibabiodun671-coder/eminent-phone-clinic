import { LogoutButton } from '@/components/auth/logout-button'
import { MobileNav } from '@/components/navigation/mobile-nav'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type HeaderProps = {
  name: string
  role: StaffRole
}

export function Header({ name, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h- items-center justify-between border-b border-blue-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-4">
        <MobileNav role={role} />
        <div className="flex items-center gap-3">
          <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white font-bold shadow-md sm:flex">E</div>
          <div>
            <p className="font-bold text-[#1E3A8A] leading-tight">Eminent Phone Clinic</p>
            <p className="text-xs font-medium text-[#2563EB]">Repair Management System</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden rounded-xl border border-blue-200 bg-[#EFF6FF] px-4 py-2 text-right sm:block">
          <p className="text-sm font-bold text-[#1E3A8A] leading-tight">{name}</p>
          <p className="text- font-semibold capitalize text-[#2563EB] tracking-wide">{role} • Online</p>
        </div>
        <div className="rounded-xl bg-[#EFF6FF] p-1"><LogoutButton /></div>
      </div>
    </header>
  )
}