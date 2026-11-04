import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type SaleRow = {
  id: string
  type: string
  description: string | null
  amount: string | number
  payment_method: string
  sale_date: string
  created_at: string
  repair_job_id: string | null
}

export default async function SalesPage() {
  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, type, description, amount, payment_method, sale_date, created_at, repair_job_id')
    .order('sale_date', { ascending: false })

  if (error) {
    throw new Error('Unable to load sales: ' + error.message)
  }

  const totalSales = sales?.reduce((total, sale) => total + Number(sale.amount), 0) || 0

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Sales</h1>
          <p className="mt-1 text-sm text-blue-100">Record and monitor money received by the workshop</p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 shadow"
        >
          + Record Sale
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Total Recorded Sales</p>
        <p className="mt-2 text-3xl font-bold text-[#1E3A8A]">₦{totalSales.toLocaleString()}</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w- text-left">
            <thead className="bg-[#2563EB] text-white">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">Description</th>
                <th className="px-5 py-4 text-sm font-semibold">Type</th>
                <th className="px-5 py-4 text-sm font-semibold">Amount</th>
                <th className="px-5 py-4 text-sm font-semibold">Payment</th>
                <th className="px-5 py-4 text-sm font-semibold">Date</th>
                <th className="px-5 py-4 text-sm font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {(sales as SaleRow[])?.map((sale) => (
                <tr key={sale.id} className="border-b border-blue-50 hover:bg-[#EFF6FF]">
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">{sale.description || '—'}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium text-white capitalize">
                      {sale.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">₦{Number(sale.amount).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm capitalize text-slate-600">{sale.payment_method}</td>
                  <td className="px-5 py-4 text-sm text-[#2563EB]">
                    {new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/receipt/sale/${sale.id}`}
                      className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-sm transition-all"
                    >
                      Print
                    </Link>
                  </td>
                </tr>
              ))}
              {(!sales || sales.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                    No sales recorded yet
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