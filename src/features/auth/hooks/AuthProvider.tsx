import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'

import {
  clearPendingProfile,
  friendlyAuthError,
  readPendingProfile,
  savePendingProfile,
} from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import { AuthContext, type Profile, type SessionUser } from './authContext'

async function readOrCreateProfile(user: SessionUser): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  const pending = readPendingProfile(user.id)
  const role: UserRole =
    pending?.role === 'Lender' || pending?.role === 'Faculty' ? pending.role : 'Borrower'

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: pending?.email ?? user.email ?? '',
      full_name: pending?.fullName ?? user.displayName ?? user.email ?? '',
      role,
      student_number: pending?.studentNumber ?? null,
      employee_number: pending?.employeeNumber ?? null,
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

  clearPendingProfile(user.id)
  return created
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const previousRole = useRef<UserRole | null>(null)
  const activeUserId = useRef<string | null>(null)

  // Firebase fires this once on load with the saved session, then on every change.
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!active) return
      const nextUser: SessionUser | null = fbUser
        ? { id: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName }
        : null
      const nextUserId = nextUser?.id ?? null

      if (activeUserId.current !== nextUserId) {
        activeUserId.current = nextUserId
        setIsLoading(!!nextUser)
        setProfile(null)
        previousRole.current = null
        queryClient.clear()
      }
      setUser(nextUser)
      if (!nextUser) setIsLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [queryClient])

  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }
    const currentUser = user

    async function refreshProfile() {
      try {
        const nextProfile = await readOrCreateProfile(currentUser)
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
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw friendlyAuthError(error)
    }
  }

  async function signUp(input: {
    email: string
    password: string
    fullName: string
    role: UserRole
    studentNumber?: string
    employeeNumber?: string
  }) {
    try {
      const { user: created } = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password,
      )
      await updateProfile(created, { displayName: input.fullName })
      savePendingProfile(created.uid, {
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        studentNumber: input.studentNumber ?? null,
        employeeNumber: input.employeeNumber ?? null,
      })
      // The account must be activated by the admin before it can be used.
      await firebaseSignOut(auth)
    } catch (error) {
      throw friendlyAuthError(error)
    }
  }

  async function signOut() {
    queryClient.clear()
    await firebaseSignOut(auth)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAuthenticated: !!user, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}