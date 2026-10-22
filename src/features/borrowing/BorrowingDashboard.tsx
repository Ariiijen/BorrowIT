import { ArrowRightLeft, CalendarClock, ClipboardList, Clock3 } from 'lucide-react'

import { StatCard } from '@/components/shared/StatCard'
import { BorrowRequestsTable } from '@/features/borrowing/components/BorrowRequestsTable'
import { PageHeader } from '@/components/shared/PageHeader'

export function BorrowingDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title="Borrowing dashboard" description="A summary of active loans, upcoming returns, and recent requests." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active loans"
          value="48"
          change="+12% this month"
          tone="blue"
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          label="Due today"
          value="07"
          change="2 require review"
          tone="amber"
          icon={<CalendarClock size={20} />}
        />
        <StatCard
          label="Returns processed"
          value="94"
          change="+8% completion"
          tone="green"
          icon={<ArrowRightLeft size={20} />}
        />
        <StatCard
          label="Pending requests"
          value="14"
          change="5 urgent"
          tone="violet"
          icon={<Clock3 size={20} />}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent requests</h2>
          <button type="button" className="rounded-sm text-sm font-medium text-zinc-600 transition-colors hover:text-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:text-zinc-400 dark:hover:text-pink-300 dark:focus-visible:ring-offset-zinc-950">
            View all
          </button>
        </div>

        <BorrowRequestsTable />
      </div>
    </div>
  )
}
