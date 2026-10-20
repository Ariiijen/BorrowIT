import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useBorrowRequests() {
  const { user, profile } = useAuth()
  return useQuery({
    queryKey: ['borrowings', 'visible', user?.id, profile?.role],
    enabled: !!user && !!profile,
    queryFn: async () => {
      if (!user || !profile) return []
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
        return data
      }

      let query = supabase.from('borrowing_requests').select('*').order('requested_at', { ascending: false })
      if (profile.role !== 'Admin') query = query.eq('borrower_id', user.id)
      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    },
  })
}
