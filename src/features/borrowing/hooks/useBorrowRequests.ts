import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useBorrowRequests() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['borrowings', 'visible', user?.id, profile?.role],
    enabled: !!user && !!profile,
    queryFn: async () => {
      if (!user || !profile) return []
      let requests
      if (profile.role === 'Lender') {
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipment')
          .select('id')
          .eq('owner_id', user.id)
        if (equipmentError) throw equipmentError
        const equipmentIds = (equipment ?? []).map((item) => item.id)
        if (!equipmentIds.length) return []
        const { data, error } = await supabase
          .from('borrowing_requests')
          .select('*')
          .in('equipment_id', equipmentIds)
          .order('requested_at', { ascending: false })
        if (error) throw error
        requests = data
      } else {
        let query = supabase.from('borrowing_requests').select('*').order('requested_at', { ascending: false })
        if (profile.role !== 'Admin') query = query.eq('borrower_id', user.id)
        const { data, error } = await query
        if (error) throw error
        requests = data
      }

      const requestRows = requests ?? []
      const equipmentIds = [...new Set(requestRows.map((request) => request.equipment_id))]
      const profileIds = [...new Set(requestRows.map((request) => request.borrower_id))]
      const [equipmentResult, profilesResult] = await Promise.all([
        equipmentIds.length
          ? supabase.from('equipment').select('id, name, owner_id').in('id', equipmentIds)
          : Promise.resolve({ data: [], error: null }),
        profileIds.length
          ? supabase.from('profiles').select('id, full_name').in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (equipmentResult.error) throw equipmentResult.error
      if (profilesResult.error) throw profilesResult.error
      const equipmentNames = new Map((equipmentResult.data ?? []).map((item) => [item.id, item.name]))
      const equipmentOwners = new Map((equipmentResult.data ?? []).map((item) => [item.id, item.owner_id]))
      const borrowerNames = new Map((profilesResult.data ?? []).map((profileRow) => [profileRow.id, profileRow.full_name]))
      return requestRows.map((request) => ({
        ...request,
        equipment_name: equipmentNames.get(request.equipment_id) ?? request.equipment_id,
        equipment_owner_id: equipmentOwners.get(request.equipment_id) ?? request.lender_id ?? null,
        borrower_name: borrowerNames.get(request.borrower_id) ?? request.borrower_id,
      }))
    },
  })

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`rental-updates-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrowing_requests' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['borrowings'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [queryClient, user])

  return query
}
