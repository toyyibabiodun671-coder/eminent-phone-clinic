import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import DeviceForm from '../components/device-form'

export const dynamic = 'force-dynamic'

type CustomerRow = {
  id: string
  full_name: string
  phone: string
}

export default async function NewDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string }>
}) {
  await getCurrentProfile()
  const params = await searchParams
  const customerId = params.customer_id

  if (!customerId) {
    redirect('/customers')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('id', customerId)
    .single<CustomerRow>()

  if (error || !data) {
    redirect('/customers')
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href={`/customers/${data.id}`} className="text-sm font-semibold text-[#2563EB] hover:underline">
            ← Back to Customer
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#1E3A8A] sm:text-3xl">Register Device</h1>
          <p className="mt-2 text-sm text-[#1D4ED8]">Register a device for {data.full_name}.</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 rounded-xl bg-[#EFF6FF] border border-blue-200 p-4">
            <p className="text-xs font-semibold text-[#1D4ED8]">Customer</p>
            <p className="mt-1 font-bold text-[#1E3A8A]">{data.full_name}</p>
            <p className="mt-1 text-sm text-slate-600">{data.phone}</p>
          </div>

          <DeviceForm customerId={data.id} customerName={data.full_name} />
        </div>
      </div>
    </div>
  )
}