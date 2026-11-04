import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import CustomerEditForm from '../../components/customer-edit-form'

export const dynamic = 'force-dynamic'

type CustomerRow = {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
}

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getCurrentProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, address, notes')
    .eq('id', id)
    .single<CustomerRow>()

  if (error || !data) notFound()

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="mx-auto max-w-3xl">
        <CustomerEditForm customer={data} />
      </div>
    </div>
  )
}