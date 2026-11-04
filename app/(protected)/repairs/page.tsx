import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type CustomerJoin = {
  full_name: string | null
  phone: string | null
}

type DeviceJoin = {
  brand: string | null
  model: string | null
}

type TechnicianJoin = {
  full_name: string | null
}

type RepairRow = {
  id: string
  problem_description: string | null
  repair_cost: string | number | null
  amount_paid: string | number | null
  status: string
  date_received: string
  customers: CustomerJoin | CustomerJoin[] | null
  devices: DeviceJoin | DeviceJoin[] | null
  technician: TechnicianJoin | TechnicianJoin[] | null
}

function getSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function RepairsPage() {
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  let query = supabase
    .from('repair_jobs')
    .select(
      `id, problem_description, repair_cost, amount_paid, status, date_received, customers (full_name, phone), devices (brand, model), technician:profiles!repair_jobs_technician_id_fkey (full_name)`
    )

  if (!isAdmin) {
    query = query.eq('technician_id', profile.id)
  }

  const { data, error } = await query.order('date_received', { ascending: false })
  if (error) throw new Error('Unable to load repair jobs.')

  const repairs = data as RepairRow[]

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-xl bg-[#2563EB] p-5 text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Repair Jobs</h1>
          <p className="mt-2 text-sm text-blue-100">Track customer devices from intake to collection.</p>
        </div>
        <Link
          href="/repairs/new"
          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
        >
          + New Repair Job
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w- text-left">
            <thead className="bg-[#2563EB] text-white">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">Customer</th>
                <th className="px-5 py-4 text-sm font-semibold">Device</th>
                <th className="px-5 py-4 text-sm font-semibold">Problem</th>
                <th className="px-5 py-4 text-sm font-semibold">Technician</th>
                <th className="px-5 py-4 text-sm font-semibold">Status</th>
                <th className="px-5 py-4 text-sm font-semibold">Balance</th>
                <th className="px-5 py-4 text-sm font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {repairs?.map((repair) => {
                const customer = getSingle(repair.customers)
                const device = getSingle(repair.devices)
                const technician = getSingle(repair.technician)
                const balance = Number(repair.repair_cost || 0) - Number(repair.amount_paid || 0)
                return (
                  <tr key={repair.id} className="border-b border-blue-100 transition-colors hover:bg-[#EFF6FF]">
                    <td className="px-5 py-4">
                      <Link href={`/repairs/${repair.id}`} className="hover:underline">
                        <p className="text-sm font-medium text-[#1D4ED8]">{customer?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-[#2563EB]">{customer?.phone || '—'}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {device?.brand} {device?.model}
                    </td>
                    <td className="max-w- px-5 py-4 text-sm text-slate-700 truncate">{repair.problem_description}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{technician?.full_name || 'Unassigned'}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium capitalize text-white">
                        {repair.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">₦{balance.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/receipt/repair/${repair.id}`}
                        className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-sm transition-all"
                      >
                        Print
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!repairs || repairs.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#2563EB]">
                    No repair jobs registered yet.
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