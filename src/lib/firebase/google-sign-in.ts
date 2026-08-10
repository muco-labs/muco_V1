import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirebaseApp } from '@/lib/firebase/client'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Google sign-in via Firebase Auth popup, then Supabase session via Google ID token
 * (keeps existing API JWT validation and user provisioning).
 */
export async function signInWithGoogleFirebase(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Authentication is not configured.')
  }

  const auth = getAuth(getFirebaseApp())
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  const credential = GoogleAuthProvider.credentialFromResult(result)
  const idToken = credential?.idToken
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.')
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })
  if (error) throw error
}
