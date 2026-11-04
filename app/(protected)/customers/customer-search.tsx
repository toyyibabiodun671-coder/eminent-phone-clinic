'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CustomerSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') || searchParams.get('q') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set('search', value.trim())
      } else {
        params.delete('search')
        params.delete('q')
      }

      const query = params.toString()
      router.push(query ? `/customers?${query}` : '/customers')
    }, 300)

    return () => clearTimeout(timer)
  }, [value, router, searchParams])

  return (
    <div className="mt-6">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by name, phone or email..."
        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-[#1E3A8A]"
      />
    </div>
  )
}