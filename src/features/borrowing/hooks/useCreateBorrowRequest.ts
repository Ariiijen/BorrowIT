import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useCreateBorrowRequest() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: {
      equipment_id: string
      requested_from: string
      requested_to: string
      notes?: string
    }) => {
      if (!user) {
        throw new Error('You must be signed in to request equipment.')
      }

      const { data, error } = await supabase
        .from('borrowing_requests')
        .insert({
          equipment_id: input.equipment_id,
          borrower_id: user.id,
          start_date: input.requested_from,
          end_date: input.requested_to,
          notes: input.notes || '',
          status: 'Pending',
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['borrowings', user?.id] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
  })
}
