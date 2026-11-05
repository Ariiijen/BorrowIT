import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useRentalActions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['borrowings'] })
    void queryClient.invalidateQueries({ queryKey: ['lendings'] })
    void queryClient.invalidateQueries({ queryKey: ['equipment'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const approve = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('approve_borrowing_request', { p_request_id: requestId })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const reject = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { error } = await supabase.rpc('reject_borrowing_request', { p_request_id: requestId, p_reason: reason })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const cancel = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { error } = await supabase.rpc('cancel_accepted_request', { p_request_id: requestId, p_reason: reason })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const pickedUp = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('mark_request_picked_up', { p_request_id: requestId })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const recordReturn = useMutation({
    mutationFn: async ({ requestId, condition, notes }: { requestId: string; condition: 'New' | 'Good' | 'Fair' | 'Damaged'; notes?: string }) => {
      const { error } = await supabase.rpc('record_lender_return', { p_request_id: requestId, p_condition: condition, p_notes: notes })
      if (error) throw error
    },
    onSuccess: refresh,
  })

  return { approve, reject, cancel, pickedUp, recordReturn, user }
}
