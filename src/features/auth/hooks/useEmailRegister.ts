import { useMutation } from '@tanstack/react-query'

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
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            role: 'Borrower',
            student_number: input.studentNumber ?? null,
            employee_number: input.employeeNumber ?? null,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      if (error) throw error
      return data
    },
  })
}
