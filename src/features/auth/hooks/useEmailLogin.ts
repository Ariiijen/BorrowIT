import { useMutation } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export function useEmailLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      if (error) throw error
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profileError) throw profileError
      return { user: data.user, role: (profile?.role ?? 'Borrower') as Database['public']['Tables']['profiles']['Row']['role'] }
    },
  })
}
