import { createClient } from '@/lib/supabase/client'

type RecordSaleParams = {
  amount: number
  transaction_type: string
  payment_method: string
  description: string
  accessory_id?: string
  quantity?: number
  request_id?: string
  repair_job_id?: string | null
  customer_id?: string | null
  device_id?: string | null
}

export type AccessorySaleResult = {
  success: true
  duplicate: boolean
  accessory_sale_id: string
  name: string
  quantity: number
  total: number
  payment_method: string
  sale_id?: string
  transaction_id?: string
}

export async function recordSale(
  params: RecordSaleParams
): Promise<AccessorySaleResult | unknown> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError

  if (!user) {
    throw new Error('Not logged in - please login again')
  }

  // Accessory sales must use the atomic database function.
  if (params.transaction_type === 'accessory_sale') {
    if (
      !params.accessory_id ||
      !Number.isInteger(params.quantity) ||
      !params.quantity ||
      params.quantity < 1 ||
      !params.request_id
    ) {
      throw new Error(
        'Accessory ID, valid quantity, and request ID are required'
      )
    }

    const { data, error } = await supabase.rpc('record_accessory_sale', {
      p_accessory_id: params.accessory_id,
      p_quantity: params.quantity,
      p_payment_method: params.payment_method,
      p_request_id: params.request_id,
    })

    if (error) throw error

    // Never treat an empty or malformed RPC response as a confirmed sale.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('The database returned an invalid sale confirmation.')
    }

    const result = data as Record<string, unknown>
    const rawTotal = result.total

    const validTotal =
      (typeof rawTotal === 'number' ||
        (typeof rawTotal === 'string' && rawTotal.trim() !== '')) &&
      Number.isFinite(Number(rawTotal)) &&
      Number(rawTotal) > 0

    if (
      result.success !== true ||
      typeof result.accessory_sale_id !== 'string' ||
      result.accessory_sale_id.trim() === '' ||
      typeof result.name !== 'string' ||
      result.name.trim() === '' ||
      !Number.isInteger(result.quantity) ||
      Number(result.quantity) < 1 ||
      !validTotal ||
      !['cash', 'transfer', 'pos'].includes(
        String(result.payment_method)
      ) ||
      typeof result.duplicate !== 'boolean'
    ) {
      throw new Error(
        'The sale response could not be verified. Retry the same submission; do not create a new sale.'
      )
    }

    // Normalize the total for the success popup and currency formatting.
    return {
      success: true,
      duplicate: result.duplicate,
      accessory_sale_id: result.accessory_sale_id as string,
      name: result.name as string,
      quantity: result.quantity as number,
      total: Number(rawTotal),
      payment_method: result.payment_method as string,
      ...(typeof result.sale_id === 'string'
        ? { sale_id: result.sale_id }
        : {}),
      ...(typeof result.transaction_id === 'string'
        ? { transaction_id: result.transaction_id }
        : {}),
    }
  }

  // Keep other payment paths unchanged in this step.
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      amount: params.amount,
      transaction_type: params.transaction_type,
      payment_method: params.payment_method,
      description: params.description,
      transaction_date: new Date().toISOString(),
      recorded_by: user.id,
      repair_job_id: params.repair_job_id || null,
    })
    .select()

  if (error) throw error

  return data
}