'use client'
import PhoneCheck from './phone-check'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ExistingCustomer = {
  id: string
  full_name: string
  phone: string
  email?: string | null
}

type CheckPhoneResponse = {
  exists: boolean
  customer?: ExistingCustomer
}

export default function CustomerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const initialPhone = searchParams.get('phone') || searchParams.get('search') || ''

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<ExistingCustomer | null>(null)
  const [allowDuplicate, setAllowDuplicate] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    const trimmedPhone = phone.trim()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    if (!allowDuplicate) {
      try {
        const res = await fetch(`/api/customers/check-phone?phone=${encodeURIComponent(trimmedPhone)}`)
        const json = (await res.json()) as CheckPhoneResponse
        if (json.exists && json.customer) {
          setDuplicate(json.customer)
          setSaving(false)
          return
        }
      } catch {
        // ignore check error
      }
    }

    const { error } = await supabase.from('customers').insert({
      full_name: fullName.trim(),
      phone: trimmedPhone,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/customers')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] sm:text-3xl">Register Customer</h1>
          <p className="mt-2 text-sm text-[#1D4ED8]">Add a customer before registering their device.</p>
        </div>
        <PhoneCheck initialPhone={initialPhone} />
        {duplicate && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800">Phone number already exists</h3>
            <p className="mt-1 text-sm text-amber-700">
              Customer <span className="font-semibold">{duplicate.full_name}</span> with phone <span className="font-semibold">{duplicate.phone}</span> already exists.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href={`/customers/${duplicate.id}`} className="inline-flex justify-center rounded-xl bg-white border border-amber-300 px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100">Show existing customer</Link>
              <button type="button" onClick={() => { setAllowDuplicate(true); setDuplicate(null) }} className="inline-flex justify-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Continue registration</button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Full Name *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" placeholder="Customer full name" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Phone Number *</label>
              <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setDuplicate(null); setAllowDuplicate(false) }} required className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" placeholder="08012345678" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" placeholder="customer@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" placeholder="Customer address" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1E3A8A]">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" placeholder="Additional information" />
            </div>
          </div>
          {error && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.back()} className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-[#1E3A8A]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50">{saving ? 'Saving...' : 'Save Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}