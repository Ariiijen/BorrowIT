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
  accessToken: async () => {
    const user = auth.currentUser
    if (!user) return null

    const tokenResult = await user.getIdTokenResult(true)
    if (import.meta.env.DEV) {
      console.debug('Firebase token for Supabase:', {
        uid: user.uid,
        issuer: tokenResult.claims.iss,
        audience: tokenResult.claims.aud,
        role: tokenResult.claims.role,
      })
    }

    return tokenResult.token
  },
  global: {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers)
      headers.set('Cache-Control', 'no-cache, no-store, max-age=0')
      headers.set('Pragma', 'no-cache')
      return fetch(input, {
        ...init,
        headers,
        cache: 'no-store',
      })
    },
  },
})

export async function getCurrentUser() {
  await auth.authStateReady() // wait until Firebase restores the session
  return auth.currentUser // Firebase user, or null if logged out
}

export async function signOut() {
  await firebaseSignOut(auth)
}