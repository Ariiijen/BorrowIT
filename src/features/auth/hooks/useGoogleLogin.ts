import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

import { friendlyAuthError } from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Role = Database['public']['Tables']['profiles']['Row']['role']

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async () => {
      try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })

        const { user } = await signInWithPopup(auth, provider)

        // Force a fresh token so it includes the "authenticated" role claim.
        const token = await user.getIdTokenResult(true)
        if (token.claims.role !== 'authenticated') {
          await signOut(auth)
          throw new Error(
            'Your account is not activated yet. Please ask the admin to activate it, then log in again.',
          )
        }

        const { data: existing, error: selectError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.uid)
          .maybeSingle()
        if (selectError) throw selectError

        let role = existing?.role as Role | undefined

        // First login: create a Borrower profile from the Google account.
        if (!existing) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.uid,
            email: user.email ?? '',
            full_name: user.displayName ?? user.email ?? '',
            role: 'Borrower',
            student_number: null,
            employee_number: null,
          })
          if (insertError) throw insertError
          role = 'Borrower'
        }

        return { user, role: (role ?? 'Borrower') as Role }
      } catch (error) {
        if (
          error instanceof FirebaseError &&
          (error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request')
        ) {
             throw new Error('Google sign-in was cancelled.', { cause: error })
        }
        if (error instanceof FirebaseError && error.code === 'auth/popup-blocked') {
             throw new Error('Your browser blocked the Google popup. Allow popups and try again.', {
     cause: error,
   })
        }
        throw friendlyAuthError(error)
      }
    },
  })
}