'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type Customer = { id: string; full_name: string | null; phone: string | null }
type Device = { id: string; brand: string | null; model: string | null; imei: string | null }
type Technician = { id: string; full_name: string | null; role: string | null }

export default function RepairForm() {
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentRole, setCurrentRole] = useState<StaffRole | ''>('')
  const [technicianId, setTechnicianId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [problem, setProblem] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [expectedCompletion, setExpectedCompletion] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const isAdminRole = currentRole === 'admin' || currentRole === 'manager' || currentRole === 'owner'

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = (profile?.role as StaffRole) || ''
      setCurrentRole(role)

      const { data: cust } = await supabase.from('customers').select('id, full_name, phone').order('full_name')
      setCustomers((cust || []) as Customer[])

      const { data: tech } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'manager', 'technician', 'sales', 'apprentice', 'owner'])
        .eq('status', 'active')
        .order('full_name')
      setTechnicians((tech || []) as Technician[])
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    async function loadDevices() {
      if (!customerId) {
        setDevices([])
        setDeviceId('')
        return
      }
      const { data } = await supabase
        .from('devices')
        .select('id, brand, model, imei')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setDevices((data || []) as Device[])
      setDeviceId('')
    }
    loadDevices()
  }, [customerId])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!customerId) {
      setError('Please select a customer.')
      return
    }
    if (!deviceId) {
      setError('Please select a device.')
      return
    }

    const totalCost = Number(repairCost || 0)
    const paid = Number(amountPaid || 0)
    if (paid > totalCost) {
      setError('Amount paid cannot be greater than repair cost.')
      return
    }

    const finalTechId = !isAdminRole ? currentUserId : technicianId || null
    setSaving(true)

    try {
      const { error: rpcError } = await supabase.rpc('create_repair_job_atomic', {
        p_customer_id: customerId,
        p_device_id: deviceId,
        p_problem_description: problem.trim(),
        p_repair_cost: totalCost,
        p_amount_paid: paid,
        p_payment_method: paymentMethod,
        p_technician_id: finalTechId,
        p_diagnosis: diagnosis.trim() || null,
        p_expected_completion: expectedCompletion || null,
      })
      if (rpcError) throw new Error(rpcError.message)

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/repairs')
        router.refresh()
      }, 2200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create repair job'
      setError(msg)
      setSaving(false)
    }
  }

  const balance = Number(repairCost || 0) - Number(amountPaid || 0)
  const inputClass =
    'w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100'
  const labelClass = 'mb-2 block text-sm font-medium text-[#1D4ED8]'

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl bg-[#2563EB] p-5 text-white shadow-md">
        <h1 className="text-2xl font-bold">New Repair Job</h1>
        <p className="mt-2 text-sm text-blue-100">Register a device for repair.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-blue-200 bg-[#EFF6FF] p-5 shadow-sm sm:p-7">
        <div className="grid gap-5">
          <div>
            <label className={labelClass}>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required disabled={loading} className={inputClass}>
              <option value="">{loading ? 'Loading...' : 'Select customer'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {c.phone || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Device *</label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              disabled={!customerId}
              className={inputClass + ' disabled:opacity-50'}
            >
              <option value="">{!customerId ? 'Select a customer first' : devices.length === 0 ? 'No devices' : 'Select device'}</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand || ''} {d.model || ''} {d.imei ? ' — ' + d.imei : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Problem Reported *</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
              rows={4}
              placeholder="Describe complaint..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Diagnosis</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              placeholder="Diagnosis..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Assign Technician {currentRole && !isAdminRole ? '(You)' : ''}</label>
            {!isAdminRole ? (
              <input
                disabled
                value={technicians.find((t) => t.id === currentUserId)?.full_name || 'You'}
                className={inputClass + ' opacity-70'}
              />
            ) : (
              <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className={inputClass}>
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || ''} — {t.role === 'admin' || t.role === 'manager' || t.role === 'owner' ? 'Admin (Owner)' : 'Technician'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Repair Cost (₦)</label>
              <input type="number" min="0" step="0.01" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Amount Paid (₦)</label>
              <input type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="pos">POS</option>
            </select>
          </div>

          <div className="rounded-xl bg-[#2563EB] p-4 text-white">
            <p className="text-sm text-blue-100">Outstanding Balance</p>
            <p className="mt-1 text-2xl font-bold">₦{balance.toLocaleString()}</p>
          </div>

          <div>
            <label className={labelClass}>Expected Completion</label>
            <input type="date" value={expectedCompletion} onChange={(e) => setExpectedCompletion(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-[#2563EB]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || showSuccess}
            className="rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : showSuccess ? 'Created!' : 'Create Repair Job'}
          </button>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <span className="text-4xl text-green-600">✓</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-green-700">Repair Created!</h2>
            <p className="mt-2 text-sm text-gray-600">Job created and payment recorded in Sales + Dashboard.</p>
            <p className="mt-5 text-xs text-gray-500">Taking you back to Repairs...</p>
          </div>
        </div>
      )}
    </div>
  )
}