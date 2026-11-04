import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string
}

type CustomerLite = { full_name: string | null; phone: string | null } | null
type DeviceLite = { brand: string | null; model: string | null } | null

type RepairRow = {
  id: string
  problem_description: string | null
  diagnosis: string | null
  repair_cost: number | string | null
  amount_paid: number | string | null
  status: string
  date_received: string | null
  expected_completion: string | null
  customers: CustomerLite | CustomerLite[]
  devices: DeviceLite | DeviceLite[]
}

export default async function MyRepairsPage() {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as ProfileRow

  if (!profile || !profile.id) redirect('/login')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_jobs')
    .select(`
      id,
      problem_description,
      diagnosis,
      repair_cost,
      amount_paid,
      status,
      date_received,
      expected_completion,
      customers (full_name, phone),
      devices (brand, model)
    `)
    .eq('technician_id', profile.id)
    .order('date_received', { ascending: false })

  if (error) throw new Error('Unable to load assigned repairs: ' + error.message)

  const repairs = (data as RepairRow[] | null) || []

  return (
    <div className="p-6">
      <div className="rounded-xl bg-[#2563EB] p-5 text-white shadow-md">
        <h1 className="text-2xl font-bold text-white">My Repairs</h1>
        <p className="mt-1 text-sm text-blue-100">Repairs assigned to you — {profile.full_name || 'Technician'}</p>
      </div>

      <div className="mt-6 grid gap-4">
        {repairs.map((repair) => {
          const customer = Array.isArray(repair.customers) ? repair.customers[0] : repair.customers
          const device = Array.isArray(repair.devices) ? repair.devices[0] : repair.devices

          return (
            <Link
              key={repair.id}
              href={`/repairs/${repair.id}`}
              className="block rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm transition-all hover:bg-[#DBEAFE] hover:shadow-md hover:border-blue-300"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[#1D4ED8]">
                    {device?.brand || '—'} {device?.model || ''}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#2563EB]">
                    {customer?.full_name || 'Unknown'} <span className="text-blue-400">• {customer?.phone || '—'}</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-700">
                    {repair.problem_description || 'No description'}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium capitalize text-white">
                  {repair.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          )
        })}

        {repairs.length === 0 && (
          <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-8 text-center text-sm text-[#2563EB]">
            No repairs are currently assigned to you.
          </div>
        )}
      </div>
    </div>
  )
}