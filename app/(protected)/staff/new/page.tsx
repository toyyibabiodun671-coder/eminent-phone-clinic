'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type StaffRole = 'admin' | 'apprentice'

export default function NewStaffPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<StaffRole>('apprentice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const res = await fetch('/api/staff/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, phone, role }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to create staff')
      return
    }

    setSuccess(`Staff created: ${data.email} as ${data.role}. They can now login at /login — OTP will be sent to Gmail on new device.`)
    setEmail(''); setPassword(''); setFullName(''); setPhone('')
    setTimeout(() => router.push('/staff'), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Add New Staff</h1>
        <p className="mt-1 text-sm text-blue-100">Create admin or apprentice — they can login immediately, OTP sent to Gmail on new device to confirm they exist in Supabase</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-blue-200 bg-white p-8 shadow-sm space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Full Name *</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none" placeholder="John Doe" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Email * (for login + OTP)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none" placeholder="staff@eminent.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none" placeholder="080..." />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Password * (temporary, staff can change via Forgot Password)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Min 6 chars" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Role *</label>
          <select value={role} onChange={e => setRole(e.target.value as StaffRole)} className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none">
            <option value="apprentice">Apprentice — Can see only own repairs, sell accessories, print own receipts</option>
            <option value="admin">Admin — Full access: sales, expenses, reports, all repairs, accessories edit</option>
          </select>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating...' : `Create ${role === 'admin' ? 'Admin' : 'Apprentice'}`}
        </button>
      </form>
    </div>
  )
}