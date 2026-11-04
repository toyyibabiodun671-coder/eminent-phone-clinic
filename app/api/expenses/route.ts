import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type CreateExpenseBody = {
  amount: string | number
  category: string
  description?: string
  expense_date?: string
  payment_method?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()

  try {
    const profile = await getCurrentProfile()
    const role = profile.role as StaffRole
    const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = (await req.json()) as CreateExpenseBody
    const amount = Number(body.amount)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { error } = await supabase.from('expenses').insert({
      amount,
      category: body.category || 'general',
      description: body.description?.trim() || null,
      expense_date: body.expense_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }),
      payment_method: body.payment_method || 'cash',
      recorded_by: profile.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}