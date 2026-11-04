import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type RepairRow = {
  id: string
  status: string
  problem_description: string
  repair_cost: number | string
  amount_paid: number | string
  created_at: string
}

type CustomerRow = {
  id: string
  full_name: string
  phone: string
}

type DeviceRow = {
  id: string
  brand: string
  model: string
  device_type: string
  imei: string | null
  serial_number: string | null
  color: string | null
  condition_notes: string | null
  created_at: string
  customer_id: string
  customers: CustomerRow | null
  repair_jobs: RepairRow[] | null
}

export default async function DeviceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getCurrentProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devices')
    .select(`
      id,
      brand,
      model,
      device_type,
      imei,
      serial_number,
      color,
      condition_notes,
      created_at,
      customer_id,
      customers ( id, full_name, phone ),
      repair_jobs ( id, status, problem_description, repair_cost, amount_paid, created_at )
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const device = data as unknown as DeviceRow

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href="/devices" className="text-sm font-semibold text-[#2563EB] hover:underline">← Back to Devices</Link>
      <h1 className="mt-4 text-2xl font-bold text-[#1E3A8A]">{device.brand} {device.model}</h1>
      <p className="mt-1 text-sm text-slate-600">Customer: {device.customers?.full_name} — {device.customers?.phone}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-blue-200 bg-white p-6">
          <h2 className="font-semibold text-[#1E3A8A]">Device Info</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-slate-500">Type:</span> {device.device_type}</p>
            <p><span className="text-slate-500">IMEI:</span> {device.imei || '—'}</p>
            <p><span className="text-slate-500">Serial:</span> {device.serial_number || '—'}</p>
            <p><span className="text-slate-500">Color:</span> {device.color || '—'}</p>
            <p><span className="text-slate-500">Notes:</span> {device.condition_notes || '—'}</p>
          </div>
          <div className="mt-6 flex gap-2">
            <Link href={`/customers/${device.customer_id}`} className="rounded-lg border px-4 py-2 text-sm font-semibold">View Customer</Link>
            <Link href={`/repairs/new?device_id=${device.id}`} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">+ New Repair</Link>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-white p-6">
          <h2 className="font-semibold text-[#1E3A8A]">Repair History ({device.repair_jobs?.length || 0})</h2>
          <div className="mt-4 space-y-3">
            {device.repair_jobs?.map(r => (
              <Link key={r.id} href={`/repairs/${r.id}`} className="flex justify-between rounded-xl border p-3 hover:bg-[#EFF6FF]">
                <span className="text-sm">{r.problem_description.slice(0,40)}</span>
                <span className="text-xs font-semibold capitalize text-[#2563EB]">{r.status.replace('_',' ')}</span>
              </Link>
            )) || <p className="text-sm text-slate-500">No repairs yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}