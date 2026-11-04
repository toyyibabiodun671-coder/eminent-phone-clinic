import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type PaymentRow = { amount: number | string }
type RepairRow = {
  id: string
  repair_cost: number | string
  technician_id: string | null
  customer_id: string | null
  device_id: string | null
}

type StaffRole = 'admin' | 'apprentice' | 'manager' | 'owner'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as { id: string; role: string } | null
  const profileId = profile?.id

  if (!profileId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = (await request.json()) as {
    amount?: unknown
    payment_method?: unknown
    description?: unknown
  }

  const amount = Number(body.amount)
  const paymentMethod = typeof body.payment_method === 'string' ? body.payment_method : ''
  const description = typeof body.description === 'string' ? body.description : undefined

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid payment amount.' }, { status: 400 })
  }

  const allowedMethods = ['cash', 'transfer', 'pos', 'other'] as const
  if (!(allowedMethods as readonly string[]).includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: repairData, error: repairError } = await supabase
    .from('repair_jobs')
    .select('id, repair_cost, technician_id, customer_id, device_id')
    .eq('id', id)
    .single()

  if (repairError || !repairData) {
    return NextResponse.json({ error: 'Repair job not found.' }, { status: 404 })
  }

  const repair = repairData as RepairRow

  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'
  const isAssignedTechnician = repair.technician_id === profileId

  if (!isAdmin && !isAssignedTechnician) {
    return NextResponse.json(
      { error: 'You are not allowed to record payment for this repair.' },
      { status: 403 }
    )
  }

  const { data: existingPayments } = await supabase
    .from('sales')
    .select('amount')
    .eq('repair_job_id', id)
    .in('type', ['repair', 'deposit', 'balance'])

  const payments = (existingPayments as PaymentRow[] | null) || []
  const currentPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const repairCost = Number(repair.repair_cost)
  const outstanding = Math.max(repairCost - currentPaid, 0)

  if (amount > outstanding) {
    return NextResponse.json(
      {
        error: `Payment cannot exceed the outstanding balance of ₦${outstanding.toLocaleString()}.`,
      },
      { status: 400 }
    )
  }

  const newAmountPaid = currentPaid + amount
  const saleType = amount === outstanding ? 'balance' : 'repair'
  const saleDescription = description?.trim() || `Payment for repair ${repair.id.slice(0, 8)}`

  const { error: saleError } = await supabase.from('sales').insert({
    amount: amount,
    type: saleType,
    payment_method: paymentMethod,
    customer_id: repair.customer_id,
    repair_job_id: repair.id,
    device_id: repair.device_id,
    description: saleDescription,
  })

  if (saleError) {
    return NextResponse.json({ error: saleError.message }, { status: 500 })
  }

  const { error: txnError } = await supabase.from('transactions').insert({
    amount: amount,
    transaction_type: saleType,
    payment_method: paymentMethod,
    description: saleDescription,
    transaction_date: new Date().toISOString(),
    recorded_by: profileId,
    repair_job_id: repair.id,
  })

  if (txnError) {
    return NextResponse.json({ error: txnError.message }, { status: 500 })
  }

  const { error: repairUpdateError } = await supabase
    .from('repair_jobs')
    .update({
      amount_paid: newAmountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', repair.id)

  if (repairUpdateError) {
    return NextResponse.json({ error: repairUpdateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    amount_paid: newAmountPaid,
    outstanding: repairCost - newAmountPaid,
  })
}