'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CustomerRow = {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
}

export default function CustomerEditForm({ customer }: { customer: CustomerRow }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      full_name: String(fd.get('full_name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      email: String(fd.get('email') || '').trim() || null,
      address: String(fd.get('address') || '').trim() || null,
      notes: String(fd.get('notes') || '').trim() || null,
    }

    const res = await fetch(`/api/customers/${customer.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Update failed')
      setLoading(false)
      return
    }
    router.push(`/customers/${customer.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-blue-200 bg-white p-6 space-y-5">
      <h1 className="text-xl font-bold text-[#1E3A8A]">Edit Customer</h1>
      <input name="full_name" defaultValue={customer.full_name} required className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="phone" defaultValue={customer.phone} required className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="email" defaultValue={customer.email || ''} className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="Email" />
      <input name="address" defaultValue={customer.address || ''} className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="Address" />
      <textarea name="notes" defaultValue={customer.notes || ''} rows={3} className="w-full rounded-xl border px-4 py-3 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white">{loading ? 'Saving...' : 'Save Changes'}</button>
    </form>
  )
}