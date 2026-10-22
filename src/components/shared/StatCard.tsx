import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  change: string
  icon: ReactNode
  tone?: 'blue' | 'green' | 'amber' | 'violet'
}

const toneStyles = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

export function StatCard({ label, value, change, icon, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <h3 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">{change}</p>
    </div>
  )
}
