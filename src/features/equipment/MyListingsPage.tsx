import { ImageOff, PackagePlus } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { AddEquipmentForm } from '@/features/equipment/components/AddEquipmentForm'
import { useMyEquipment } from '@/features/equipment/hooks/useMyEquipment'
import { Skeleton } from '@/components/ui/Skeleton'

export function MyListingsPage() {
  const { data: listings = [], isLoading, error } = useMyEquipment()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Lender workspace"
        title="My listings"
        description="Post equipment and track its admin review and availability."
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><PackagePlus size={18} />Post new equipment</h2>
          <AddEquipmentForm />
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Your equipment</h2>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((item) => <Skeleton key={item} className="h-64 w-full" />)}</div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">You have not posted any equipment yet.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="aspect-[16/7] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400"><ImageOff size={28} /></div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-1 text-xs text-zinc-500">{item.category} · {item.condition}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.review_status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.review_status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>{item.review_status}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                    <p className="mt-3 text-sm font-medium">{item.available_stock}/{item.total_stock} units available</p>
                    {item.review_status === 'Rejected' && item.rejection_reason && (
                      <p className="mt-2 text-xs text-red-600">Reason: {item.rejection_reason}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
