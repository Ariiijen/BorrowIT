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
    mutationFn: async (registration?: {
      role?: 'Borrower' | 'Lender' | 'Faculty'
      studentNumber?: string
      employeeNumber?: string
    }) => {
      try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })

        const { user } = await signInWithPopup(auth, provider)

        const { data: existing, error: selectError } = await supabase
          .from('profiles')
          .select('id, role, is_activated, activation_status, rejection_reason')
          .eq('email', user.email ?? '')
          .maybeSingle()
        if (selectError) throw selectError

        if (existing && existing.activation_status === 'Rejected') {
          await signOut(auth)
          throw new Error(existing.rejection_reason || 'Your account registration was rejected.')
        }
        if (existing && !existing.is_activated) {
          await signOut(auth)
          throw new Error('Your account is waiting for admin activation. Please check back later.')
        }

        let role = existing?.role as Role | undefined

        // First login: create a Borrower profile from the Google account.
        if (!existing) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.uid,
            email: user.email ?? '',
            full_name: user.displayName ?? user.email ?? '',
            role: registration?.role ?? 'Borrower',
            student_number: registration?.studentNumber?.trim() || null,
            employee_number: registration?.employeeNumber?.trim() || null,
            is_activated: false,
            activation_status: 'Pending',
          })
          if (insertError) throw insertError
          await signOut(auth)
          throw new Error('Your account was created and is waiting for admin activation.')
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