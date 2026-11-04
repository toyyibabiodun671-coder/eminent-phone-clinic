'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <h2 className="text-xl font-bold">Something went wrong!</h2>
          <p className="mt-2 text-sm text-slate-500">{error.message}</p>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}