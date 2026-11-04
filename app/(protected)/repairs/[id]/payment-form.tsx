'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import PaymentSuccessPopup from '@/components/payments/payment-success-popup'

type Props = { repairId: string; outstanding: number }

export default function PaymentForm({ repairId, outstanding }: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successAmount, setSuccessAmount] = useState(0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid payment amount.')
      return
    }
    if (numericAmount > outstanding) {
      setError(`Cannot pay more than ₦${outstanding.toLocaleString()}`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/repairs/${repairId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, payment_method: paymentMethod, description: 'Repair payment' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to record payment.')

      setSuccessAmount(numericAmount)
      setShowSuccess(true)
      setSaving(false)
      setAmount('')
      setTimeout(() => {
        setShowSuccess(false)
        router.refresh()
      }, 2500)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to record payment.'
      setError(msg)
      setSaving(false)
    }
  }

  if (outstanding <= 0 && !showSuccess) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl text-white">✓</div>
        <p className="mt-3 font-bold text-green-700">Fully Paid</p>
        <p className="text-sm text-green-600">This repair has been fully paid.</p>
      </div>
    )
  }

  const quickAmounts = [5000, 10000, 20000, outstanding].filter((v, i, arr) => v > 0 && v <= outstanding && arr.indexOf(v) === i)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E3A8A]">Record Payment</h3>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">Owes: ₦{outstanding.toLocaleString()}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setAmount(String(v))}
              className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
            >
              ₦{v.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Payment Amount (₦)</label>
            <input
              type="number"
              min="1"
              max={outstanding}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="pos">POS</option>
            </select>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={saving || showSuccess}
          className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {saving ? 'Recording...' : showSuccess ? 'Payment Recorded' : `Record ₦${amount ? Number(amount).toLocaleString() : '0'} Payment`}
        </button>
      </form>

      {showSuccess && (
        <PaymentSuccessPopup
          amount={successAmount}
          description="Repair payment"
          method={paymentMethod}
          title="Payment Successful!"
          subtitle="Repair payment recorded. Balance updated."
        />
      )}
    </>
  )
}