'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  customerId: string
  customerName: string
}

export default function DeviceForm({ customerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const payload = {
      customer_id: customerId,
      brand: String(fd.get('brand') || '').trim(),
      model: String(fd.get('model') || '').trim(),
      device_type: String(fd.get('device_type') || 'phone'),
      color: String(fd.get('color') || '').trim() || null,
      imei: String(fd.get('imei') || '').trim() || null,
      serial_number: String(fd.get('serial_number') || '').trim() || null,
      condition_notes: String(fd.get('condition_notes') || '').trim() || null,
    }

    if (!payload.brand || !payload.model) {
      setError('Brand and Model are required.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/devices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unable to save device.')
        setLoading(false)
        return
      }
      router.push(`/customers/${customerId}`)
      router.refresh()
    } catch {
      setError('Unable to save device.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Brand *</label>
          <input name="brand" required placeholder="【entity-Samsung¦canonical_name=Samsung】" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Model *</label>
          <input name="model" required placeholder="Galaxy S24" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Device Type *</label>
          <select name="device_type" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100">
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="laptop">Laptop</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Color</label>
          <input name="color" placeholder="Black" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">IMEI</label>
          <input name="imei" placeholder="IMEI number" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Serial Number</label>
          <input name="serial_number" placeholder="Serial number" className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Device Condition / Notes</label>
        <textarea name="condition_notes" rows={4} placeholder="Cracked screen, missing back cover, etc." className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-2">
        <Link href={`/customers/${customerId}`} className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center text-sm font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF]">Cancel</Link>
        <button disabled={loading} type="submit" className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Device'}
        </button>
      </div>
    </form>
  )
}