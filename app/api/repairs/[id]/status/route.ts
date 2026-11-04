import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedStatuses = ['pending','diagnosing','in_repair','waiting_parts','completed','collected','cancelled'] as const
type RepairStatus = typeof allowedStatuses[number]

const validTransitions: Record<RepairStatus, RepairStatus[]> = {
  pending: ['diagnosing', 'cancelled'],
  diagnosing: ['in_repair', 'cancelled'],
  in_repair: ['waiting_parts', 'completed', 'cancelled'],
  waiting_parts: ['in_repair', 'completed', 'cancelled'],
  completed: ['collected'],
  collected: [],
  cancelled: [],
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()

  // FIX: Use auth.getUser() directly — no redirect
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('id, role, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') {
    return NextResponse.json({ error: 'Profile not active.' }, { status: 403 })
  }

  const body = await request.json()
  const newStatus = body.status as string

  if (!(allowedStatuses as readonly string[]).includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid repair status.' }, { status: 400 })
  }

  const { data: repair, error: repairError } = await supabase.from('repair_jobs').select('id, technician_id, status').eq('id', id).single()
  if (repairError || !repair) {
    return NextResponse.json({ error: 'Repair job not found.' }, { status: 404 })
  }

  const isAdmin = profile.role === 'admin'
  const isAssignedTechnician = repair.technician_id === profile.id

  if (!isAdmin && !isAssignedTechnician) {
    return NextResponse.json({ error: 'You are not allowed to update this repair.' }, { status: 403 })
  }

  if (!isAdmin && (newStatus === 'collected' || newStatus === 'cancelled')) {
    return NextResponse.json({ error: 'Apprentices cannot mark as collected or cancelled.' }, { status: 403 })
  }

  const currentStatus = repair.status as RepairStatus
  const allowedNext = validTransitions[currentStatus] || []
  const isAdminCancelOverride = isAdmin && newStatus === 'cancelled'

  if (!isAdminCancelOverride && !allowedNext.includes(newStatus as RepairStatus)) {
    return NextResponse.json({ error: `Invalid status transition from ${currentStatus} to ${newStatus}.` }, { status: 400 })
  }

  const { error: updateError } = await supabase.from('repair_jobs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, status: newStatus })
}