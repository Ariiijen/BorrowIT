import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMyEquipment() {
  const { user, profile } = useAuth()
  return useQuery({
    queryKey: ['equipment', 'mine', user?.id],
    enabled: !!user && !!profile && (profile.role === 'Lender' || profile.role === 'Admin'),
    queryFn: async () => {
      if (!user || !profile) return []
      let query = supabase.from('equipment').select('*').order('created_at', { ascending: false })
      if (profile.role !== 'Admin') query = query.eq('owner_id', user.id)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
