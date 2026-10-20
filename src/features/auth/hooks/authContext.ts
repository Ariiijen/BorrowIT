import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'
import type { Database } from '@/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    email: string
    password: string
    fullName: string
    role: UserRole
    studentNumber?: string
    employeeNumber?: string
  }) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
