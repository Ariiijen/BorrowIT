import { ArrowRightLeft, CalendarClock, ClipboardList, Clock3 } from 'lucide-react'

import { StatCard } from '@/components/shared/StatCard'
import { BorrowRequestsTable } from '@/features/borrowing/components/BorrowRequestsTable'

export function BorrowingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Overview</p>
          <h1 className="text-3xl font-bold text-slate-900">Borrowing Dashboard</h1>
        </div>
      </div>

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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recent requests</h2>
          <button type="button" className="text-sm font-medium text-blue-600">
            View all
          </button>
        </div>

        <BorrowRequestsTable />
      </div>
    </div>
  )
}
