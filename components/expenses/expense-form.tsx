'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExpenseForm() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('parts')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState('cash')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/expenses/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        category,
        description,
        payment_method: method,
        expense_date: expenseDate,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to save expense')
      setSaving(false)
      return
    }
    router.push('/expenses')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2563EB]">Amount ₦</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2563EB]">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
          >
            <option value="parts">Parts</option>
            <option value="transport">Transport</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="food">Food</option>
            <option value="salary">Salary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2563EB]">Date</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2563EB]">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Screen for iPhone 11"
          className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2563EB]">Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-1 w-full rounded-xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        >
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="pos">POS</option>
        </select>
      </div>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}
      <button
        disabled={saving}
        className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Expense'}
      </button>
    </form>
  )
}