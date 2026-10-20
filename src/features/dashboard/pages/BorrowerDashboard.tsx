import { CalendarClock, ClipboardList, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMyDashboardData } from '../hooks/useMyDashboardData'

export function BorrowerDashboard() {
  const { profile } = useAuth()
  const { data, isLoading, error } = useMyDashboardData()
  const summary = data && 'activeBorrowings' in data ? data : null
  const stats = [
    { label: 'Active loans', value: summary?.activeBorrowings.length ?? 0, icon: PackageCheck },
    { label: 'Pending requests', value: summary?.pendingRequests.length ?? 0, icon: ClipboardList },
    { label: 'Overdue items', value: summary?.overdueItems.length ?? 0, icon: CalendarClock },
  ]
  return (
    <div className="space-y-8">
      <div><p className="text-sm text-emerald-800 dark:text-emerald-400">{profile?.role} workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your dashboard</h1><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">A clear view of the equipment you have requested and borrowed.</p></div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Dashboard data could not be loaded: {error.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p><Icon size={18} className="text-emerald-700 dark:text-emerald-400" /></div><p className="mt-4 text-3xl font-semibold">{isLoading ? <Skeleton className="h-8 w-12" /> : value}</p></div>)}</div>
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent requests</h2><Link to="/requests" className="text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-400">View all</Link></div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">{summary?.recentActivity.length ? <table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800"><tr><th className="px-4 py-3 font-medium">Request</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Return date</th></tr></thead><tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{summary.recentActivity.map((item) => <tr key={item.id}><td className="px-4 py-3">Equipment request</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.end_date}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-zinc-500">No recent requests yet. Browse the catalog to get started.</p>}</div>
      </section>
    </div>
  )
}
