import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type InsertRow = {
  customer_id: string
  device_type: string
  brand: string
  model: string
  imei: string | null
  serial_number: string | null
  color: string | null
  condition_notes: string | null
  created_by: string | null
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile()
  
  if (!profile?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const supabase = await createClient()

  let customerId = ''
  let deviceType = ''
  let brand = ''
  let model = ''
  let imei = ''
  let serialNumber = ''
  let color = ''
  let conditionNotes = ''
  let isJson = false

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    isJson = true
    const body = (await request.json()) as {
      customer_id?: string
      device_type?: string
      brand?: string
      model?: string
      imei?: string | null
      serial_number?: string | null
      color?: string | null
      condition_notes?: string | null
    }
    customerId = String(body.customer_id || '').trim()
    deviceType = String(body.device_type || '').trim()
    brand = String(body.brand || '').trim()
    model = String(body.model || '').trim()
    imei = String(body.imei || '').trim()
    serialNumber = String(body.serial_number || '').trim()
    color = String(body.color || '').trim()
    conditionNotes = String(body.condition_notes || '').trim()
  } else {
    const formData = await request.formData()
    customerId = String(formData.get('customer_id') || '').trim()
    deviceType = String(formData.get('device_type') || '').trim()
    brand = String(formData.get('brand') || '').trim()
    model = String(formData.get('model') || '').trim()
    imei = String(formData.get('imei') || '').trim()
    serialNumber = String(formData.get('serial_number') || '').trim()
    color = String(formData.get('color') || '').trim()
    conditionNotes = String(formData.get('condition_notes') || '').trim()
  }

  if (!customerId || !brand || !model) {
    return NextResponse.json({ error: 'Customer, brand and model are required.' }, { status: 400 })
  }

  const insertData: InsertRow = {
    customer_id: customerId,
    device_type: deviceType || 'phone',
    brand,
    model,
    imei: imei || null,
    serial_number: serialNumber || null,
    color: color || null,
    condition_notes: conditionNotes || null,
    created_by: profile.id,
  }

  const { data, error } = await supabase.from('devices').insert(insertData).select('id').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (isJson) {
    return NextResponse.json({ id: data.id })
  }

  return NextResponse.redirect(new URL(`/customers/${customerId}`, request.url), 303)
}