import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type CustomerRow = {
  id: string
  full_name: string
  phone: string
  email: string | null
}

export async function GET(request: Request) {
  await getCurrentProfile()

  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')?.trim()

  if (!phone) {
    return NextResponse.json({ exists: false })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email')
    .eq('phone', phone)
    .maybeSingle<CustomerRow>()

  if (error) {
    return NextResponse.json(
      { error: 'Unable to check customer.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    exists: !!data,
    customer: data || null,
  })
}