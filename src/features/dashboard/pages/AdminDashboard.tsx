import { AlertTriangle, ClipboardList, Laptop, Users } from 'lucide-react'

import { useMyDashboardData } from '../hooks/useMyDashboardData'
import { Skeleton } from '@/components/ui/Skeleton'

export function AdminDashboard() {
  const { data, isLoading, error } = useMyDashboardData()
  const summary = data && 'totalEquipment' in data ? data : null
  const stats = [
    { label: 'Equipment items', value: summary?.totalEquipment ?? 0, icon: Laptop },
    { label: 'Active borrowings', value: summary?.activeBorrowings.length ?? 0, icon: ClipboardList },
    { label: 'Open disputes', value: summary?.openDisputes ?? 0, icon: AlertTriangle },
    { label: 'Registered users', value: summary?.totalUsers ?? 0, icon: Users },
  ]
  return (
    <div className="space-y-8">
      <div><p className="text-sm text-emerald-800 dark:text-emerald-400">Administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Campus overview</h1><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Monitor equipment circulation, outstanding requests, and account activity.</p></div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Dashboard data could not be loaded: {error.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p><Icon size={18} className="text-emerald-700 dark:text-emerald-400" /></div><p className="mt-4 text-3xl font-semibold">{isLoading ? <Skeleton className="h-8 w-12" /> : value}</p></div>)}</div>
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800"><h2 className="font-semibold">Needs attention</h2><div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">{summary?.pendingApprovals.length ? `${summary.pendingApprovals.length} requests are awaiting review.` : 'No pending requests.'}</div></section>
    </div>
  )
}
