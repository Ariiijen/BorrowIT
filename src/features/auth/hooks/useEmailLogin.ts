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

        const { data: existing, error: selectError } = await supabase
          .from('profiles')
          .select('id, role, is_activated, activation_status, rejection_reason')
          .eq('id', user.uid)
          .maybeSingle()
        if (selectError) throw selectError

        if (existing && existing.activation_status === 'Rejected') {
          await signOut(auth)
          throw new Error(existing.rejection_reason || 'Your account registration was rejected.')
        }
        if (
          existing &&
          (!existing.is_activated || existing.activation_status !== 'Approved')
        ) {
          await signOut(auth)
          throw new Error('Your account is waiting for admin activation. Please check back later.')
        }

        let role = existing?.role as Role | undefined

        // First login: create the profile saved at registration.
        if (!existing) {
          const pending = readPendingProfile(user.uid)
          const { data: staleProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', (user.email ?? credentials.email).toLowerCase())
            .neq('id', user.uid)
            .maybeSingle()
          if (staleProfile) {
            const { error: replaceError } = await supabase.rpc(
              'replace_stale_profile_on_reregistration',
              {
                p_email: user.email ?? credentials.email,
                p_full_name: pending?.fullName ?? user.displayName ?? user.email ?? '',
                p_role: pending?.role && pending.role !== 'Admin' ? pending.role : 'Borrower',
                p_student_number: pending?.studentNumber ?? null,
                p_employee_number: pending?.employeeNumber ?? null,
              },
            )
            if (replaceError) throw replaceError
            clearPendingProfile(user.uid)
            await signOut(auth)
            throw new Error('Your account was created again and is waiting for admin activation.')
          }
          const newRole: Role =
            pending?.role && pending.role !== 'Admin' ? pending.role : 'Borrower'

          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.uid,
            email: pending?.email ?? user.email ?? credentials.email,
            full_name: pending?.fullName ?? user.displayName ?? user.email,
            role: newRole,
            is_activated: false,
            activation_status: 'Pending',
            student_number: pending?.studentNumber ?? null,
            employee_number: pending?.employeeNumber ?? null,
          })
          if (insertError) throw insertError

          clearPendingProfile(user.uid)
          await signOut(auth)
          throw new Error('Your account was created and is waiting for admin activation.')
        }

        return { user, role: (role ?? 'Borrower') as Role }
      } catch (error) {
        throw friendlyAuthError(error)
      }
    },
  })
}