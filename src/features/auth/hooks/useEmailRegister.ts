import { useMutation } from '@tanstack/react-query'
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'

import { friendlyAuthError, savePendingProfile } from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
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

        // The profile row is created at first login (see useEmailLogin).
        savePendingProfile(user.uid, {
          email: input.email,
          fullName: input.fullName,
          role: input.role === 'Admin' ? 'Borrower' : input.role,
          studentNumber: input.studentNumber ?? null,
          employeeNumber: input.employeeNumber ?? null,
        })

        await signOut(auth)
        return { user }
      } catch (error) {
        throw friendlyAuthError(error)
      }
    },
  })
}