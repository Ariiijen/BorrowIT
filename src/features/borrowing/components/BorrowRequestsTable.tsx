import { useBorrowRequests } from '@/features/borrowing/hooks/useBorrowRequests'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function BorrowRequestsTable() {
  const { data, isLoading, error } = useBorrowRequests()

  if (isLoading) {
    return (
      <div className="space-y-3 p-4" aria-label="Loading borrowing requests">
        {[0, 1, 2, 3].map((row) => <div key={row} className="flex items-center gap-4"><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20" /></div>)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
        Failed to load requests: {error.message}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No borrowing requests yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 text-left dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Equipment</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Borrower</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Status</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Due date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {data.map((request) => (
            <tr key={request.id} className="transition-colors hover:bg-zinc-50 focus-within:bg-pink-50/40 dark:hover:bg-zinc-800/50 dark:focus-within:bg-pink-950/20">
            <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{request.equipment_id}</td>
            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{request.borrower_id}</td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                {request.due_date ? new Date(request.due_date).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
