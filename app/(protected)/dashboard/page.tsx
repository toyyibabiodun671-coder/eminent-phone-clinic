import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string
}

type TxRow = {
  id: string
  amount: number | string
  payment_method: string
  transaction_type: string
  description: string | null
  created_at: string
  transaction_date: string | null
}

type LowStockRow = {
  name: string
  stock_quantity: number
}

type RepairCostRow = {
  repair_cost: number | string | null
  amount_paid: number | string | null
}

export default async function DashboardPage() {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as ProfileRow
  const supabase = await createClient()

  const isAdmin = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'owner'

  const rawName = profile.full_name || 'User'
  const firstName = String(rawName).trim().split(' ')[0] || 'User'
  const capitalizedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()

  const { count: totalRepairs } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true })
  const { count: diagnosing } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'diagnosing')
  const { count: inProgress } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
  const { count: ready } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'ready')
  const { count: collected } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'collected')
  const { count: cancelled } = await supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'cancelled')

  const { count: totalCustomers } = await supabase.from('customers').select('id', { count: 'exact', head: true })
  const { count: totalDevices } = await supabase.from('devices').select('id', { count: 'exact', head: true })
  const { data: lowStockData } = await supabase.from('accessories').select('name, stock_quantity').lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5)
  const lowStock = (lowStockData as LowStockRow[] | null) || []

  const todayLagos = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const displayDate = new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const startOfDay = `${todayLagos}T00:00:00+01:00`
  const endOfDay = `${todayLagos}T23:59:59+01:00`

  let totalSales = 0
  let cash = 0
  let transfer = 0
  let pos = 0
  let repairPayments = 0
  let accessoryRevenue = 0
  let otherSales = 0
  let outstandingBalance = 0
  let todayTxData: TxRow[] = []

  if (isAdmin) {
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, payment_method, transaction_type, description, created_at, transaction_date')
      .gte('transaction_date', startOfDay)
      .lte('transaction_date', endOfDay)
      .order('created_at', { ascending: false })

    todayTxData = (data as TxRow[] | null) || []
    totalSales = todayTxData.reduce((sum, s) => sum + Number(s.amount), 0)
    cash = todayTxData.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + Number(s.amount), 0)
    transfer = todayTxData.filter(s => s.payment_method === 'transfer').reduce((sum, s) => sum + Number(s.amount), 0)
    pos = todayTxData.filter(s => s.payment_method === 'pos').reduce((sum, s) => sum + Number(s.amount), 0)
    repairPayments = todayTxData.filter(s => ['repair', 'deposit', 'balance'].includes(s.transaction_type)).reduce((sum, s) => sum + Number(s.amount), 0)
    accessoryRevenue = todayTxData.filter(s => s.transaction_type === 'accessory' || s.transaction_type === 'accessory_sale').reduce((sum, s) => sum + Number(s.amount), 0)
    otherSales = Math.max(totalSales - repairPayments - accessoryRevenue, 0)

    const { data: openRepairsData } = await supabase.from('repair_jobs').select('repair_cost, amount_paid').neq('status', 'collected')
    const openRepairs = (openRepairsData as RepairCostRow[] | null) || []
    outstandingBalance = openRepairs.reduce((sum, r) => sum + (Number(r.repair_cost || 0) - Number(r.amount_paid || 0)), 0)
  }

  const cardClass = "rounded-2xl border border-blue-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:bg-[#EFF6FF]/50"

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white font-bold">{capitalizedFirst.charAt(0)}</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard — {capitalizedFirst}</h1>
            <p className="mt-1 text-sm text-blue-100">Eminent Phone Clinic • {displayDate} • {isAdmin ? 'Admin' : 'Technician'}</p>
          </div>
        </div>
      </div>

      {/* FINANCIAL TOP LEVEL — MOVED TO TOP */}
      {isAdmin && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Today&apos;s Sales</p><p className="mt-2 text-2xl font-bold text-[#1E3A8A]">₦{totalSales.toLocaleString()}</p><p className="mt-1 text-xs leading-tight text-blue-500">Repair ₦{repairPayments.toLocaleString()} • Acc ₦{accessoryRevenue.toLocaleString()} • Other ₦{otherSales.toLocaleString()}</p></div>
            <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Accessories Today</p><p className="mt-2 text-2xl font-bold text-[#1E3A8A]">₦{accessoryRevenue.toLocaleString()}</p><p className="mt-1 text-xs text-blue-400">{todayTxData.filter(s => s.transaction_type === 'accessory' || s.transaction_type === 'accessory_sale').length} sales</p></div>
            <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Repairs</p><p className="mt-2 text-2xl font-bold text-[#1E3A8A]">{totalRepairs ?? 0}</p><p className="mt-1 text-xs text-blue-400">Completed {collected ?? 0} • Diagnosing {diagnosing ?? 0}</p></div>
            <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Outstanding Balance</p><p className="mt-2 text-2xl font-bold text-amber-600">₦{outstandingBalance.toLocaleString()}</p><p className="mt-1 text-xs text-blue-400">Customer balance</p></div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-green-600">Cash</p><p className="mt-2 text-xl font-bold text-green-700">₦{cash.toLocaleString()}</p></div>
            <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-purple-600">Transfer</p><p className="mt-2 text-xl font-bold text-purple-700">₦{transfer.toLocaleString()}</p></div>
            <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-orange-600">POS</p><p className="mt-2 text-xl font-bold text-orange-700">₦{pos.toLocaleString()}</p></div>
          </div>
        </>
      )}

      {/* REPAIR WORK STATUS — RIGHT AFTER FINANCIAL */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-[#1E3A8A]">Work Status</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className={cardClass}><p className="text-xs font-semibold uppercase text-yellow-600">Diagnosing</p><p className="mt-2 text-2xl font-bold">{diagnosing ?? 0}</p><p className="text-xs text-gray-400">Pending</p></div>
          <div className={cardClass}><p className="text-xs font-semibold uppercase text-blue-600">In Progress</p><p className="mt-2 text-2xl font-bold">{inProgress ?? 0}</p><p className="text-xs text-gray-400">Working</p></div>
          <div className={cardClass}><p className="text-xs font-semibold uppercase text-green-600">Ready</p><p className="mt-2 text-2xl font-bold">{ready ?? 0}</p><p className="text-xs text-gray-400">Ready to collect</p></div>
          <div className={cardClass}><p className="text-xs font-semibold uppercase text-gray-600">Collected</p><p className="mt-2 text-2xl font-bold">{collected ?? 0}</p><p className="text-xs text-gray-400">Done</p></div>
          <div className={cardClass}><p className="text-xs font-semibold uppercase text-red-600">Cancelled</p><p className="mt-2 text-2xl font-bold">{cancelled ?? 0}</p><p className="text-xs text-gray-400">Cancelled</p></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Total Repairs</p><p className="mt-2 text-2xl font-bold text-[#1E3A8A]">{totalRepairs ?? 0}</p><p className="mt-1 text-xs text-blue-400">{totalCustomers ?? 0} customers • {totalDevices ?? 0} devices</p></div>
        <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Low Stock</p><p className="mt-2 text-sm font-bold text-[#1E3A8A]">{lowStock.length > 0 ? lowStock.map(l => `${l.name} (${l.stock_quantity})`).join(', ') : 'All stocked'}</p><p className="mt-1 text-xs text-blue-400">{lowStock.length} items below 5</p></div>
        {!isAdmin && <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">My Work</p><p className="mt-2 text-2xl font-bold text-[#1E3A8A]">{(diagnosing ?? 0) + (inProgress ?? 0)} open</p><p className="mt-1 text-xs text-blue-400">Pending + In Progress</p></div>}
        {isAdmin && <div className={cardClass}><p className="text-xs font-semibold uppercase text-[#2563EB]">Outstanding Balance</p><p className="mt-2 text-2xl font-bold text-amber-600">₦{outstandingBalance.toLocaleString()}</p><p className="mt-1 text-xs text-blue-400">Customer balance</p></div>}
      </div>

      {isAdmin && (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#1E3A8A]">Today&apos;s Payments ({todayTxData.length})</h3><Link href="/sales" className="text-xs font-semibold text-[#2563EB]">View All →</Link></div>
          <div className="mt-4 divide-y divide-blue-50">
            {todayTxData.length > 0 ? todayTxData.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div><p className="text-sm font-medium text-gray-800">{t.description || t.transaction_type} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${t.transaction_type === 'accessory' || t.transaction_type === 'accessory_sale' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-600'}`}>{t.transaction_type}</span></p><p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()} • <span className="font-bold uppercase">{t.payment_method}</span></p></div>
                <span className="text-sm font-bold text-[#1E3A8A]">₦{Number(t.amount).toLocaleString()}</span>
              </div>
            )) : <p className="py-8 text-center text-sm text-gray-400">No payments recorded today</p>}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E3A8A]">Quick Actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/customers/new" className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700">+ New Customer</Link>
          <Link href="/repairs/new" className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-5 py-2.5 text-sm font-semibold text-[#1D4ED8] hover:bg-blue-100">+ New Repair</Link>
          <Link href="/accessories/new" className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] hover:bg-gray-50">+ New Accessory</Link>
          {isAdmin && <Link href="/sales/new" className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] hover:bg-gray-50">+ New Sale</Link>}
          {isAdmin && <Link href="/expenses/new" className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] hover:bg-gray-50">+ New Expense</Link>}
        </div>
      </div>
    </div>
  )
}