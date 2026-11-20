'use client'

import { useEffect, useState } from 'react'

// Animated number - counts up like ₦0 -> ₦45,000
export function AnimatedCounter({ value, prefix = '₦', className = '' }: { value: number, prefix?: string, className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 800
    const stepTime = 16
    const steps = duration / stepTime
    const increment = value / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, stepTime)
    return () => clearInterval(timer)
  }, [value])
  return <span className={className}>{prefix}{display.toLocaleString()}</span>
}

// Sales Goal Progress Bar
export function SalesGoalBar({ todaySales, goal = 100000 }: { todaySales: number, goal?: number }) {
  const percent = Math.min(100, Math.round((todaySales / goal) * 100))
  const remaining = Math.max(0, goal - todaySales)
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">🎯 TODAY&apos;S SALES GOAL</p>
          <p className="mt-1 text-lg font-bold text-slate-900"><AnimatedCounter value={todaySales} /> <span className="text-sm font-medium text-slate-400">/ ₦{goal.toLocaleString()}</span></p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${percent >= 100 ? 'bg-green-100 text-green-700' : percent >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
          {percent >= 100 ? '🎉 Goal Hit!' : `${percent}% Done`}
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {percent >= 100 ? 'Amazing work! You smashed today\'s target 🔥' : `₦${remaining.toLocaleString()} more to hit today\'s goal — keep going!`}
      </p>
    </div>
  )
}

// Top Technician Card
export type TopTech = { name: string; repairs: number; sales: number; avatar?: string }

export function TopTechnician({ techs }: { techs: TopTech[] }) {
  if (!techs.length) return null
  const sorted = [...techs].sort((a, b) => b.repairs - a.repairs)
  const top = sorted[0]
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-amber-600">🏆 TOP TECHNICIAN THIS WEEK</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-xl font-bold text-white shadow">
          {top.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-slate-900">{top.name} <span className="text-amber-500">★</span></p>
          <p className="text-xs text-slate-500">{top.repairs} repairs • ₦{top.sales.toLocaleString()} sales</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-white">TOP</span>
      </div>
      <div className="mt-4 space-y-2">
        {sorted.slice(0, 3).map((t, i) => (
          <div key={t.name} className="flex items-center gap-2 text-sm">
            <span>{medals[i]}</span>
            <span className="flex-1 font-medium text-slate-700">{t.name}</span>
            <span className="text-xs text-slate-400">{t.repairs} repairs</span>
            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${top.repairs ? (t.repairs / top.repairs) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">Leaderboard updates every day — who will be #1 tomorrow?</p>
    </div>
  )
}