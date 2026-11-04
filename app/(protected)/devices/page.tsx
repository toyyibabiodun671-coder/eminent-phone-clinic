import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type CustomerJoin = {
  full_name: string
  phone: string
}

type DeviceRow = {
  id: string
  brand: string
  model: string
  device_type: string
  imei: string | null
  created_at: string
  customers: CustomerJoin | CustomerJoin[] | null
}

export default async function DevicesPage() {
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
      created_at,
      customers (
        full_name,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .returns<DeviceRow[]>()

  if (error) {
    throw new Error('Unable to load devices.')
  }

  const devices = (data || []) as DeviceRow[]

  return (
    <div className="p-2">
      <div className="flex flex-col gap-4 rounded-xl bg-[#2563EB] p-6 text-white shadow-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Devices</h1>
          <p className="mt-2 text-sm text-blue-100">Manage customer devices registered at the workshop.</p>
        </div>
        <Link
          href="/devices/new"
          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#2563EB] shadow-sm hover:bg-blue-50 transition-colors"
        >
          + Add Device
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w- text-left">
            <thead className="border-b border-blue-200 bg-[#EFF6FF]">
              <tr>
                <th className="px-5 py-4 text-sm font-bold text-[#1E3A8A]">Customer</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1E3A8A]">Device</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1E3A8A]">Type</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1E3A8A]">IMEI</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1E3A8A]">Registered</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => {
                const customer = Array.isArray(device.customers)
                  ? device.customers[0]
                  : device.customers

                return (
                  <tr key={device.id} className="border-b border-blue-100 hover:bg-[#EFF6FF] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#1E3A8A]">{customer?.full_name || 'Unknown'}</p>
                      <p className="text-xs font-medium text-[#2563EB]">{customer?.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium">
                      <Link href={`/devices/${device.id}`} className="hover:underline text-[#1E3A8A]">
                        {device.brand} {device.model}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm capitalize">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">{device.device_type}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{device.imei || '—'}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">{new Date(device.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm font-medium text-[#2563EB]">No devices registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}