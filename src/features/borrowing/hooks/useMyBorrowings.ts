import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMyBorrowings() {
  const { user, profile } = useAuth()
  return useQuery({
    queryKey: ['borrowings', 'mine', user?.id],
    enabled: !!user && !!profile,
    queryFn: async () => {
      if (!user || !profile) return []
      let query = supabase.from('borrowing_requests').select('*').order('requested_at', { ascending: false })
      if (profile.role !== 'Admin') query = query.eq('borrower_id', user.id)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
