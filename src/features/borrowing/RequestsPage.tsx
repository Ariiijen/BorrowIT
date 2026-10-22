import { BorrowRequestsTable } from './components/BorrowRequestsTable'
import { PageHeader } from '@/components/shared/PageHeader'

export function RequestsPage() {
  return <div className="space-y-8"><PageHeader eyebrow="Request history" title="Borrowing requests" description="Requests visible to your account under the campus access policy." /><BorrowRequestsTable /></div>
}
