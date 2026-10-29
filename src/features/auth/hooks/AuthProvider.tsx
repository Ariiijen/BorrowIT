import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import { AuthContext, type Profile } from './authContext'

async function readOrCreateProfile(user: User): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  const metadataRole = user.user_metadata?.role
  const role: UserRole = metadataRole === 'Lender' || metadataRole === 'Faculty' ? metadataRole : 'Borrower'
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email ?? '',
      role,
      student_number: user.user_metadata?.student_number ?? null,
      employee_number: user.user_metadata?.employee_number ?? null,
    })
    .select('*')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: racedProfile, error: reloadError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (reloadError) throw reloadError
      return racedProfile
    }
    throw insertError
  }
  return created
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const previousRole = useRef<UserRole | null>(null)
  const activeUserId = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!active) return
      const nextUser = session?.user ?? null
      const nextUserId = nextUser?.id ?? null
      if (activeUserId.current !== nextUserId) {
        activeUserId.current = nextUserId
        setIsLoading(!!nextUser)
        setProfile(null)
        previousRole.current = null
        queryClient.clear()
      }
      setUser(nextUser)
      if (!nextUser) {
        setIsLoading(false)
      }
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('Unable to read auth session:', error.message)
      const sessionUser = data.session?.user ?? null
      activeUserId.current = sessionUser?.id ?? null
      setUser(sessionUser)
      setIsLoading(!!sessionUser)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }

    async function refreshProfile() {
      try {
        const nextProfile = await readOrCreateProfile(user)
        if (!active) return
        if (previousRole.current && previousRole.current !== nextProfile.role) queryClient.clear()
        previousRole.current = nextProfile.role
        setProfile(nextProfile)
        setIsLoading(false)
      } catch (error) {
        if (!active) return
        console.error('Unable to load profile:', error)
        setProfile(null)
        setIsLoading(false)
      }
    }

    void refreshProfile()
    window.addEventListener('focus', refreshProfile)

    return () => {
      active = false
      window.removeEventListener('focus', refreshProfile)
    }
  }, [user, queryClient])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(input: {
    email: string
    password: string
    fullName: string
    role: UserRole
    studentNumber?: string
    employeeNumber?: string
  }) {
    const { error } = await supabase.auth.signUp({
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
  }

  async function signOut() {
    queryClient.clear()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
