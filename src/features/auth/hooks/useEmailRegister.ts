import { useMutation } from '@tanstack/react-query'
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'

import {
  clearPendingProfile,
  friendlyAuthError,
  savePendingProfile,
} from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export type EmailRegistration = {
  fullName: string
  email: string
  password: string
  role: UserRole
  studentNumber?: string
  employeeNumber?: string
}

export function useEmailRegister() {
  return useMutation({
    mutationFn: async (input: EmailRegistration) => {
      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          input.email,
          input.password,
        )
        await updateProfile(user, { displayName: input.fullName })

        savePendingProfile(user.uid, {
          email: input.email,
          fullName: input.fullName,
          role: input.role === 'Admin' ? 'Borrower' : input.role,
          studentNumber: input.studentNumber ?? null,
          employeeNumber: input.employeeNumber ?? null,
        })

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.uid,
            email: input.email.trim().toLowerCase(),
            full_name: input.fullName.trim(),
            role: input.role === 'Admin' ? 'Borrower' : input.role,
            student_number: input.studentNumber?.trim() || null,
            employee_number: input.employeeNumber?.trim() || null,
            is_activated: false,
            activation_status: 'Pending',
          })

        if (profileError) throw profileError

        clearPendingProfile(user.uid)
        await signOut(auth)
        return { user }
      } catch (error) {
        throw friendlyAuthError(error)
      }
    },
  })
}