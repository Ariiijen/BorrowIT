import { useState } from 'react'
import { toast } from 'sonner'

import { useBorrowRequests } from '@/features/borrowing/hooks/useBorrowRequests'
import { useRentalActions } from '@/features/borrowing/hooks/useRentalActions'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { supabase } from '@/lib/supabase'

export function BorrowRequestsTable() {
  const { profile, user } = useAuth()
  const { data, isLoading, error } = useBorrowRequests()
  const { approve, reject, cancel, pickedUp, recordReturn } = useRentalActions()
  const [returningId, setReturningId] = useState('')
  const [returnCondition, setReturnCondition] = useState<'New' | 'Good' | 'Fair' | 'Damaged'>('Good')
  const [returnNotes, setReturnNotes] = useState('')
  const [disputeRequestId, setDisputeRequestId] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')

  if (isLoading) return <div className="space-y-3 p-4">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-12 w-full" />)}</div>
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load requests: {error.message}</p>
  if (!data?.length) return <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">No borrowing requests yet.</div>

  function run<T>(mutator: {
    mutate: (value: T, options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }) => void
  }, value: T, success: string) {
    mutator.mutate(value, {
      onSuccess: () => toast.success(success),
      onError: (mutationError: Error) => toast.error(mutationError.message),
    })
  }

  async function submitDispute() {
    if (!user || !profile || !disputeRequestId || !disputeDescription.trim()) {
      toast.error('Complete the dispute description before submitting.')
      return
    }
    const request = data?.find((item) => item.id === disputeRequestId)
    if (!request) {
      toast.error('Borrowing request was not found.')
      return
    }
    const extended = request as typeof request & { equipment_owner_id?: string | null }
    const againstUserId = profile.role === 'Lender'
      ? request.borrower_id
      : extended.equipment_owner_id ?? request.lender_id
    if (!againstUserId || againstUserId === user.id) {
      toast.error('The other participant could not be identified.')
      return
    }
    const { error: insertError } = await supabase.from('dispute').insert({
      borrowing_request_id: disputeRequestId,
      reporter_id: user.id,
      against_user_id: againstUserId,
      description: disputeDescription.trim(),
      status: 'Open',
    })
    if (insertError) {
      toast.error(insertError.message)
      return
    }
    toast.success('Dispute submitted for Admin review.')
    setDisputeRequestId('')
    setDisputeDescription('')
  }

  return (
    <div>
      <div className="space-y-3 md:hidden">
        {data.map((request) => (
          <article key={request.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{((request as unknown as { equipment_name?: string; equipment_id: string }).equipment_name ?? (request as unknown as { equipment_id: string }).equipment_id)}</p>
                <p className="mt-1 text-xs text-zinc-500">{((request as unknown as { borrower_name?: string; borrower_id: string }).borrower_name ?? (request as unknown as { borrower_id: string }).borrower_id)}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{request.start_date} to {request.end_date}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Pending' && <>
                <button className="min-h-10 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white" onClick={() => run(approve, request.id, 'Request approved.')}>Approve</button>
                <button className="min-h-10 rounded-md border border-red-300 px-3 text-xs font-semibold text-red-700" onClick={() => run(reject, { requestId: request.id }, 'Request rejected.')}>Reject</button>
              </>}
              {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Borrowed' && !request.picked_up_at && <>
                <button className="min-h-10 rounded-md border border-zinc-300 px-3 text-xs font-semibold" onClick={() => run(pickedUp, request.id, 'Pickup recorded.')}>Mark picked up</button>
                <button className="min-h-10 rounded-md border border-red-300 px-3 text-xs font-semibold text-red-700" onClick={() => run(cancel, { requestId: request.id }, 'Accepted request cancelled.')}>Cancel</button>
              </>}
              {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Borrowed' && request.picked_up_at && returningId !== request.id && (
                <button className="min-h-10 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white" onClick={() => setReturningId(request.id)}>Record return</button>
              )}
              {profile?.role !== 'Lender' && profile?.role !== 'Admin' && request.status === 'Pending' && (
                <button className="min-h-10 rounded-md border border-red-300 px-3 text-xs font-semibold text-red-700" onClick={() => run(cancel, { requestId: request.id }, 'Request cancelled.')}>Cancel</button>
              )}
              {(profile?.role === 'Borrower' || profile?.role === 'Faculty' || profile?.role === 'Lender') && ['Borrowed', 'Returned'].includes(request.status) && (
                <button className="min-h-10 rounded-md border border-amber-300 px-3 text-xs font-semibold text-amber-700" onClick={() => { setDisputeRequestId(request.id); setDisputeDescription('') }}>Report dispute</button>
              )}
            </div>
            {returningId === request.id && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select aria-label="Returned condition" value={returnCondition} onChange={(event) => setReturnCondition(event.target.value as typeof returnCondition)} className="h-9 rounded-md border px-2 text-xs">
                  <option>New</option><option>Good</option><option>Fair</option><option>Damaged</option>
                </select>
                <input value={returnNotes} onChange={(event) => setReturnNotes(event.target.value)} placeholder="Return remarks" className="h-9 min-w-32 rounded-md border px-2 text-xs" />
                <button className="min-h-10 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white" onClick={() => run(recordReturn, { requestId: request.id, condition: returnCondition, notes: returnNotes }, 'Return recorded.')}>Save return</button>
                <button className="min-h-10 text-xs text-zinc-500" onClick={() => setReturningId('')}>Close</button>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
      <table className="min-w-full divide-y divide-zinc-200 text-left dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600">Equipment</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600">Borrower</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600">Dates</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600">Status</th>
            <th className="px-4 py-3 text-sm font-medium text-zinc-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.map((request) => (
            <tr key={request.id}>
              <td className="px-4 py-3 text-sm font-medium">{((request as unknown as { equipment_name?: string; equipment_id: string }).equipment_name ?? (request as unknown as { equipment_id: string }).equipment_id)}</td>
              <td className="px-4 py-3 text-sm">{((request as unknown as { borrower_name?: string; borrower_id: string }).borrower_name ?? (request as unknown as { borrower_id: string }).borrower_id)}</td>
              <td className="px-4 py-3 text-sm text-zinc-600">{request.start_date} to {request.end_date}</td>
              <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Pending' && <>
                    <button className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => run(approve, request.id, 'Request approved.')}>Approve</button>
                    <button className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => run(reject, { requestId: request.id }, 'Request rejected.')}>Reject</button>
                  </>}
                  {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Borrowed' && !request.picked_up_at && <>
                    <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold" onClick={() => run(pickedUp, request.id, 'Pickup recorded.')}>Mark picked up</button>
                    <button className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => run(cancel, { requestId: request.id }, 'Accepted request cancelled.')}>Cancel</button>
                  </>}
                  {(profile?.role === 'Lender' || profile?.role === 'Admin') && request.status === 'Borrowed' && request.picked_up_at && returningId !== request.id && (
                    <button className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => setReturningId(request.id)}>Record return</button>
                  )}
                  {profile?.role !== 'Lender' && profile?.role !== 'Admin' && request.status === 'Pending' && (
                    <button className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => run(cancel, { requestId: request.id }, 'Request cancelled.')}>Cancel</button>
                  )}
                  {(profile?.role === 'Borrower' || profile?.role === 'Faculty' || profile?.role === 'Lender') && ['Borrowed', 'Returned'].includes(request.status) && (
                    <button className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700" onClick={() => { setDisputeRequestId(request.id); setDisputeDescription('') }}>Report dispute</button>
                  )}
                </div>
                {returningId === request.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select aria-label="Returned condition" value={returnCondition} onChange={(event) => setReturnCondition(event.target.value as typeof returnCondition)} className="h-9 rounded-md border px-2 text-xs">
                      <option>New</option><option>Good</option><option>Fair</option><option>Damaged</option>
                    </select>
                    <input value={returnNotes} onChange={(event) => setReturnNotes(event.target.value)} placeholder="Return remarks" className="h-9 rounded-md border px-2 text-xs" />
                    <button className="rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => run(recordReturn, { requestId: request.id, condition: returnCondition, notes: returnNotes }, 'Return recorded.')}>Save return</button>
                    <button className="text-xs text-zinc-500" onClick={() => setReturningId('')}>Close</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {disputeRequestId && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Report dispute">
        <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6">
          <h2 className="text-lg font-semibold">Report a dispute</h2>
          <p className="mt-1 text-sm text-zinc-500">Describe the issue clearly. An Admin will review it and record a decision.</p>
          <textarea
            autoFocus
            rows={5}
            value={disputeDescription}
            onChange={(event) => setDisputeDescription(event.target.value)}
            placeholder="Describe damage, missing items, late return, or another concern..."
            className="mt-4 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="min-h-10 rounded-lg border px-4 text-sm" onClick={() => setDisputeRequestId('')}>Cancel</button>
            <button type="button" className="min-h-10 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!disputeDescription.trim()} onClick={() => void submitDispute()}>Submit dispute</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
