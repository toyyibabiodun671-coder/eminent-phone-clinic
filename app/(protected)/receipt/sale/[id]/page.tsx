import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptPrint from '@/components/receipt/receipt-print'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export const dynamic = 'force-dynamic'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

type SaleRow = {
  id: string
  amount: string | number
  type: string
  payment_method: string
  description: string | null
  sale_date: string
  created_at: string
  customer_id: string | null
}

type CustomerRow = {
  full_name: string | null
}

export default async function SaleReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const { data: saleData } = await supabase
    .from('sales')
    .select('id, amount, type, payment_method, description, sale_date, created_at, customer_id')
    .eq('id', id)
    .maybeSingle()

  if (!saleData) return <div className="p-10 text-center text-sm text-slate-500">Sale not found: {id}</div>

  const sale = saleData as SaleRow

  let customerName = 'Walk-in Customer'
  if (sale.customer_id) {
    const { data: cust } = await supabase.from('customers').select('full_name').eq('id', sale.customer_id).maybeSingle()
    const c = cust as CustomerRow | null
    if (c?.full_name) customerName = c.full_name
  }

  const date = new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
  const invoiceNo = `SALE-${sale.id.slice(0, 8).toUpperCase()}`

  const items = [
    {
      description: sale.description || (sale.type === 'accessory' ? 'Accessory Sale' : sale.type),
      qty: 1,
      amount: Number(sale.amount),
    },
  ]

  return (
    <div className="flex min-h-screen justify-start bg-[#EFF6FF] p-4">
      <ReceiptPrint
        type="sale"
        invoiceNo={invoiceNo}
        date={date}
        customerName={customerName}
        paymentMethod={sale.payment_method}
        items={items}
        total={Number(sale.amount)}
        phone="07064245688 | 09061626394"
        repairSummary={null}
      />
    </div>
  )
}