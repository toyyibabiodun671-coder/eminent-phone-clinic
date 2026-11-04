import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import ExpenseForm from '@/components/expenses/expense-form'

type StaffRole = 'admin' | 'manager' | 'technician' | 'sales' | 'apprentice' | 'owner'

export default async function NewExpensePage() {
  const profile = await getCurrentProfile()
  const role = profile.role as StaffRole
  const isAdmin = role === 'admin' || role === 'manager' || role === 'owner'
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl bg-[#2563EB] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">Add Expense</h1>
        <p className="mt-1 text-sm text-blue-100">Record workshop expense — Lagos timezone</p>
      </div>
      <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <ExpenseForm />
      </div>
    </div>
  )
}