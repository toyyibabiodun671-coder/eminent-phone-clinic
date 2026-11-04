import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type SaleRow = {
  amount: string | number
  payment_method: string
  sale_date: string
  type: string
}

type TransactionRow = {
  amount: string | number
  payment_method: string
  transaction_date: string
  transaction_type: string
}

type RepairRow = {
  repair_cost: string | number | null
  amount_paid: string | number | null
  date_received: string
}

function getLagosDateRange(filter: string, from?: string, to?: string) {
  const now = new Date()
  const lagosNow = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))

  let start: Date
  let end: Date

  switch (filter) {
    case 'today':
      start = new Date(lagosNow)
      start.setHours(0, 0, 0, 0)
      end = new Date(lagosNow)
      end.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      start = new Date(lagosNow)
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setHours(23, 59, 59, 999)
      break
    case 'last7':
      start = new Date(lagosNow)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      end = new Date(lagosNow)
      end.setHours(23, 59, 59, 999)
      break
    case 'thisMonth':
      start = new Date(lagosNow.getFullYear(), lagosNow.getMonth(), 1)
      end = new Date(lagosNow)
      end.setHours(23, 59, 59, 999)
      break
    case 'custom':
      if (from && to) {
        start = new Date(from)
        start.setHours(0, 0, 0, 0)
        end = new Date(to)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(lagosNow)
        start.setHours(0, 0, 0, 0)
        end = new Date(lagosNow)
        end.setHours(23, 59, 59, 999)
      }
      break
    default:
      start = new Date(lagosNow)
      start.setHours(0, 0, 0, 0)
      end = new Date(lagosNow)
      end.setHours(23, 59, 59, 999)
  }
  return { start, end }
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ filter?: string; from?: string; to?: string }> }) {
  const { filter = 'today', from, to } = await searchParams

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { start, end } = getLagosDateRange(filter, from, to)
  const startISO = start.toISOString()
  const endISO = end.toISOString()
  const startDateOnly = start.toISOString().split('T')[0]
  const endDateOnly = end.toISOString().split('T')[0]

  const { data: salesData } = await supabase.from('sales').select('amount, payment_method, sale_date, type').gte('sale_date', startDateOnly).lte('sale_date', endDateOnly)
  const { data: txData } = await supabase.from('transactions').select('amount, payment_method, transaction_date, transaction_type').gte('transaction_date', startISO).lte('transaction_date', endISO)
  const { data: repairsData } = await supabase.from('repair_jobs').select('repair_cost, amount_paid, date_received').gte('date_received', startISO).lte('date_received', endISO)

  const sales = (salesData as SaleRow[] | null) || []
  const transactions = (txData as TransactionRow[] | null) || []
  const repairs = (repairsData as RepairRow[] | null) || []

  const totalSales = sales.reduce((s, r) => s + Number(r.amount), 0)
  const totalTransactions = transactions.reduce((s, r) => s + Number(r.amount), 0)
  const totalRevenue = totalSales + totalTransactions

  const cash = [...sales.filter((s) => s.payment_method === 'cash'), ...transactions.filter((t) => t.payment_method === 'cash')].reduce((s, r) => s + Number(r.amount), 0)
  const transfer = [...sales.filter((s) => s.payment_method === 'transfer'), ...transactions.filter((t) => t.payment_method === 'transfer')].reduce((s, r) => s + Number(r.amount), 0)
  const pos = [...sales.filter((s) => s.payment_method === 'pos'), ...transactions.filter((t) => t.payment_method === 'pos')].reduce((s, r) => s + Number(r.amount), 0)

  const totalRepairCost = repairs.reduce((s, r) => s + Number(r.repair_cost || 0), 0)
  const totalPaidRepairs = repairs.reduce((s, r) => s + Number(r.amount_paid || 0), 0)

  const filterLabel =
    filter === 'today'
      ? 'Today'
      : filter === 'yesterday'
        ? 'Yesterday'
        : filter === 'last7'
          ? 'Last 7 Days'
          : filter === 'thisMonth'
            ? 'This Month'
            : `${from} to ${to}`

  return (
    <div className="p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-blue-100">Financial summary for {filterLabel} — Lagos timezone</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'last7', label: 'Last 7 Days' },
          { key: 'thisMonth', label: 'This Month' },
        ].map((f) => (
          <a
            key={f.key}
            href={`/reports?filter=${f.key}`}
            className={`rounded-full px-4 py-2 text-xs font-bold ${filter === f.key ? 'bg-[#2563EB] text-white' : 'border border-blue-200 bg-white text-[#2563EB] hover:bg-[#EFF6FF]'}`}
          >
            {f.label}
          </a>
        ))}
        <form className="ml-2 flex items-center gap-2">
          <input type="hidden" name="filter" value="custom" />
          <input type="date" name="from" defaultValue={from} className="rounded-lg border border-blue-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]" />
          <input type="date" name="to" defaultValue={to} className="rounded-lg border border-blue-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]" />
          <button className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-bold text-white hover:bg-[#172554]">Filter</button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">₦{totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{sales.length + transactions.length} payments</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700">Cash</p>
          <p className="mt-2 text-2xl font-bold text-green-700">₦{cash.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Transfer</p>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">₦{transfer.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">POS</p>
          <p className="mt-2 text-2xl font-bold text-purple-700">₦{pos.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#2563EB]">Repair Jobs</p>
          <p className="mt-2 text-xl font-bold text-[#1E3A8A]">{repairs.length}</p>
          <p className="mt-1 text-xs text-slate-500">Total cost: ₦{totalRepairCost.toLocaleString()} / Paid: ₦{totalPaidRepairs.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#2563EB]">Sales Count</p>
          <p className="mt-2 text-xl font-bold text-[#1E3A8A]">{sales.length} sales</p>
          <p className="mt-1 text-xs text-slate-500">From sales table</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#2563EB]">Transactions</p>
          <p className="mt-2 text-xl font-bold text-[#1E3A8A]">{transactions.length} tx</p>
          <p className="mt-1 text-xs text-slate-500">From transactions table</p>
        </div>
      </div>
    </div>
  )
}