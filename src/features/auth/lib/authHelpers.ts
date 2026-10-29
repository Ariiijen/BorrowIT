import { FirebaseError } from 'firebase/app'

import type { UserRole } from '@/types'

export type PendingProfile = {
  email: string
  fullName: string
  role: UserRole
  studentNumber: string | null
  employeeNumber: string | null
}

const pendingKey = (uid: string) => `borrowit:pending-profile:${uid}`

export function savePendingProfile(uid: string, profile: PendingProfile) {
  localStorage.setItem(pendingKey(uid), JSON.stringify(profile))
}

export function readPendingProfile(uid: string): PendingProfile | null {
  try {
    const raw = localStorage.getItem(pendingKey(uid))
    return raw ? (JSON.parse(raw) as PendingProfile) : null
  } catch {
    return null
  }
}

export function clearPendingProfile(uid: string) {
  localStorage.removeItem(pendingKey(uid))
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}

// Turns Firebase's technical errors into messages your pages can show.
export function friendlyAuthError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(MESSAGES[error.code] ?? 'Something went wrong. Please try again.')
  }
  return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
}