import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type UpdatePayload = {
  full_name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
}

type IdRow = {
  id: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawProfile = await getCurrentProfile()
  const profile = rawProfile as unknown as IdRow | null
  const profileId = profile?.id

  if (!profileId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Customer ID required.' }, { status: 400 })
  }

  const body = (await request.json()) as UpdatePayload

  const fullName = String(body.full_name || '').trim()
  const phone = String(body.phone || '').trim()
  const email = body.email ? String(body.email).trim() : null
  const address = body.address ? String(body.address).trim() : null
  const notes = body.notes ? String(body.notes).trim() : null

  if (!fullName || !phone) {
    return NextResponse.json({ error: 'Full name and phone are required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .neq('id', id)
    .maybeSingle()

  const existingTyped = existing as IdRow | null

  if (existingTyped?.id) {
    return NextResponse.json({ error: 'Phone number already belongs to another customer.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customers')
    .update({
      full_name: fullName,
      phone,
      email: email || null,
      address: address || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }

  const result = data as IdRow

  return NextResponse.json({ id: result.id })
}