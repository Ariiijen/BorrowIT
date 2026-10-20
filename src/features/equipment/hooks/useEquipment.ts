import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useEquipment() {
  const { user } = useAuth()
  return useQuery({
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

      return data
    },
  })
}
