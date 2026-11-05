import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function DisputesPage() {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const disputes = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dispute').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
  const resolve = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'UnderReview' | 'Resolved' | 'Dismissed' }) => {
      const { error } = await supabase.from('dispute').update({ status, resolution_notes: notes[id] || null }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Dispute updated.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Disputes" description="Review flagged rentals and record resolution decisions." />
      {disputes.error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{disputes.error.message}</p>}
      {disputes.isLoading ? <p className="text-sm text-zinc-500">Loading disputes...</p> : !disputes.data?.length ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">No disputes found.</p> :
        <div className="space-y-3">
          {disputes.data.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{item.description}</p><p className="mt-1 text-xs text-zinc-500">Request {item.borrowing_request_id} · {new Date(item.created_at).toLocaleString()}</p></div>
                <StatusBadge status={item.status} />
              </div>
              <label className="mt-4 block text-sm"><span className="mb-1.5 block font-medium">Resolution notes</span>
                <textarea rows={3} value={notes[item.id] ?? item.resolution_notes ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['UnderReview', 'Resolved', 'Dismissed'] as const).map((status) => (
                  <button key={status} disabled={resolve.isPending} onClick={() => resolve.mutate({ id: item.id, status })} className="rounded-md border px-3 py-2 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800">{status}</button>
                ))}
              </div>
            </article>
          ))}
        </div>}
    </div>
  )
}
