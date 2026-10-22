import { PackageSearch } from 'lucide-react'

import { useEquipment } from '@/features/equipment/hooks/useEquipment'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function EquipmentList({ searchTerm = '' }: { searchTerm?: string }) {
  const { data: equipment, isLoading, error } = useEquipment()
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
    <div className="space-y-4">
      {filteredEquipment.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{item.category}</p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              <StatusBadge status={item.condition} neutral />
            </div>
          </div>

          {item.description && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
