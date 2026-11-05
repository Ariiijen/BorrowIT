import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'

export function ReportsPage() {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const report = useQuery({
    queryKey: ['admin', 'reports', from, to],
    queryFn: async () => {
      const end = `${to}T23:59:59.999Z`
      const start = `${from}T00:00:00.000Z`
      const [equipmentResult, lendingResult, overdueResult] = await Promise.all([
        supabase.from('equipment').select('id,name'),
        supabase.from('lending').select('equipment_id,created_at').gte('created_at', start).lte('created_at', end),
        supabase.from('borrowing_requests').select('equipment_id,borrower_id,end_date,status,returned_at').eq('status', 'Borrowed').lt('end_date', new Date().toISOString().slice(0, 10)),
      ])
      for (const result of [equipmentResult, lendingResult, overdueResult]) if (result.error) throw result.error
      const counts = new Map<string, number>()
      for (const row of lendingResult.data ?? []) counts.set(row.equipment_id, (counts.get(row.equipment_id) ?? 0) + 1)
      const names = new Map((equipmentResult.data ?? []).map((item) => [item.id, item.name]))
      const mostRented = [...counts.entries()].map(([id, count]) => ({ id, name: names.get(id) ?? id, count })).sort((a, b) => b.count - a.count)
      return { overdue: overdueResult.data ?? [], mostRented }
    },
  })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Reports" description="Review overdue rentals and item demand for a selected date range." />
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm"><span className="mb-1 block font-medium">From</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-950" /></label>
        <label className="block text-sm"><span className="mb-1 block font-medium">To</span><input type="date" value={to} min={from} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-950" /></label>
      </div>
      {report.error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{report.error.message}</p>}
      {report.isLoading ? <p className="text-sm text-zinc-500">Generating reports...</p> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold">Overdue items</h2>
            <p className="mt-1 text-sm text-zinc-500">{report.data?.overdue.length ?? 0} currently overdue rental(s)</p>
            <div className="mt-4 space-y-2">{report.data?.overdue.map((item, index) => <div key={`${item.equipment_id}-${index}`} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950"><span className="font-medium">{item.equipment_id}</span><span className="ml-2 text-zinc-500">due {item.end_date}</span></div>)}</div>
          </section>
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold">Most-rented items</h2>
            <div className="mt-4 space-y-2">{report.data?.mostRented.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950"><span><span className="mr-2 text-zinc-400">#{index + 1}</span>{item.name}</span><strong>{item.count}</strong></div>)}</div>
          </section>
        </div>
      )}
    </div>
  )
}
