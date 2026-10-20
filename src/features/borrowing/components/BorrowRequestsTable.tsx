import { useBorrowRequests } from '@/features/borrowing/hooks/useBorrowRequests'
import { Skeleton } from '@/components/ui/Skeleton'

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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load requests: {error.message}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No borrowing requests yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-slate-600">Equipment</th>
            <th className="px-4 py-3 text-sm font-medium text-slate-600">Borrower</th>
            <th className="px-4 py-3 text-sm font-medium text-slate-600">Status</th>
            <th className="px-4 py-3 text-sm font-medium text-slate-600">Due date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((request) => (
            <tr key={request.id}>
              <td className="px-4 py-3 text-sm text-slate-900">{request.equipment_id}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{request.borrower_id}</td>
              <td className="px-4 py-3 text-sm">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  {request.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {request.due_date ? new Date(request.due_date).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
