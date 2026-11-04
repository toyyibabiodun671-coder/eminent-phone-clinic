'use client'

export type ReceiptItem = {
  description: string
  qty: number
  amount: number
}

export type RepairSummary = {
  totalCharges: number
  paidAmount: number
  outstanding: number
  deviceInfo: string
  problem: string
  transactions: { amount: number; date: string; method: string }[]
}

type ReceiptProps = {
  type: 'sale' | 'repair'
  invoiceNo: string
  date: string
  customerName: string
  paymentMethod: string
  items: ReceiptItem[]
  total: number
  phone: string
  repairSummary?: RepairSummary | null
}

export default function ReceiptPrint({ type, invoiceNo, date, customerName, paymentMethod, items, total, phone, repairSummary }: ReceiptProps) {
  const receiptNo = invoiceNo.replace('INV-', 'RC-').replace('REP-', 'RC-').replace('SALE-', 'RC-')

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; left: 0; top: 0; width: 360px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="inline-flex h-9 min-w- items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#1D4ED8]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Print Receipt
        </button>
      </div>

      <div id="receipt-print" className="w- border border-gray-100 bg-white p-6 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xl font-black text-white">E</div>
          <div className="leading-tight">
            <h1 className="text- font-black leading-none tracking-tight text-black">EMINENT</h1>
            <h2 className="mt-0.5 text- font-semibold leading-none tracking-tight text-black">Phone Clinic</h2>
            <p className="mt-1 text- font-medium text-[#2563EB]">Professional Phone Repairs</p>
          </div>
        </div>

        <div className="mt-4 border-t-2 border-dashed border-[#2563EB]"></div>
        <div className="mt-1 border-t border-dashed border-[#2563EB]"></div>

        <div className="mt-3 space-y-1 text- text-black">
          <p>
            <span className="font-bold">Receipt No:</span> {receiptNo}
          </p>
          <p>
            <span className="font-bold">Date:</span> {date}
          </p>
          <p>
            <span className="font-bold">Customer:</span> {customerName}
          </p>
          {repairSummary?.deviceInfo && (
            <p>
              <span className="font-bold">Device:</span> {repairSummary.deviceInfo}
            </p>
          )}
          <p>
            <span className="font-bold">Payment:</span> <span className="capitalize">{paymentMethod}</span>
          </p>
          <p>
            <span className="font-bold">Type:</span> {type === 'repair' ? 'Repair Payment' : 'Accessory Sale'}
          </p>
        </div>

        <div className="mt-3 border-t border-dashed border-[#2563EB]"></div>

        <div className="mt-2 flex justify-between border-b-2 border-[#1E3A8A] pb-1 text- font-bold text-black">
          <span className="w-[50%]">ITEM</span>
          <span>QTY</span>
          <span>AMOUNT</span>
        </div>

        <div className="mt-2 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between text- text-black">
              <span className="w-[50%]">
                {i + 1}. {it.description}
              </span>
              <span className="w-[15%] text-center">{it.qty}</span>
              <span className="font-semibold">₦{it.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-dashed border-[#2563EB]"></div>

        {type === 'repair' && repairSummary ? (
          <div className="mt-2 space-y-1.5 text- text-black">
            <div className="flex justify-between">
              <span>Total Charges:</span>
              <span className="font-semibold">₦{repairSummary.totalCharges.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Paid (All):</span>
              <span className="font-semibold text-green-700">₦{repairSummary.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>Outstanding:</span>
              <span>₦{repairSummary.outstanding.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t-2 border-[#2563EB] pt-2">
              <span className="text- font-black">THIS PAYMENT:</span>
              <span className="text- font-black text-[#2563EB]">₦{total.toLocaleString()}</span>
            </div>
            {repairSummary.transactions.length > 1 && (
              <div className="mt-3 border-t border-dashed border-blue-200 pt-2">
                <p className="text- font-bold uppercase text-[#2563EB]">History</p>
                {repairSummary.transactions.map((t, idx) => (
                  <div key={idx} className="mt-1 flex justify-between text- text-slate-600">
                    <span>
                      {t.date} • {t.method}
                    </span>
                    <span className="font-semibold">₦{t.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-1 text- text-black">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">₦{total.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t-2 border-[#2563EB] pt-2">
              <span className="text- font-black">TOTAL:</span>
              <span className="text- font-black text-[#2563EB]">₦{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text- font-semibold text-[#2563EB]">Thank you for choosing EMINENT PHONE CLINIC!</p>
          <p className="mt-2 text- font-medium text-gray-800">90-Day Warranty on Repairs • We appreciate your business!</p>
          <p className="mt-3 text- text-gray-500">Eminent Phone Clinic • {phone}</p>
        </div>
      </div>
    </>
  )
}