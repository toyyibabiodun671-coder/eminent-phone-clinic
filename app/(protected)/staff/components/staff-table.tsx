'use client'

import { useState } from 'react'
import Link from 'next/link'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type StaffRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  status: string | null
  created_at: string | null
}

type Props = {
  staff: StaffRow[]
  currentUserId: string
}

export function StaffTable({ staff, currentUserId }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const callApi = async (url: string, body: Record<string, string>) => {
    setMsg(null)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { error?: string; message?: string }
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  const handleStatus = async (id: string, status: 'active' | 'inactive') => {
    if (id === currentUserId) {
      setMsg('You cannot deactivate yourself')
      return
    }
    setUpdatingId(id)
    try {
      await callApi('/api/staff/update', { id, status })
      setMsg(`Status changed to ${status}`)
      location.reload()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      setMsg('You cannot delete yourself')
      return
    }
    if (!confirm('Delete this staff? This cannot be undone.')) return
    setUpdatingId(id)
    try {
      await callApi('/api/staff/delete', { id })
      setMsg('Deleted')
      location.reload()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
      {msg && <div className="border-b border-blue-50 bg-[#EFF6FF] px-5 py-3 text-xs font-medium text-[#1E3A8A]">{msg}</div>}

      <div className="overflow-x-auto">
        <table className="min-w- w-full text-left">
          <thead className="bg-[#EFF6FF] border-b border-blue-100">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Name</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Phone</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Role</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Joined</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-[#1E3A8A]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {staff.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No staff found</td></tr>
            ) : staff.map((s) => {
              const role = s.role as StaffRole
              const isSelf = s.id === currentUserId
              return (
                <tr key={s.id} className="hover:bg-[#EFF6FF]/50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.full_name || '—'} {isSelf && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text- font-bold text-[#2563EB]">YOU</span>}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{s.phone || '—'}</td>
                  <td className="px-5 py-3"><span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold uppercase text-[#1E3A8A]">{role}</span></td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status || 'active'}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString('en-NG') : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/staff/${s.id}/edit`} className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50">Edit</Link>
                      {!isSelf && s.status !== 'active' && <button disabled={updatingId === s.id} onClick={() => handleStatus(s.id, 'active')} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">Activate</button>}
                      {!isSelf && s.status === 'active' && <button disabled={updatingId === s.id} onClick={() => handleStatus(s.id, 'inactive')} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Deactivate</button>}
                      {!isSelf && <button disabled={updatingId === s.id} onClick={() => handleDelete(s.id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">Delete</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}