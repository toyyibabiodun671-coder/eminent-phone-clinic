'use client'

import { useState } from 'react'
import Link from 'next/link'

type Customer = {
  id: string
  full_name: string
  phone: string
  email?: string | null
}

type CheckResponse = {
  exists: boolean
  customer?: Customer
  error?: string
}

export default function PhoneCheck({ initialPhone = '' }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [hasChecked, setHasChecked] = useState(false)

  async function checkPhone() {
    const value = phone.trim()
    setCustomer(null)
    setError('')
    setHasChecked(false)

    if (!value) {
      setError('Enter a phone number first.')
      return
    }

    setChecking(true)

    try {
      const response = await fetch(
        `/api/customers/check-phone?phone=${encodeURIComponent(value)}`
      )
      const result = (await response.json()) as CheckResponse

      if (!response.ok) {
        setError(result.error || 'Unable to check phone number.')
        return
      }

      setHasChecked(true)
      if (result.exists && result.customer) {
        setCustomer(result.customer)
      } else {
        setCustomer(null)
      }
    } catch {
      setError('Unable to check phone number.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm">
      <h2 className="font-semibold text-[#1E3A8A]">Check Existing Customer</h2>
      <p className="mt-1 text-sm text-[#1D4ED8]">Check the phone number before creating a new customer.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setCustomer(null)
            setHasChecked(false)
            setError('')
          }}
          placeholder="08012345678"
          className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all"
        />
        <button
          type="button"
          onClick={checkPhone}
          disabled={checking}
          className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {checking ? 'Checking...' : 'Check Number'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {hasChecked && customer && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Customer already exists</p>
          <p className="mt-2 text-sm font-semibold text-[#1E3A8A]">{customer.full_name}</p>
          <p className="text-sm text-slate-600">{customer.phone}</p>
          {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
          <div className="mt-4 flex gap-2">
            <Link href={`/customers/${customer.id}`} className="inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Open Customer
            </Link>
            <Link href={`/customers/${customer.id}`} className="inline-flex rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#1E3A8A] hover:bg-white">
              Show existing customer
            </Link>
          </div>
        </div>
      )}

      {hasChecked && !customer && !error && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-700">✓ No customer found for {phone}. You can create new customer.</p>
        </div>
      )}
    </div>
  )
}