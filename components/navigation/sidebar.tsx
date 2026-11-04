'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Banknote,
  Wrench,
  Headphones,
  Users,
  Smartphone,
  BarChart3,
  Settings,
  Wallet,
  Shield,
} from 'lucide-react'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type SidebarProps = {
  role: StaffRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  const links = [
    { name: 'Dashboard', href: '/dashboard', allowed: true, Icon: LayoutDashboard },
    { name: 'Sales', href: '/sales', allowed: isAdmin, Icon: Banknote },
    { name: 'Repairs', href: '/repairs', allowed: true, Icon: Wrench },
    { name: 'Accessories', href: '/accessories', allowed: true, Icon: Headphones },
    { name: 'Customers', href: '/customers', allowed: true, Icon: Users },
    { name: 'Devices', href: '/devices', allowed: true, Icon: Smartphone },
    { name: 'Staff', href: '/staff', allowed: isAdmin, Icon: Shield },
    { name: 'Reports', href: '/reports', allowed: isAdmin, Icon: BarChart3 },
    { name: 'Expenses', href: '/expenses', allowed: isAdmin, Icon: Wallet },
    { name: 'Settings', href: '/settings', allowed: isAdmin, Icon: Settings },
  ]

  return (
    <aside className="hidden w-64 shrink-0 lg:block bg-white border-r border-blue-100 min-h-[calc(100vh-64px)]">
      <div className="p-5">
        <div className="rounded-xl bg-[#EFF6FF] border border-blue-100 p-4">
          <p className="text-sm font-bold text-[#1E3A8A] tracking-wider uppercase">Eminent</p>
          <p className="text-xs text-[#2563EB] font-medium">Phone Clinic</p>
        </div>

        <nav className="mt-6 space-y-1.5">
          {links
            .filter((link) => link.allowed)
            .map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              const Icon = link.Icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-200'
                      : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              )
            })}
        </nav>

        <div className="mt-8 rounded-xl bg-[#EFF6FF] border border-blue-100 p-4">
          <p className="text-xs font-bold text-[#1E3A8A]">{isAdmin ? 'Admin' : role === 'apprentice' ? 'Apprentice' : 'Technician'} Mode</p>
          <p className="mt-1 text-xs text-[#2563EB] capitalize">{role}</p>
        </div>
      </div>
    </aside>
  )
}