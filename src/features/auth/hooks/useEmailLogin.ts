import { useMutation } from '@tanstack/react-query'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import {
  clearPendingProfile,
  friendlyAuthError,
  readPendingProfile,
} from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Role = Database['public']['Tables']['profiles']['Row']['role']

export function useEmailLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      try {
        const { user } = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password,
        )

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

        // First login: create the profile saved at registration.
        if (!existing) {
          const pending = readPendingProfile(user.uid)
          const newRole: Role =
            pending?.role && pending.role !== 'Admin' ? pending.role : 'Borrower'

          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.uid,
            email: pending?.email ?? user.email ?? credentials.email,
            full_name: pending?.fullName ?? user.displayName ?? user.email,
            role: newRole,
            student_number: pending?.studentNumber ?? null,
            employee_number: pending?.employeeNumber ?? null,
          })
          if (insertError) throw insertError

          clearPendingProfile(user.uid)
          role = newRole
        }

        return { user, role: (role ?? 'Borrower') as Role }
      } catch (error) {
        throw friendlyAuthError(error)
      }
    },
  })
}