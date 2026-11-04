import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

export default async function EditAccessoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: acc } = await supabase
    .from('accessories')
    .select('id, name, category, selling_price, stock_quantity')
    .eq('id', paramId)
    .single()

  if (!acc) return <div className="p-6">Not found — ID: {paramId}. Check Supabase table has this row.</div>

  async function updateAccessory(formData: FormData) {
    'use server'
    const profileInner = await getCurrentProfile()
    const roleInner = profileInner.role as StaffRole
    const isAdminInner = roleInner === 'admin' || roleInner === 'manager' || roleInner === 'owner'

    if (!isAdminInner) {
      redirect('/dashboard')
    }

    const supabaseInner = await createClient()

    const id = String(formData.get('id'))
    const name = String(formData.get('name')).trim()
    const category = String(formData.get('category')).trim()
    const selling_price = Number(formData.get('selling_price'))
    const stock_quantity = Number(formData.get('stock_quantity'))

    if (!name) throw new Error('Name required')
    if (selling_price < 0) throw new Error('Invalid price')
    if (stock_quantity < 0) throw new Error('Invalid stock')

    const { error } = await supabaseInner
      .from('accessories')
      .update({
        name,
        category,
        selling_price,
        stock_quantity,
      })
      .eq('id', id)

    if (error) throw new Error('Unable to update: ' + error.message)

    redirect('/accessories')
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#1E3A8A]">Edit {acc.name}</h1>
        <form action={updateAccessory} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={acc.id} />
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Name</label>
            <input name="name" defaultValue={acc.name} required className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Category</label>
            <select name="category" defaultValue={acc.category || 'general'} className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100">
              <option value="charger">Charger</option>
              <option value="cable">Cable</option>
              <option value="case">Case</option>
              <option value="screen_guard">Screen Guard</option>
              <option value="battery">Battery</option>
              <option value="other">Other</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Selling Price (₦)</label>
            <input name="selling_price" type="number" step="0.01" min="0" defaultValue={acc.selling_price} required className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Stock Quantity</label>
            <input name="stock_quantity" type="number" min="0" defaultValue={acc.stock_quantity} required className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
          </div>
          <button className="w-full rounded-xl bg-[#2563EB] py-3 font-semibold text-white shadow hover:bg-blue-700">Update Accessory</button>
        </form>
      </div>
    </div>
  )
}