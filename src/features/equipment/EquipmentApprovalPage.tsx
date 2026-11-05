import { useState } from 'react'
import { CheckCircle2, ImageOff, Package, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { PageHeader } from '@/components/shared/PageHeader'
import { useEquipment } from '@/features/equipment/hooks/useEquipment'
import { supabase } from '@/lib/supabase'

export function EquipmentApprovalPage() {
  const { data: equipment = [], isLoading, error } = useEquipment()
  const [reviewStock, setReviewStock] = useState<Record<string, number>>({})
  const queryClient = useQueryClient()
  const pending = equipment.filter((item) => item.review_status === 'Pending')
  const approved = equipment.filter((item) => item.review_status === 'Approved')

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['equipment'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin inventory"
        title="Equipment approvals"
        description="Review lender submissions and manage stock for approved equipment."
      />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Pending submissions</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">{pending.length} pending</span>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />)}</div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">There are no equipment submissions waiting for review.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="aspect-[16/8] bg-zinc-100 dark:bg-zinc-800">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-400"><ImageOff /></div>}
                </div>
                <div className="space-y-3 p-5">
                  <div><h3 className="text-lg font-semibold">{item.name}</h3><p className="text-xs text-zinc-500">{item.category} · {item.condition}</p></div>
                  {item.description && <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>}
                  <div className="grid gap-2 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-2"><span><strong>Terms:</strong> {item.terms || 'Not provided'}</span><span><strong>Usage:</strong> {item.usage_instructions || 'Not provided'}</span></div>
                  <label className="block text-xs font-semibold">Units to approve
                    <input type="number" min={1} value={reviewStock[item.id] ?? item.total_stock ?? 1} onChange={(event) => setReviewStock((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
                  </label>
                  <div className="flex gap-2">
                    <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800" onClick={async () => {
                      const units = reviewStock[item.id] ?? item.total_stock ?? 1
                      if (!Number.isInteger(units) || units < 1) return toast.error('Enter at least one unit')
                      const { error } = await supabase.rpc('review_equipment', { p_equipment_id: item.id, p_approved: true, p_total_stock: units })
                      if (error) toast.error(error.message)
                      else { toast.success(`${item.name} approved`); await refresh() }
                    }}><CheckCircle2 size={16} />Approve</button>
                    <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={async () => {
                      const reason = window.prompt('Reason for rejection')?.trim()
                      const { error } = await supabase.rpc('review_equipment', { p_equipment_id: item.id, p_approved: false, p_reason: reason || null })
                      if (error) toast.error(error.message)
                      else { toast.success(`${item.name} rejected`); await refresh() }
                    }}><XCircle size={16} />Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Approved equipment and stock</h2>
        {approved.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">No approved equipment yet.</div> : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {approved.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">{item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="m-auto mt-3 text-zinc-400" size={20} />}</div>
                  <div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="text-xs text-zinc-500">{item.category}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{item.available_stock}/{item.total_stock} available</span>
                  <button type="button" className="h-9 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800" onClick={async () => {
                    const value = window.prompt('Set total stock units', String(item.total_stock))
                    if (value === null || value.trim() === '') return
                    const stock = Number(value)
                    if (!Number.isInteger(stock) || stock < 0) return toast.error('Enter a valid stock number')
                    const { error } = await supabase.rpc('set_equipment_stock', { p_equipment_id: item.id, p_total_stock: stock })
                    if (error) toast.error(error.message)
                    else { toast.success(`Stock updated for ${item.name}`); await refresh() }
                  }}>Set stock</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
