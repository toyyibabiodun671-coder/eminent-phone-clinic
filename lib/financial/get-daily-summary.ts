import { createClient } from '@/lib/supabase/server'

type SaleRow = {
  id: string
  amount: number | string
  type: string
  payment_method: string
  description: string | null
  sale_date: string
  created_at: string
  repair_job_id?: string | null
}

type EnrichedTransaction = SaleRow & {
  prettyDesc: string
}

type DailySummary = {
  totalSales: number
  repairPayments: number
  otherSales: number
  cash: number
  transfer: number
  pos: number
  outstandingBalance: number
  transactionCount: number
  transactions: EnrichedTransaction[]
}

type RepairBalanceRow = {
  repair_cost: number | string | null
  amount_paid: number | string | null
}

export async function getDailySummary(date: Date = new Date()): Promise<DailySummary> {
  const supabase = await createClient()
  const dayStr = date.toISOString().split('T')[0]

  const { data, error } = await supabase.from('sales').select('*').eq('sale_date', dayStr).order('created_at', { ascending: false })

  if (error) throw error

  const list = (data as SaleRow[]) || []

  const totalSales = list.reduce((sum, t) => sum + Number(t.amount), 0)
  const repairPayments = list.filter(t => ['repair', 'deposit', 'balance'].includes(t.type)).reduce((sum, t) => sum + Number(t.amount), 0)
  const otherSales = totalSales - repairPayments
  const cash = list.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + Number(t.amount), 0)
  const transfer = list.filter(t => t.payment_method === 'transfer').reduce((sum, t) => sum + Number(t.amount), 0)
  const pos = list.filter(t => t.payment_method === 'pos').reduce((sum, t) => sum + Number(t.amount), 0)

  const { data: jobsData } = await supabase.from('repair_jobs').select('repair_cost, amount_paid').neq('status', 'collected')

  const jobs = (jobsData as RepairBalanceRow[]) || []
  const outstandingBalance = jobs.reduce((sum, j) => {
    return sum + (Number(j.repair_cost || 0) - Number(j.amount_paid || 0))
  }, 0)

  const enriched: EnrichedTransaction[] = list.map(t => {
    let pretty = t.description || ''
    if (!pretty) {
      if (['repair', 'deposit', 'balance'].includes(t.type)) {
        pretty = t.repair_job_id? `Repair #${String(t.repair_job_id).slice(0, 6)}` : 'Repair Payment'
      } else if (t.type === 'accessory') pretty = 'Accessory Sale'
      else if (t.type === 'device') pretty = 'Device Sale'
      else pretty = t.type
    }
    return {...t, prettyDesc: pretty }
  })

  return {
    totalSales,
    repairPayments,
    otherSales,
    cash,
    transfer,
    pos,
    outstandingBalance,
    transactionCount: list.length,
    transactions: enriched,
  }
}