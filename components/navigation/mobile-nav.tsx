'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  Menu,
  X,
} from 'lucide-react'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type MobileNavProps = {
  role: StaffRole
}

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false)
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
    <div className="lg:hidden">
      <button onClick={() => setOpen(!open)} className="rounded-xl bg-[#EFF6FF] p-2.5 text-[#2563EB] border border-blue-200">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <div className="h-full w-72 bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <nav className="mt-6 space-y-1.5">
              {links.filter(l => l.allowed).map(link => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                const Icon = link.Icon
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]'}`}>
                    <Icon className="h-5 w-5" />{link.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileNav