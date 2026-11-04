import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type ExpenseRow = {
  id: string
  amount: string | number
  category: string | null
  description: string | null
  expense_date: string | null
  created_at: string
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
      start = new Date(lagosNow.getFullYear(), lagosNow.getMonth(), 1)
      end = new Date(lagosNow)
      end.setHours(23, 59, 59, 999)
  }
  return { start, end }
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ filter?: string; from?: string; to?: string }> }) {
  const { filter = 'thisMonth', from, to } = await searchParams

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'
  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { start, end } = getLagosDateRange(filter, from, to)

  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, category, description, expense_date, created_at')
    .gte('expense_date', start.toISOString().split('T')[0])
    .lte('expense_date', end.toISOString().split('T')[0])
    .order('expense_date', { ascending: false })

  if (error) throw new Error('Unable to load expenses: ' + error.message)

  const expenses = (data as ExpenseRow[] | null) || []
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

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
      <div className="flex flex-col gap-4 rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Expenses</h1>
          <p className="mt-1 text-sm text-blue-100">Track workshop expenses for {filterLabel} — Lagos timezone</p>
        </div>
        <Link href="/expenses/new" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2563EB] shadow hover:bg-blue-50">
          + Add Expense
        </Link>
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
            href={`/expenses?filter=${f.key}`}
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

      <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Total Expenses — {filterLabel}</p>
        <p className="mt-2 text-3xl font-bold text-[#1E3A8A]">₦{total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-slate-500">{expenses.length} records</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#2563EB] text-white">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">Date</th>
                <th className="px-5 py-4 text-sm font-semibold">Category</th>
                <th className="px-5 py-4 text-sm font-semibold">Description</th>
                <th className="px-5 py-4 text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-blue-50 hover:bg-[#EFF6FF]">
                  <td className="px-5 py-4 text-sm text-[#2563EB]">
                    {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className="rounded-full border border-blue-200 bg-[#EFF6FF] px-3 py-1 text-xs font-medium capitalize text-[#2563EB]">{e.category || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">{e.description || '—'}</td>
                  <td className="px-5 py-4 text-sm font-bold text-red-600">₦{Number(e.amount).toLocaleString()}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                    No expenses for {filterLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}