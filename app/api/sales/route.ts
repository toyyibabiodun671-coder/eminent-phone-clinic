import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SALE_TYPES = [
  'accessory',
  'device',
  'repair',
  'deposit',
  'balance',
] as const

const PAYMENT_METHODS = ['cash', 'transfer', 'pos'] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  let saleId: string | null = null

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please log in to record a sale.' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (
      profileError ||
      !profile ||
      profile.status !== 'active' ||
      !['admin', 'apprentice'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to record sales.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const amount = Number(body.amount)
    const type = body.type
    const paymentMethod = body.payment_method

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Enter a valid amount greater than zero.' },
        { status: 400 }
      )
    }

    if (!SALE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Select a valid sale type.' },
        { status: 400 }
      )
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Payment method must be cash, transfer, or pos.' },
        { status: 400 }
      )
    }

    // --- SECURITY RULE: Apprentice can only sell accessories ---
    if (profile.role !== 'admin' && type !== 'accessory') {
      return NextResponse.json(
        { error: 'Apprentices can only record accessory sales. Repair payments require admin.' },
        { status: 403 }
      )
    }
    // --- END RULE ---

    if (
      body.description !== undefined &&
      typeof body.description !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Description must be text.' },
        { status: 400 }
      )
    }

    const description =
      body.description?.trim() || `Sale - ${type}`

    const saleDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    const transactionDate = new Date().toISOString()

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        amount,
        type,
        payment_method: paymentMethod,
        description,
        customer_id: body.customer_id || null,
        repair_job_id: body.repair_job_id || null,
        device_id: body.device_id || null,
        recorded_by: user.id,
        sale_date: saleDate,
      })
      .select('id, amount, type, payment_method, description')
      .single()

    if (saleError) {
      throw new Error(`Could not record sale: ${saleError.message}`)
    }

    saleId = sale.id

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        amount,
        transaction_type: type,
        payment_method: paymentMethod,
        description,
        transaction_date: transactionDate,
        recorded_by: user.id,
        repair_job_id: body.repair_job_id || null,
      })

    if (transactionError) {
      const { error: rollbackError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)

      if (rollbackError) {
        console.error('SALE ROLLBACK FAILED:', {
          saleId,
          transactionError: transactionError.message,
          rollbackError: rollbackError.message,
        })

        return NextResponse.json(
          {
            error:
              'The payment could not be fully recorded. A sale record may remain; check the records before retrying.',
          },
          { status: 500 }
        )
      }

      throw new Error(
        `Could not record dashboard transaction: ${transactionError.message}`
      )
    }

    return NextResponse.json({ success: true, sale })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'

    console.error('SALE API ERROR:', message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}