import { useEffect, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { toast } from 'sonner'

import { useCreateBorrowRequest } from '@/features/borrowing/hooks/useCreateBorrowRequest'
import type { Database } from '@/types/database'

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  owner_name?: string | null
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export function BorrowRequestModal({
  equipment,
  onClose,
}: {
  equipment: Equipment
  onClose: () => void
}) {
  const today = formatDate(new Date())
  const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [requestedFrom, setRequestedFrom] = useState(today)
  const [requestedTo, setRequestedTo] = useState(tomorrow)
  const [notes, setNotes] = useState('')
  const { mutate, isPending } = useCreateBorrowRequest()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  function submit() {
    if (!requestedFrom || !requestedTo) {
      toast.error('Choose both borrowing dates.')
      return
    }
    if (requestedTo < requestedFrom) {
      toast.error('Return date must be on or after the start date.')
      return
    }
    mutate({
      equipment_id: equipment.id,
      requested_from: requestedFrom,
      requested_to: requestedTo,
      notes,
    }, {
      onSuccess: () => {
        toast.success('Borrow request sent.')
        onClose()
      },
      onError: (error: Error) => toast.error(error.message || 'Unable to send borrow request.'),
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Borrow ${equipment.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-400">Borrow request</p>
            <h2 className="mt-1 text-lg font-semibold">{equipment.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{equipment.owner_name || (equipment.owner_type === 'School' ? 'USTP Equipment Office' : 'Campus member')}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close borrow request"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-5">
          {equipment.image_url && <img src={equipment.image_url} alt={equipment.name} className="aspect-[16/7] w-full rounded-xl object-cover" />}
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <span className="text-zinc-600 dark:text-zinc-400">Available units</span>
            <strong className="text-emerald-700 dark:text-emerald-400">{equipment.available_stock}/{equipment.total_stock}</strong>
          </div>
          {equipment.terms && <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400"><strong>Borrowing terms:</strong> {equipment.terms}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Start date
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input type="date" min={today} value={requestedFrom} onChange={(event) => { setRequestedFrom(event.target.value); if (requestedTo < event.target.value) setRequestedTo(event.target.value) }} className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-pink-950" />
              </div>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Return date
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input type="date" min={requestedFrom || today} value={requestedTo} onChange={(event) => setRequestedTo(event.target.value)} className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-pink-950" />
              </div>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            Notes <span className="font-normal text-zinc-500">(optional)</span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Course, project, or pickup details" className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-pink-950" />
          </label>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
          <button type="button" onClick={submit} disabled={isPending} className="h-11 flex-[2] rounded-lg bg-pink-700 px-4 text-sm font-semibold text-white hover:bg-pink-800 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? 'Sending...' : 'Send request'}</button>
        </div>
      </div>
    </div>
  )
}
