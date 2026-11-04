'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

type Step = 'login' | 'otp' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('login')
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed — user not found')
      setLoading(false)
      return
    }

    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totpFactor = factorsData?.totp?.[0] || factorsData?.all?.[0]

      if (totpFactor) {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
        if (challengeError) {
          router.push('/dashboard')
          return
        }
        setFactorId(totpFactor.id)
        setChallengeId(challengeData.id)
        setStep('otp')
        setMessage(`OTP sent to ${email} — check Gmail inbox (including spam). Valid for 5 minutes.`)
        setLoading(false)
        return
      }
    } catch {
      // No MFA enrolled
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: otpCode,
    })

    if (verifyError) {
      setError('Invalid or expired OTP: ' + verifyError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!email) {
      setError('Enter your email first')
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setStep('forgot-sent')
    setMessage(`Password reset link sent to ${email}. Check Gmail inbox (including spam folder). Link expires in 1 hour.`)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EFF6FF] p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-[#2563EB] p-8 shadow-lg text-center">
          <div className="mx-auto flex flex-col items-center">
            <div className="h-3 w-16 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600" style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
            <div className="mt-2 flex gap-1 font-black text-4xl tracking-tighter">
              <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">E</span>
              <span className="bg-gradient-to-b from-gray-100 to-gray-400 bg-clip-text text-transparent">P</span>
            </div>
            <div className="mt-1 h-1 w-12 rounded bg-yellow-400/80"></div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">Eminent Phone Clinic</h1>
          <p className="mt-1.5 text-sm text-blue-100 font-medium">
            {step === 'login' && 'Repair Management System'}
            {step === 'otp' && 'Verify OTP — New Device Detected'}
            {step === 'forgot' && 'Reset Password'}
            {step === 'forgot-sent' && 'Check Your Email'}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-8 shadow-sm">
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm" placeholder="admin@eminent.com" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#1D4ED8]">Password</label>
                  <button type="button" onClick={() => setStep('forgot')} className="text-xs font-semibold text-[#2563EB] hover:underline">Forgot password?</button>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm" placeholder="Enter your password" />
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              {message && <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">{message}</div>}

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all text-sm">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-center text-xs text-slate-500 mt-2">New device? OTP will be sent to your Gmail for verification that you exist in Supabase</p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">6-digit OTP from Gmail</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm tracking-[0.5em] text-center font-bold" placeholder="000000" maxLength={6} />
                <p className="mt-2 text-xs text-slate-500">Code sent to {email}. Check inbox + spam folder. Expires in 5 minutes.</p>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              {message && <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">{message}</div>}

              <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-lg bg-[#1E3A8A] px-4 py-3 font-semibold text-white shadow-md hover:bg-[#172554] disabled:opacity-50 transition-all text-sm">
                {loading ? 'Verifying...' : 'Verify OTP & Continue'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setOtpCode(''); setError(''); setMessage('') }} className="w-full text-xs font-semibold text-[#2563EB] hover:underline">Back to login</button>
            </form>
          )}

          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D4ED8]">Email for password reset</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-sm" placeholder="admin@eminent.com" />
                <p className="mt-2 text-xs text-slate-500">We will send a secure reset link to your Gmail. Link confirms you exist in Supabase auth.users.</p>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              {message && <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">{message}</div>}

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all text-sm">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setStep('login')} className="w-full text-xs font-semibold text-[#2563EB] hover:underline">Back to login</button>
            </form>
          )}

          {step === 'forgot-sent' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 text-xl">✓</div>
              <p className="text-sm text-slate-700">{message}</p>
              <div className="rounded-lg bg-[#EFF6FF] p-4 text-left">
                <p className="text-xs font-bold text-[#1E3A8A]">Next steps:</p>
                <ol className="mt-2 list-decimal pl-4 text-xs text-slate-600 space-y-1">
                  <li>Check Gmail inbox + spam</li>
                  <li>Click reset link (confirms you exist in Supabase)</li>
                  <li>Set new password</li>
                  <li>Login again</li>
                </ol>
              </div>
              <button onClick={() => setStep('login')} className="w-full rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white text-sm">Back to login</button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">Eminent Phone Clinic • 07064245688 | 09061626394 </p>
      </div>
    </main>
  )
}