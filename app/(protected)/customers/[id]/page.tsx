import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type RepairJobRow = {
  id: string
  status: string
  problem_description: string
  repair_cost: number | string
  amount_paid: number | string
  created_at: string
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
  repair_jobs: RepairJobRow[] | null
}

type CustomerRow = {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  created_at: string
  devices: DeviceRow[] | null
}

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await getCurrentProfile()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select(`
      id,
      full_name,
      phone,
      email,
      address,
      created_at,
      devices (
        id,
        brand,
        model,
        device_type,
        imei,
        serial_number,
        color,
        condition_notes,
        repair_jobs (
          id,
          status,
          problem_description,
          repair_cost,
          amount_paid,
          created_at
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const customer = data as CustomerRow
  const devices = customer.devices || []

  const repairCount = devices.reduce(
    (total, device) => total + (device.repair_jobs?.length || 0),
    0
  )

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {customer.full_name}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Customer profile and repair history
          </p>
        </div>

        <Link
          href="/customers"
          className="inline-flex justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
        >
          Back to Customers
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold">Customer Information</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="mt-1 font-medium">{customer.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="mt-1 font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 font-medium">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="mt-1 font-medium">{customer.address || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-slate-500">Devices</p>
                <p className="mt-1 text-xl font-bold text-[#2563EB]">{devices.length}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-slate-500">Repairs</p>
                <p className="mt-1 text-xl font-bold text-[#2563EB]">{repairCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Registered Devices</h2>
              <p className="mt-1 text-sm text-slate-500">Devices belonging to this customer.</p>
            </div>
            <Link
              href={`/devices/new?customer_id=${customer.id}`}
              className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Device
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{device.brand} {device.model}</p>
                    <p className="mt-1 text-xs text-slate-500">{device.device_type}</p>
                    <p className="mt-1 text-xs text-slate-500">IMEI: {device.imei || '—'}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                    {device.repair_jobs?.length || 0} repairs
                  </span>
                </div>
              </div>
            ))}
            {devices.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No devices registered yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Repair History</h2>
          <p className="mt-1 text-sm text-slate-500">All repairs associated with this customer.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w- text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">Device</th>
                <th className="px-5 py-4 text-sm font-semibold">Problem</th>
                <th className="px-5 py-4 text-sm font-semibold">Status</th>
                <th className="px-5 py-4 text-sm font-semibold">Cost</th>
                <th className="px-5 py-4 text-sm font-semibold">Paid</th>
                <th className="px-5 py-4 text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.flatMap((device) =>
                (device.repair_jobs || []).map((repair) => (
                  <tr key={repair.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm">{device.brand} {device.model}</td>
                    <td className="max-w- truncate px-5 py-4 text-sm">{repair.problem_description}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-[#2563EB]">{repair.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-4 text-sm">₦{Number(repair.repair_cost).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm">₦{Number(repair.amount_paid).toLocaleString()}</td>
                    <td className="px-5 py-4"><Link href={`/repairs/${repair.id}`} className="text-sm font-semibold text-[#2563EB] hover:underline">View</Link></td>
                  </tr>
                ))
              )}
              {repairCount === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No repair history yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}