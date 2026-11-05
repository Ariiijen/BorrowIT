import { useState } from 'react'
import { BadgeCheck, Box, Search, ShieldAlert } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { EquipmentList } from '@/features/equipment/components/EquipmentList'
import { BorrowRequestModal } from '@/features/equipment/components/BorrowRequestModal'
import { useEquipment } from '@/features/equipment/hooks/useEquipment'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function EquipmentPage() {
  const { user } = useAuth()
  const { data: equipment = [], isLoading, error } = useEquipment()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<(typeof equipment)[number] | null>(null)
  const borrowedCount = equipment.filter((item) => item.status === 'Borrowed').length
  const unavailableCount = equipment.filter((item) => item.status === 'Unavailable').length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campus inventory"
        title="Equipment catalog"
        description="Browse available gear and send a dated request to its owner."
        actions={<label className="relative block w-full sm:w-72"><span className="sr-only">Search equipment</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search equipment" className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950" /></label>}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ title: 'Available', value: isLoading ? '—' : equipment.filter((item) => item.status === 'Available').length, icon: Box, color: 'text-emerald-700 dark:text-emerald-400' }, { title: 'Borrowed', value: isLoading ? '—' : borrowedCount, icon: BadgeCheck, color: 'text-blue-700 dark:text-blue-400' }, { title: 'Unavailable', value: isLoading ? '—' : unavailableCount, icon: ShieldAlert, color: 'text-zinc-500 dark:text-zinc-400' }].map(({ title, value, icon: Icon, color }) => <div key={title} className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"><div className="flex items-center justify-between"><span className="text-sm text-zinc-600 dark:text-zinc-400">{title}</span><Icon className={color} size={18} /></div><p className="mt-3 text-3xl font-semibold">{value}</p></div>)}
      </div>
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Browse equipment</h2>
          <span className="text-xs text-zinc-500">{equipment.length} item(s)</span>
        </div>
        <EquipmentList
          equipment={equipment.filter((item) => item.owner_id !== user?.id && item.review_status === 'Approved')}
          searchTerm={searchTerm}
          isLoading={isLoading}
          error={error instanceof Error ? error : null}
          onBorrow={(equipmentId) => {
            const item = equipment.find((equipmentItem) => equipmentItem.id === equipmentId)
            if (item) setSelectedEquipment(item)
          }}
        />
      </section>
      {selectedEquipment && (
        <BorrowRequestModal equipment={selectedEquipment} onClose={() => setSelectedEquipment(null)} />
      )}
    </div>
  )
}
