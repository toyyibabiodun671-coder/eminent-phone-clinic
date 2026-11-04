import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import CustomerSearch from './customer-search'

export const dynamic = 'force-dynamic'

type CustomerRow = {
  id: string
  full_name: string
  phone: string
  email: string | null
  created_at: string
}

type SearchParams = {
  search?: string
  q?: string
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await getCurrentProfile()
  const supabase = await createClient()

  const params = await searchParams
  const search = (params.search || params.q || '').trim()

  let query = supabase
    .from('customers')
    .select('id, full_name, phone, email, created_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Unable to load customers: ' + error.message)
  }

  const customers = (data as CustomerRow[] | null) || []

  return (
    <div className="min-h-screen bg-[#EFF6FF] -m-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] sm:text-3xl">
            Customers
          </h1>
          <p className="mt-2 text-sm text-[#1D4ED8]">
            Register and manage workshop customers.
          </p>
        </div>

        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          + Add Customer
        </Link>
      </div>

      <Suspense fallback={<div className="mt-6 h-12 rounded-xl bg-white border border-blue-200 animate-pulse" />}>
        <CustomerSearch />
      </Suspense>

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w- text-left">
            <thead className="border-b border-blue-200 bg-[#EFF6FF]">
              <tr>
                <th className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">Customer</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">Phone</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">Email</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">Registered</th>
                <th className="px-5 py-4 text-sm font-bold text-[#1D4ED8]">Action</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-blue-50 hover:bg-[#EFF6FF]/50 transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-semibold">
                    <Link href={`/customers/${customer.id}`} className="text-[#1E3A8A] hover:text-[#2563EB] hover:underline">
                      {customer.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{customer.phone}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{customer.email || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/customers/${customer.id}`} className="text-xs font-bold text-[#2563EB] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && !search && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
                      <span className="text-xl">👥</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#1D4ED8]">No customers registered yet.</p>
                    <p className="text-xs text-slate-500">Add your first customer to get started</p>
                  </td>
                </tr>
              )}

              {customers.length === 0 && search && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-[#1E3A8A]">No customer found for {search}</p>
                    <Link href={`/customers/new?phone=${encodeURIComponent(search)}`} className="mt-3 inline-block rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white">
                      + Add {search} as New Customer
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}