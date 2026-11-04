'use client'

import { useState } from 'react'
import { recordSale, type AccessorySaleResult } from '@/lib/transactions'
import PaymentSuccessPopup from '@/components/payments/payment-success-popup'

type Accessory = { id: string; name: string; selling_price: number | string; stock_quantity: number }
type SaleData = { name: string; qty: number; total: number; method: string }

export default function SellForm({ acc }: { acc: Accessory }) {
  const [qty, setQty] = useState(Math.max(1, Math.min(2, acc.stock_quantity)))
  const [method, setMethod] = useState<'cash' | 'transfer' | 'pos'>('cash')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [saleRequestId, setSaleRequestId] = useState('')

  const total = qty * Number(acc.selling_price)
  const outOfStock = acc.stock_quantity < 1

  async function handleSell(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    if (outOfStock) {
      alert('This accessory is out of stock.')
      return
    }
    if (!Number.isInteger(qty) || qty < 1) {
      alert('Enter a valid quantity of at least 1.')
      return
    }
    if (qty > acc.stock_quantity) {
      alert(`Only ${acc.stock_quantity} in stock. Refresh the page to get the latest stock.`)
      return
    }
    if (!Number.isFinite(Number(acc.selling_price)) || Number(acc.selling_price) <= 0) {
      alert('This accessory has an invalid selling price. Please contact the admin.')
      return
    }

    setLoading(true)
    const requestId = saleRequestId || crypto.randomUUID()
    setSaleRequestId(requestId)

    try {
      const result = await recordSale({
        amount: total,
        transaction_type: 'accessory_sale',
        payment_method: method,
        description: `${qty}x ${acc.name}`,
        accessory_id: acc.id,
        quantity: qty,
        request_id: requestId,
      })
      if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true) {
        throw new Error('The database did not confirm the sale. Retry the same submission.')
      }
      const confirmedSale = result as AccessorySaleResult
      if (
        typeof confirmedSale.accessory_sale_id !== 'string' ||
        typeof confirmedSale.name !== 'string' ||
        !Number.isInteger(confirmedSale.quantity) ||
        confirmedSale.quantity < 1 ||
        typeof confirmedSale.total !== 'number' ||
        !Number.isFinite(confirmedSale.total) ||
        confirmedSale.total <= 0 ||
        !['cash', 'transfer', 'pos'].includes(confirmedSale.payment_method) ||
        typeof confirmedSale.duplicate !== 'boolean'
      ) {
        throw new Error('The database response could not be verified. Retry the same submission.')
      }

      setSaleData({ name: confirmedSale.name, qty: confirmedSale.quantity, total: confirmedSale.total, method: confirmedSale.payment_method })
      setShowSuccess(true)
      setSaleRequestId(crypto.randomUUID())
      setTimeout(() => {
        setShowSuccess(false)
        window.location.reload()
      }, 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not confirm the sale.'
      console.error('Accessory sale error:', err)
      alert(`Sale was not confirmed: ${message}\n\nDo not make another sale yet if your network disconnected. Retry this same submission first so the system can check the original request.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSell} className="mt-6 space-y-5">
        {outOfStock && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            This accessory is out of stock and cannot be sold.
          </div>
        )}
        <div>
          <label htmlFor="sale-quantity" className="text-sm font-semibold text-[#1D4ED8]">
            Quantity
          </label>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={loading || outOfStock || qty <= 1}
              onClick={() => setQty((current) => Math.max(1, current - 1))}
              className="h-12 w-12 rounded-xl border border-blue-200 bg-white font-bold text-[#2563EB] disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              id="sale-quantity"
              type="number"
              min={1}
              max={acc.stock_quantity}
              step={1}
              value={qty}
              disabled={loading || outOfStock}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (Number.isInteger(value) && value >= 1) setQty(Math.min(value, Math.max(1, acc.stock_quantity)))
              }}
              className="h-12 min-w-0 flex-1 rounded-xl border border-blue-200 bg-slate-50 px-4 text-center font-bold outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              required
            />
            <button
              type="button"
              disabled={loading || outOfStock || qty >= acc.stock_quantity}
              onClick={() => setQty((current) => Math.min(acc.stock_quantity, current + 1))}
              className="h-12 w-12 rounded-xl border border-blue-200 bg-white font-bold text-[#2563EB] disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Available stock: {acc.stock_quantity}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Unit Price</span>
            <span className="font-semibold text-[#1E3A8A]">₦{Number(acc.selling_price).toLocaleString()}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-blue-100 pt-3">
            <span className="font-bold text-[#1E3A8A]">Total</span>
            <span className="text-lg font-black text-[#2563EB]">₦{total.toLocaleString()}</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#1D4ED8]">Payment Method</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['cash', 'transfer', 'pos'] as const).map((paymentMethod) => (
              <button
                key={paymentMethod}
                type="button"
                disabled={loading || outOfStock}
                onClick={() => setMethod(paymentMethod)}
                className={`rounded-xl border py-3 text-sm font-bold uppercase disabled:opacity-50 ${method === paymentMethod ? 'border-black bg-black text-white' : 'border-blue-200 bg-white text-[#2563EB] hover:bg-[#EFF6FF]'}`}
              >
                {paymentMethod}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || outOfStock}
          className="w-full rounded-xl bg-[#2563EB] py-4 font-bold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing...' : outOfStock ? 'Out of Stock' : `Confirm Sale — ₦${total.toLocaleString()}`}
        </button>
      </form>
      {showSuccess && saleData && (
        <PaymentSuccessPopup
          amount={saleData.total}
          description={`${saleData.qty}x ${saleData.name}`}
          method={saleData.method}
          title="Sale Successful!"
          subtitle="Accessory sale recorded successfully."
        />
      )}
    </>
  )
}