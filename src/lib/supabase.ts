import { createClient } from '@supabase/supabase-js'
import { signOut as firebaseSignOut } from 'firebase/auth'

import { auth } from '@/lib/firebase'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  )
}

// Supabase now trusts the Firebase login token.
// Firebase handles sessions, so the old `auth` options are removed.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => (await auth.currentUser?.getIdToken()) ?? null,
})

export async function getCurrentUser() {
  await auth.authStateReady() // wait until Firebase restores the session
  return auth.currentUser // Firebase user, or null if logged out
}

export async function signOut() {
  await firebaseSignOut(auth)
}