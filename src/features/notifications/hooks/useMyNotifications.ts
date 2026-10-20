import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMyNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['notifications', 'mine', user?.id] as const

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        void queryClient.invalidateQueries({ queryKey: ['notifications', 'mine', user.id] })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [queryClient, user?.id])

  return useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
