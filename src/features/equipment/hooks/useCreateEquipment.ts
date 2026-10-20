import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()

  return useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      category: string
      condition: 'New' | 'Good' | 'Fair' | 'Damaged'
    }) => {
      if (!user) {
        throw new Error('You must be signed in to add equipment.')
      }

      const { data, error } = await supabase
        .from('equipment')
        .insert({
          name: input.name,
          description: input.description,
          category: input.category,
          condition: input.condition,
          status: 'Available',
          owner_type: profile?.role === 'Admin' ? 'School' : 'Student',
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
    },
  })
}
