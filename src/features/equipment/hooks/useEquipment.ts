import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useEquipment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['equipment', 'catalog', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const equipmentRows = data ?? []
      const ownerIds = [...new Set(equipmentRows.map((item) => item.owner_id))]
      const { data: owners, error: ownersError } = ownerIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
        : { data: [], error: null }
      if (ownersError) throw ownersError
      const ownerNames = new Map((owners ?? []).map((owner) => [owner.id, owner.full_name]))

      return equipmentRows.map((item) => ({
        ...item,
        owner_name: ownerNames.get(item.owner_id) ?? null,
      }))
    },
  })

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`equipment-updates-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['equipment'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [queryClient, user])

  return query
}
