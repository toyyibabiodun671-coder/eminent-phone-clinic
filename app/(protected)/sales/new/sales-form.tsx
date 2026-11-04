'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import PaymentSuccessPopup from '@/components/payments/payment-success-popup'

type SaleType = 'accessory' | 'device' | 'repair' | 'deposit' | 'balance'
type PaymentMethod = 'cash' | 'transfer' | 'pos'

export default function SaleForm() {
  const router = useRouter()

  const [type, setType] = useState<SaleType>('accessory')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState({ amount: 0, description: '', method: 'cash' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const numericAmount = Number(amount)
    if (!description.trim()) { setError('Please enter a description.'); return }
    if (!numericAmount || numericAmount <= 0) { setError('Please enter a valid amount.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, type, payment_method: paymentMethod, description: description.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to record sale')

      setSuccessData({ amount: numericAmount, description: description.trim(), method: paymentMethod })
      setShowSuccess(true)
      setSaving(false)
      setTimeout(() => { router.push('/sales'); router.refresh() }, 2500)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to record sale'
      setError(message)
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-xl bg-[#2563EB] p-5 text-white shadow-md">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Record Sale</h1>
        <p className="mt-2 text-sm text-blue-100">Record money received — will appear in Today&apos;s Sales</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm sm:p-7">
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Sale Type</label>
            <select value={type} onChange={(event) => setType(event.target.value as SaleType)} className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100">
              <option value="accessory">Accessory</option>
              <option value="device">Device Sale</option>
              <option value="repair">Repair Payment</option>
              <option value="deposit">Deposit</option>
              <option value="balance">Balance</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Description *</label>
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Screen protector sale" required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Amount (₦) *</label>
            <input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Payment Method</label>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100">
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="pos">POS</option>
            </select>
          </div>
        </div>

        {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-[#2563EB] hover:bg-[#DBEAFE]">Cancel</button>
          <button type="submit" disabled={saving || showSuccess} className="rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : showSuccess ? 'Sale Recorded' : 'Save Sale'}
          </button>
        </div>
      </form>

      {showSuccess && (
        <PaymentSuccessPopup
          amount={successData.amount}
          description={successData.description}
          method={successData.method}
          title="Sale Successful!"
          subtitle="Your sale has been recorded successfully."
        />
      )}
    </div>
  )
}