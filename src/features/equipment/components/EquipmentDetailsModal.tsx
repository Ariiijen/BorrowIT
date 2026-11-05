import { useEffect } from 'react'
import { BookOpenText, ClipboardCheck, X } from 'lucide-react'

import type { Database } from '@/types/database'

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  owner_name?: string | null
}

export function EquipmentDetailsModal({
  equipment,
  onClose,
}: {
  equipment: Equipment
  onClose: () => void
}) {
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`equipment-details-${equipment.id}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="equipment-details-enter max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-700 dark:text-pink-400">Equipment information</p>
            <h2 id={`equipment-details-${equipment.id}`} className="mt-1 text-lg font-semibold">{equipment.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:hover:bg-zinc-800" aria-label="Close equipment information">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {equipment.image_url && (
            <img src={equipment.image_url} alt={equipment.name} className="aspect-[16/7] w-full rounded-xl object-cover" />
          )}

          {equipment.description && (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{equipment.description}</p>
          )}

          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
              <ClipboardCheck size={18} />
              Borrowing terms
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {equipment.terms || 'No borrowing terms have been added for this equipment.'}
            </p>
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/70 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
              <BookOpenText size={18} />
              Usage instructions
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {equipment.usage_instructions || 'Follow the manufacturer and lender instructions while using this equipment.'}
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-zinc-200 bg-white/95 p-5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          <button type="button" onClick={onClose} className="h-11 w-full rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
