import { Suspense } from 'react'
import RepairForm from './repair-form'

export const dynamic = 'force-dynamic'

export default function NewRepairPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
      <RepairForm />
    </Suspense>
  )
}