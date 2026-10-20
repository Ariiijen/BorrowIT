import { useMutation } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard`, scopes: 'openid email profile' },
      })
      if (error) throw error
    },
  })
}
