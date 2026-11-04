'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  repairId: string
  currentStatus: string
  isAdmin: boolean
}

const allowedTransitions: Record<string, string[]> = {
  pending: ['diagnosing', 'cancelled'],
  diagnosing: ['in_progress', 'in_repair', 'cancelled'],
  in_progress: ['waiting_parts', 'ready', 'completed', 'cancelled'],
  in_repair: ['waiting_parts', 'ready', 'completed', 'cancelled'],
  waiting_parts: ['in_progress', 'in_repair', 'ready', 'completed', 'cancelled'],
  ready: ['completed', 'collected'],
  completed: ['collected'],
  collected: [],
  cancelled: [],
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  diagnosing: 'Diagnosing',
  in_progress: 'In Progress',
  in_repair: 'In Repair',
  waiting_parts: 'Waiting for Parts',
  ready: 'Ready for Collection',
  completed: 'Completed / Ready',
  collected: 'Collected',
  cancelled: 'Cancelled',
}

export default function StatusControl({ repairId, currentStatus, isAdmin }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function updateStatus(newStatus: string) {
    if (newStatus === currentStatus) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/repairs/${repairId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update status.')
      setStatus(newStatus)
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to update status.'
      setError(msg)
      setStatus(currentStatus)
    } finally {
      setSaving(false)
    }
  }

  const validNext = allowedTransitions[currentStatus] || []
  const optionsToShow = [currentStatus, ...validNext].filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#1D4ED8]">Repair Status</label>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => updateStatus(e.target.value)}
        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        {optionsToShow.map((value) => {
          const disabled = !isAdmin && (value === 'collected' || value === 'cancelled')
          const label = statusLabels[value] || value.replace('_', ' ')
          return (
            <option key={value} value={value} disabled={disabled}>
              {label}
            </option>
          )
        })}
      </select>
      {saving && <p className="mt-2 text-xs font-medium text-[#2563EB]">Updating status...</p>}
      {error && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm font-medium text-red-600">{error}</p>}
      {!isAdmin && (
        <p className="mt-2 text- text-slate-500">Technicians can update to Ready/Completed but not Collected/Cancelled — Admin only.</p>
      )}
    </div>
  )
}