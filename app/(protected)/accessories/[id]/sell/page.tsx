import RestockForm from '@/components/accessories/restock-form'
import { createClient } from '@/lib/supabase/server'
import SellForm from '@/app/(protected)/accessories/sell/sell-form'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type AccessoryRow = {
  id: string
  name: string
  selling_price: number | string
  stock_quantity: number
  category: string | null
}

export default async function SellAccessoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: acc, error } = await supabase
    .from('accessories')
    .select('id, name, selling_price, stock_quantity, category')
    .eq('id', id)
    .single()

  if (error || !acc) return <div className="p-6">Not found — ID: {id}</div>

  const accessory = acc as AccessoryRow

  return (
    <div className="p-6">
      <div className="mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#1E3A8A]">Sell {accessory.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stock: {accessory.stock_quantity} | Price: ₦{Number(accessory.selling_price).toLocaleString()}
        </p>
        <div className="mt-5">
          <SellForm acc={accessory} />
        </div>
      </div>

      {isAdmin && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-[#1E3A8A]">Restock (Admin Only)</h3>
          <div className="mt-4">
            <RestockForm id={accessory.id} currentStock={accessory.stock_quantity} />
          </div>
        </div>
      )}
    </div>
  )
}