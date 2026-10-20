import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMyLendings() {
  const { user, profile } = useAuth()
  return useQuery({
    queryKey: ['lendings', 'mine', user?.id],
    enabled: !!user && !!profile && (profile.role === 'Lender' || profile.role === 'Admin'),
    queryFn: async () => {
      if (!user || !profile) return []
      let query = supabase.from('lending').select('*').order('created_at', { ascending: false })
      if (profile.role !== 'Admin') query = query.eq('lender_id', user.id)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
