'use client'

type Props = {
  amount: number
  description: string
  method: string
  title?: string
  subtitle?: string
}

export default function PaymentSuccessPopup({ amount, description, method, title = 'Payment Successful!', subtitle = 'Your payment has been recorded successfully.' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <span className="text-4xl text-green-600">✓</span>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-green-700">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>

        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
          <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-gray-600">Description</span>
            <span className="break-words text-right font-semibold text-gray-900">{description}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm">
            <span className="text-gray-600">Payment method</span>
            <span className="font-semibold uppercase text-gray-900">{method}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-green-200 pt-3">
            <span className="font-bold text-gray-900">Total received</span>
            <span className="text-lg font-bold text-green-700">₦{amount.toLocaleString('en-NG')}</span>
          </div>
        </div>

        <p className="mt-5 text-xs text-gray-500">Taking you back...</p>
      </div>
    </div>
  )
}