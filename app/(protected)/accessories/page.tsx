import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type AccessoryRow = {
  id: string
  name: string
  selling_price: string | number
  stock_quantity: number
  category: string | null
  created_at: string
}

export default async function AccessoriesPage() {
  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accessories')
    .select('id, name, selling_price, stock_quantity, category, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Unable to load accessories: ' + error.message)
  }

  const accessories = (data as AccessoryRow[] | null) || []
  const totalItems = accessories.length
  const totalStock = accessories.reduce((sum, a) => sum + Number(a.stock_quantity || 0), 0)
  const totalValue = accessories.reduce((sum, a) => sum + Number(a.selling_price || 0) * Number(a.stock_quantity || 0), 0)
  const lowStock = accessories.filter((a) => Number(a.stock_quantity) <= 3).length

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white">A</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Accessories</h1>
              <p className="mt-1 text-sm text-blue-100">
                {totalItems} items • {totalStock} units • ₦{totalValue.toLocaleString()} value
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link href="/accessories/new" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#2563EB] shadow hover:bg-blue-50">
              + Add
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Total Value</p>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">₦{totalValue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{totalStock} units in stock</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Items</p>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">{totalItems}</p>
          <p className="mt-1 text-xs text-slate-500">{lowStock} low stock</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${lowStock > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${lowStock > 0 ? 'text-red-700' : 'text-green-700'}`}>Low Stock Alert</p>
          <p className={`mt-2 text-2xl font-bold ${lowStock > 0 ? 'text-red-700' : 'text-green-700'}`}>{lowStock}</p>
          <p className="mt-1 text-xs text-slate-500">Items ≤ 3 units</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {accessories.length === 0 && (
          <div className="rounded-2xl border border-blue-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#1E3A8A]">No accessories yet</p>
            <p className="mt-1 text-xs text-slate-500">Add your first USB cable, pouch, charger etc</p>
            {isAdmin && (
              <Link href="/accessories/new" className="mt-4 inline-block rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white">
                Add Accessory
              </Link>
            )}
          </div>
        )}

        {accessories.map((acc) => {
          const isLow = Number(acc.stock_quantity) <= 3
          const isOut = Number(acc.stock_quantity) === 0
          return (
            <div
              key={acc.id}
              className={`flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${isOut ? 'border-red-200' : isLow ? 'border-amber-200' : 'border-blue-200 hover:border-blue-300'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-[#EFF6FF] text-[#2563EB]'}`}
                >
                  {acc.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[#1E3A8A]">{acc.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-[#2563EB]">₦{Number(acc.selling_price).toLocaleString()}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      Stock: {acc.stock_quantity} {isLow ? '⚠' : ''}
                    </span>
                    <span className="capitalize text-slate-400">{acc.category || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/accessories/${acc.id}/sell`} className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800">
                  Sell
                </Link>
                {isAdmin && (
                  <Link href={`/accessories/${acc.id}/edit`} className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-4 py-2 text-xs font-bold text-[#1D4ED8]">
                    Edit
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}