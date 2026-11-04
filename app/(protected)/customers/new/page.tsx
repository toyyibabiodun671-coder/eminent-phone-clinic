import { Suspense } from 'react'
import CustomerForm from './customer-form'

export const dynamic = 'force-dynamic'

export default function NewCustomerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
      <CustomerForm />
    </Suspense>
  )
}