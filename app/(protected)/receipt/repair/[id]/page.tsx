import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptPrint from '@/components/receipt/receipt-print'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type RepairJobRow = {
  id: string
  customer_id: string
  device_id: string | null
  technician_id: string | null
  problem_description: string | null
  diagnosis: string | null
  repair_cost: string | number | null
  amount_paid: string | number | null
  date_received: string
}

type CustomerRow = {
  full_name: string | null
}

type DeviceRow = {
  brand: string | null
  model: string | null
}

type TransactionRow = {
  amount: string | number
  payment_method: string
  transaction_date: string
}

export default async function RepairReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  const { data: jobData } = await supabase
    .from('repair_jobs')
    .select('id, customer_id, device_id, technician_id, problem_description, diagnosis, repair_cost, amount_paid, date_received')
    .eq('id', id)
    .maybeSingle()

  if (!jobData) return <div className="p-10 text-center text-sm text-slate-500">Repair job not found: {id}</div>

  const job = jobData as RepairJobRow

  // Role check: admin/manager/owner sees all, technician/sales/apprentice only own
  const isOwnerTech = job.technician_id === profile.id
  if (!isAdmin && !isOwnerTech) {
    redirect('/dashboard')
  }

  let customerName = 'Walk-in Customer'
  const { data: custData } = await supabase.from('customers').select('full_name').eq('id', job.customer_id).maybeSingle()
  const cust = custData as CustomerRow | null
  if (cust?.full_name) customerName = cust.full_name

  let deviceInfo = ''
  if (job.device_id) {
    const { data: devData } = await supabase.from('devices').select('brand, model').eq('id', job.device_id).maybeSingle()
    const dev = devData as DeviceRow | null
    if (dev) deviceInfo = `${dev.brand || ''} ${dev.model || ''}`.trim()
  }

  const { data: txData } = await supabase
    .from('transactions')
    .select('amount, payment_method, transaction_date')
    .eq('repair_job_id', id)
    .order('transaction_date', { ascending: false })

  const transactions = (txData as TransactionRow[] | null) || []

  const totalCharges = Number(job.repair_cost || 0)
  const paidFromJob = Number(job.amount_paid || 0)
  const paidFromTx = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const paidAmount = Math.max(paidFromJob, paidFromTx)
  const outstanding = Math.max(totalCharges - paidAmount, 0)

  const latestTx = transactions[0]
  const thisPayment = latestTx ? Number(latestTx.amount) : paidAmount
  const paymentMethod = latestTx?.payment_method || 'cash'
  const dateSource = latestTx?.transaction_date || job.date_received
  const date = new Date(dateSource).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })

  const items = [
    {
      description: job.problem_description || job.diagnosis || 'Phone Repair Service',
      qty: 1,
      amount: totalCharges,
    },
  ]

  return (
    <div className="flex min-h-screen justify-start bg-[#EFF6FF] p-4">
      <ReceiptPrint
        type="repair"
        invoiceNo={`REP-${job.id.slice(0, 8).toUpperCase()}`}
        date={date}
        customerName={customerName}
        paymentMethod={paymentMethod}
        items={items}
        total={thisPayment}
        phone="07064245688 | 09061626394"
        repairSummary={{
          totalCharges,
          paidAmount,
          outstanding,
          deviceInfo,
          problem: job.problem_description || '',
          transactions: transactions.map((t) => ({
            amount: Number(t.amount),
            date: new Date(t.transaction_date).toLocaleDateString('en-NG'),
            method: t.payment_method,
          })),
        }}
      />
    </div>
  )
}