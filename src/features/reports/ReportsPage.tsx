import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { supabase } from '@/lib/supabase'

export function ReportsPage() {
  const queryClient = useQueryClient()
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  const report = useQuery({
    queryKey: ['admin', 'reports', from, to],
    queryFn: async () => {
      const end = `${to}T23:59:59.999Z`
      const start = `${from}T00:00:00.000Z`
      const [equipmentResult, lendingResult, overdueResult, profilesResult, requestsResult] = await Promise.all([
        supabase.from('equipment').select('id,name,category,total_stock,available_stock,status,review_status'),
        supabase.from('lending').select('equipment_id,borrower_id,created_at,status').gte('created_at', start).lte('created_at', end),
        supabase.from('borrowing_requests').select('equipment_id,borrower_id,end_date,status,returned_at').eq('status', 'Borrowed').lt('end_date', new Date().toISOString().slice(0, 10)),
        supabase.from('profiles').select('id,full_name,is_restricted,restriction_until,late_return_count'),
        supabase.from('borrowing_requests').select('id,equipment_id,borrower_id,status,start_date,end_date,requested_at').gte('requested_at', start).lte('requested_at', end),
      ])
      for (const result of [equipmentResult, lendingResult, overdueResult, profilesResult, requestsResult]) {
        if (result.error) throw result.error
      }

      const equipment = equipmentResult.data ?? []
      const lending = lendingResult.data ?? []
      const overdue = overdueResult.data ?? []
      const profiles = profilesResult.data ?? []
      const requests = requestsResult.data ?? []
      const names = new Map(equipment.map((item) => [item.id, item.name]))
      const borrowers = new Map(profiles.map((item) => [item.id, item.full_name || item.id]))
      const counts = new Map<string, number>()
      for (const row of lending) counts.set(row.equipment_id, (counts.get(row.equipment_id) ?? 0) + 1)

      const mostRented = [...counts.entries()]
        .map(([id, count]) => ({ id, name: names.get(id) ?? id, count }))
        .sort((a, b) => b.count - a.count)
      const borrowerCounts = new Map<string, number>()
      for (const row of lending) borrowerCounts.set(row.borrower_id, (borrowerCounts.get(row.borrower_id) ?? 0) + 1)
      const frequentBorrowers = [...borrowerCounts.entries()]
        .map(([id, count]) => ({ id, name: borrowers.get(id) ?? id, count }))
        .sort((a, b) => b.count - a.count)

      const totalStock = equipment.reduce((sum, item) => sum + (item.total_stock ?? 0), 0)
      const availableStock = equipment.reduce((sum, item) => sum + (item.available_stock ?? 0), 0)
      const utilization = totalStock ? Math.round(((totalStock - availableStock) / totalStock) * 100) : 0
      const restrictedUsers = profiles.filter((item) => item.is_restricted).length

      return { equipment, lending, overdue, profiles, requests, mostRented, frequentBorrowers, totalStock, utilization, restrictedUsers }
    },
  })

  const processOverdue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('process_overdue_rentals')
      if (error) throw error
      return data as number
    },
    onSuccess: (count) => {
      toast.success(`${count} overdue rental(s) processed.`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function exportCsv() {
    const rows = [
      ['equipment', 'category', 'total_stock', 'available_stock', 'rental_count'],
      ...(report.data?.equipment.map((item) => [
        item.name,
        item.category,
        String(item.total_stock ?? 0),
        String(item.available_stock ?? 0),
        String(report.data?.lending.filter((row) => row.equipment_id === item.id).length ?? 0),
      ]) ?? []),
    ]
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `borrowit-report-${from}-to-${to}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Reports" description="Review equipment demand, utilization, overdue rentals, and account restrictions." />
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-3">
          <label className="block text-sm"><span className="mb-1 block font-medium">From</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-950" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium">To</span><input type="date" value={to} min={from} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-950" /></label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void processOverdue.mutateAsync().catch(() => undefined)} disabled={processOverdue.isPending} className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium"><RefreshCw size={15} className={processOverdue.isPending ? 'animate-spin' : ''} />Process overdue</button>
          <button type="button" onClick={exportCsv} disabled={!report.data} className="flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"><Download size={15} />Export CSV</button>
        </div>
      </div>

      {report.error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{report.error.message}</p>}
      {report.isLoading ? <p className="text-sm text-zinc-500">Generating reports...</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Rental requests', report.data?.requests.length ?? 0],
              ['Overdue rentals', report.data?.overdue.length ?? 0],
              ['Inventory utilization', `${report.data?.utilization ?? 0}%`],
              ['Restricted users', report.data?.restrictedUsers ?? 0],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Overdue items</h2>
              <p className="mt-1 text-sm text-zinc-500">{report.data?.overdue.length ?? 0} currently overdue rental(s)</p>
              <div className="mt-4 space-y-2">{report.data?.overdue.map((item, index) => <div key={`${item.equipment_id}-${index}`} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300"><span className="font-medium">{report.data?.equipment.find((row) => row.id === item.equipment_id)?.name ?? item.equipment_id}</span><span className="ml-2 opacity-70">due {item.end_date}</span></div>)}</div>
            </section>
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Most-rented items</h2>
              <div className="mt-4 space-y-2">{report.data?.mostRented.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950"><span><span className="mr-2 text-zinc-400">#{index + 1}</span>{item.name}</span><strong>{item.count}</strong></div>)}</div>
            </section>
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Frequent borrowers</h2>
              <div className="mt-4 space-y-2">{report.data?.frequentBorrowers.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950"><span><span className="mr-2 text-zinc-400">#{index + 1}</span>{item.name}</span><strong>{item.count}</strong></div>)}</div>
            </section>
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Account restrictions</h2>
              <div className="mt-4 space-y-2">{report.data?.profiles.filter((item) => item.is_restricted).map((item) => <div key={item.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30"><span className="font-medium">{item.full_name || item.id}</span><span className="ml-2 text-xs text-zinc-500">{item.late_return_count} late return(s)</span></div>)}</div>
              {!report.data?.restrictedUsers && <p className="mt-4 text-sm text-zinc-500">No restricted accounts.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
