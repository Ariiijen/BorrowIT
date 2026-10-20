import { BorrowRequestsTable } from './components/BorrowRequestsTable'

export function RequestsPage() {
  return <div className="space-y-5"><div><p className="text-sm text-emerald-800 dark:text-emerald-400">Request history</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Borrowing requests</h1><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Requests visible to your account under the campus access policy.</p></div><BorrowRequestsTable /></div>
}
