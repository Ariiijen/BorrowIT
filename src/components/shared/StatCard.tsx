import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  change: string
  icon: ReactNode
  tone?: 'blue' | 'green' | 'amber' | 'violet'
}

const toneStyles = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  violet: 'bg-violet-50 text-violet-700',
}

export function StatCard({ label, value, change, icon, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-emerald-600">{change}</p>
    </div>
  )
}
