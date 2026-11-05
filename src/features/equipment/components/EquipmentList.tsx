import { ImageOff, PackageSearch, UserRound } from 'lucide-react'

import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Database } from '@/types/database'

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  owner_name?: string | null
}

export function EquipmentList({
  equipment,
  searchTerm = '',
  isLoading = false,
  error = null,
  onBorrow,
}: {
  equipment?: Equipment[]
  searchTerm?: string
  isLoading?: boolean
  error?: Error | null
  onBorrow?: (equipmentId: string) => void
}) {
  const filteredEquipment = equipment?.filter((item) =>
    `${item.name} ${item.category} ${item.description ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading equipment">
        {[0, 1, 2].map((row) => <div key={row} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><Skeleton className="h-5 w-40" /><Skeleton className="mt-3 h-3 w-24" /><Skeleton className="mt-5 h-3 w-full max-w-md" /></div>)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load equipment: {error.message}
      </div>
    )
  }

  if (!equipment || equipment.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        <PackageSearch className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        No equipment available yet.
      </div>
    )
  }

  if (!filteredEquipment?.length) {
    return <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">No equipment matches that search.</div>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredEquipment.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
                <ImageOff size={28} />
                <span className="text-xs">No photo provided</span>
              </div>
            )}
          </div>
          <div className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{item.category}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                <UserRound size={13} />
                {item.owner_name || (item.owner_type === 'School' ? 'USTP Equipment Office' : 'Campus member')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              <StatusBadge status={item.condition} neutral />
              {item.status === 'Available' && item.review_status === 'Approved' && item.available_stock > 0 && onBorrow && (
                <button
                  type="button"
                  onClick={() => onBorrow(item.id)}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-pink-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-pink-800"
                >
                  Borrow
                </button>
              )}
            </div>
          </div>

          {item.description && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
          )}
          <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {item.available_stock}/{item.total_stock} units available
          </p>
          {item.terms && (
            <p className="mt-2 text-xs text-zinc-500"><span className="font-semibold">Terms:</span> {item.terms}</p>
          )}
          </div>
        </div>
      ))}
    </div>
  )
}
