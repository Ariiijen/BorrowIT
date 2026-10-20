import { useState } from 'react'
import { BadgeCheck, Box, Search, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { RoleGuard } from '@/components/shared/RoleGuard'
import { AddEquipmentForm } from '@/features/equipment/components/AddEquipmentForm'
import { EquipmentList } from '@/features/equipment/components/EquipmentList'
import { useCreateBorrowRequest } from '@/features/borrowing/hooks/useCreateBorrowRequest'
import { useEquipment } from '@/features/equipment/hooks/useEquipment'
import { useAuth } from '@/features/auth/hooks/useAuth'

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const today = new Date().toISOString().slice(0, 10)

export function EquipmentPage() {
  const { user } = useAuth()
  const { data: equipment = [], isLoading, error } = useEquipment()
  const { mutate, isPending } = useCreateBorrowRequest()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [requestedFrom, setRequestedFrom] = useState(today)
  const [requestedTo, setRequestedTo] = useState(tomorrow)
  const [notes, setNotes] = useState('')
  const available = equipment.filter((item) => item.status === 'Available' && item.owner_id !== user?.id)
  const borrowedCount = equipment.filter((item) => item.status === 'Borrowed').length
  const unavailableCount = equipment.filter((item) => item.status === 'Unavailable').length

  function handleBorrowRequest() {
    if (!selectedEquipmentId) {
      toast.error('Choose an equipment item first.')
      return
    }
    if (!requestedFrom || !requestedTo || requestedTo < requestedFrom) {
      toast.error('Choose a return date on or after the start date.')
      return
    }
    mutate({ equipment_id: selectedEquipmentId, requested_from: requestedFrom, requested_to: requestedTo, notes }, {
      onSuccess: () => {
        toast.success('Borrow request created. The equipment owner can review it now.')
        setSelectedEquipmentId('')
        setRequestedFrom(today)
        setRequestedTo(tomorrow)
        setNotes('')
      },
      onError: (mutationError: Error) => toast.error(mutationError.message || 'Unable to create borrow request.'),
    })
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Campus inventory</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Equipment catalog</h1><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Browse available gear and send a dated request to its owner.</p></div>
        <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Search equipment</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search equipment" className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ title: 'Available', value: isLoading ? '—' : equipment.filter((item) => item.status === 'Available').length, icon: Box, color: 'text-emerald-700 dark:text-emerald-400' }, { title: 'Borrowed', value: isLoading ? '—' : borrowedCount, icon: BadgeCheck, color: 'text-zinc-600 dark:text-zinc-300' }, { title: 'Unavailable', value: isLoading ? '—' : unavailableCount, icon: ShieldAlert, color: 'text-amber-700 dark:text-amber-400' }].map(({ title, value, icon: Icon, color }) => <div key={title} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><span className="text-sm text-zinc-600 dark:text-zinc-400">{title}</span><Icon className={color} size={18} /></div><p className="mt-3 text-3xl font-semibold">{value}</p></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between"><h2 className="font-semibold">Browse equipment</h2><span className="text-xs text-zinc-500">{equipment.length} item(s)</span></div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Failed to load equipment: {error.message}</p>}
          <EquipmentList searchTerm={searchTerm} />
        </section>
        <div className="space-y-5">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold">Create a borrow request</h2>
            <div className="mt-4 space-y-4">
              <label className="block space-y-1.5"><span className="text-sm font-medium">Equipment</span><select value={selectedEquipmentId} onChange={(event) => setSelectedEquipmentId(event.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"><option value="">Select available equipment</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><label className="block space-y-1.5"><span className="text-sm font-medium">Start date</span><input type="date" min={today} value={requestedFrom} onChange={(event) => { setRequestedFrom(event.target.value); if (requestedTo < event.target.value) setRequestedTo(event.target.value) }} className="h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="block space-y-1.5"><span className="text-sm font-medium">Return date</span><input type="date" min={requestedFrom || today} value={requestedTo} onChange={(event) => setRequestedTo(event.target.value)} className="h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950" /></label></div>
              <label className="block space-y-1.5"><span className="text-sm font-medium">Notes <span className="font-normal text-zinc-500">(optional)</span></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Course, project, or pickup details" className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950" /></label>
              <button type="button" onClick={handleBorrowRequest} disabled={isPending || available.length === 0} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? 'Submitting...' : 'Send borrow request'}</button>
              {available.length === 0 && <p className="text-xs text-zinc-500">No other available items can be requested right now.</p>}
            </div>
          </section>
          <RoleGuard allow={['Lender', 'Admin']}><AddEquipmentForm /></RoleGuard>
        </div>
      </div>
    </div>
  )
}
