import Link from 'next/link'
import PaymentForm from './payment-form'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import StatusControl from '@/components/repairs/status-control'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type SalePayment = {
  id: string
  amount: string | number
  payment_method: string
  sale_date: string
  created_at: string
}

type CustomerJoin = {
  full_name: string | null
  phone: string | null
  email: string | null
  address: string | null
}

type DeviceJoin = {
  brand: string | null
  model: string | null
  device_type: string | null
  imei: string | null
  serial_number: string | null
}

type TechnicianJoin = {
  full_name: string | null
}

type RepairWithJoins = {
  id: string
  technician_id: string | null
  problem_description: string | null
  diagnosis: string | null
  repair_cost: string | number | null
  status: string
  customers: CustomerJoin | CustomerJoin[] | null
  devices: DeviceJoin | DeviceJoin[] | null
  technician: TechnicianJoin | TechnicianJoin[] | null
}

function getSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function RepairDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) return notFound()

  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('repair_jobs')
    .select(
      `*, customers (full_name, phone, email, address), devices (brand, model, device_type, imei, serial_number), technician:profiles!repair_jobs_technician_id_fkey (full_name)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return notFound()
  const repair = data as RepairWithJoins

  const { data: payments } = await supabase
    .from('sales')
    .select('id, amount, payment_method, sale_date, created_at')
    .eq('repair_job_id', id)
    .in('type', ['repair', 'deposit', 'balance'])
    .order('created_at', { ascending: false })

  const customer = getSingle(repair.customers)
  const device = getSingle(repair.devices)
  const technician = getSingle(repair.technician)

  const repairCost = Number(repair.repair_cost || 0)
  const paymentList = (payments as SalePayment[] | null) ?? []
  const amountPaid = paymentList.reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = Math.max(repairCost - amountPaid, 0)

  // 2-role logic: admin group = admin/manager/owner can update all, apprentice group = technician/sales/apprentice can update own only
  const canUpdateStatus = isAdmin || repair.technician_id === profile.id

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-xl bg-[#2563EB] p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Repair Details</h1>
            <p className="mt-2 text-sm text-blue-100">View and manage this repair job — #{repair.id.slice(0, 8)}</p>
          </div>
          <Link
            href={`/receipt/repair/${repair.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#2563EB] hover:bg-blue-50 shadow"
          >
            Print Receipt
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Customer</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <strong className="text-[#2563EB]">Name:</strong> {customer?.full_name || '—'}
            </p>
            <p>
              <strong className="text-[#2563EB]">Phone:</strong> {customer?.phone || '—'}
            </p>
            <p>
              <strong className="text-[#2563EB]">Email:</strong> {customer?.email || '—'}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Device</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <strong className="text-[#2563EB]">Device:</strong> {device?.brand} {device?.model}
            </p>
            <p>
              <strong className="text-[#2563EB]">Type:</strong> {device?.device_type || '—'}
            </p>
            <p>
              <strong className="text-[#2563EB]">IMEI:</strong> {device?.imei || '—'}
            </p>
            <p>
              <strong className="text-[#2563EB]">Serial:</strong> {device?.serial_number || '—'}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Repair</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-[#2563EB]">Problem Reported</p>
              <p className="mt-1 text-slate-700">{repair.problem_description || 'No description'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#2563EB]">Diagnosis</p>
              <p className="mt-1 text-slate-700">{repair.diagnosis || 'Not diagnosed yet'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#2563EB]">Technician</p>
              <p className="mt-1 font-medium text-slate-700">{technician?.full_name || 'Unassigned'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Financial Information</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#EFF6FF] p-4 border border-blue-100">
              <p className="text-xs font-semibold text-[#2563EB]">Repair Cost</p>
              <p className="mt-1 text-xl font-bold text-[#1E3A8A]">₦{repairCost.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4 border border-green-200">
              <p className="text-xs font-semibold text-green-700">Paid</p>
              <p className="mt-1 text-xl font-bold text-green-600">₦{amountPaid.toLocaleString()}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-[#2563EB] p-4 shadow-md">
              <p className="text-xs text-blue-100">Outstanding</p>
              <p className="mt-1 text-2xl font-bold text-white">₦{outstanding.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/receipt/repair/${repair.id}`}
              className="block w-full rounded-xl bg-[#1E3A8A] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#172554]"
            >
              View Printable Receipt
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-5">
        <PaymentForm repairId={repair.id} outstanding={outstanding} />
      </section>

      <section className="mt-5 rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#1E3A8A]">Payment History</h3>
          <Link href={`/receipt/repair/${repair.id}`} className="text-xs font-bold text-[#2563EB] hover:underline">
            Print Latest
          </Link>
        </div>
        {paymentList.length === 0 ? (
          <p className="text-sm text-[#2563EB]">No payments yet</p>
        ) : (
          paymentList.map((p) => (
            <div key={p.id} className="flex justify-between py-3 border-b border-blue-100 text-sm">
              <span className="text-slate-600">
                {new Date(p.sale_date || p.created_at).toLocaleDateString()} -{' '}
                <span className="capitalize font-medium text-[#2563EB]">{p.payment_method}</span>
              </span>
              <span className="font-bold text-[#1D4ED8]">₦{Number(p.amount).toLocaleString()}</span>
            </div>
          ))
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <StatusControl repairId={repair.id} currentStatus={repair.status} isAdmin={canUpdateStatus} />
      </section>
    </div>
  )
}