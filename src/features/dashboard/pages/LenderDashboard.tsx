import { ClipboardCheck, Laptop, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useMyDashboardData } from '../hooks/useMyDashboardData'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'

export function LenderDashboard() {
  const { data, isLoading, error } = useMyDashboardData()
  const summary = data && 'myListings' in data ? data : null
  const stats = [
    { label: 'My listings', value: summary?.myListings.length ?? 0, icon: Laptop },
    { label: 'Pending approvals', value: summary?.pendingApprovals.length ?? 0, icon: ClipboardCheck },
    { label: 'Currently lent', value: summary?.currentlyLent.length ?? 0, icon: PackageCheck },
  ]
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Lender workspace" title="Your listings" description="Manage your equipment and keep track of active requests." actions={<Link to="/equipment" className="inline-flex h-10 items-center justify-center rounded-lg border border-pink-700 bg-pink-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950">Manage equipment</Link>} />
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Dashboard data could not be loaded: {error.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"><div className="flex items-center justify-between"><p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p><Icon size={18} className="text-zinc-500 dark:text-zinc-400" /></div><p className="mt-4 text-3xl font-semibold">{isLoading ? <Skeleton className="h-8 w-12" /> : value}</p></div>)}</div>
      <section id="lent" className="scroll-mt-24 border-t border-zinc-200 pt-6 dark:border-zinc-800"><h2 className="font-semibold">Pending approvals</h2><div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700">{summary?.pendingApprovals.length ? `${summary.pendingApprovals.length} request(s) need review.` : 'No requests need your review.'}</div></section>
    </div>
  )
}
