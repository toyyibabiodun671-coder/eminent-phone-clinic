'use client'
import { useState } from 'react'

export default function RestockForm({ id, currentStock, name }: { id: string; currentStock: number; name?: string }) {
  const [qty, setQty] = useState(10)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newStock, setNewStock] = useState(0)
  const [msg, setMsg] = useState('')

  async function doRestock() {
    setSaving(true)
    setShowConfirm(false)
    const res = await fetch(`/api/accessories/${id}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMsg(json.error || 'Failed to restock')
      setSaving(false)
      return
    }
    setNewStock(json.new_stock)
    setShowSuccess(true)
    setTimeout(() => window.location.reload(), 2500)
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setShowConfirm(true)
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-20 rounded-xl border border-blue-200 bg-white px-3 py-2 text-center font-bold outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
        <button disabled={saving} className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-zinc-800 disabled:opacity-50">
          {saving ? 'Adding...' : 'Add Stock'}
        </button>
        {msg && <span className="text-sm font-medium text-red-600">{msg}</span>}
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl text-white">+</div>
              <h2 className="mt-4 text-xl font-bold text-[#1E3A8A]">Confirm Restock?</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add <b>{qty} units</b> to <b>{name || 'this item'}</b> — stock <b>{currentStock} → {currentStock + qty}</b>
              </p>
              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowConfirm(false)} className="rounded-xl border border-blue-200 bg-white py-3 text-sm font-semibold text-[#2563EB]">
                  Cancel
                </button>
                <button type="button" onClick={doRestock} className="rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white shadow hover:bg-blue-700">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">✓</div>
              <h2 className="mt-4 text-xl font-bold text-green-700">Restocked!</h2>
              <p className="mt-1 text-sm text-gray-500">{name || 'Item'} restocked successfully.</p>
              <div className="mt-6 w-full rounded-2xl border border-green-100 bg-green-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Added</span>
                  <span className="font-semibold">+{qty} units</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Old Stock</span>
                  <span className="font-semibold">{currentStock}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">New Stock</span>
                  <span className="font-semibold text-green-700">{newStock}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">Taking you back...</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}