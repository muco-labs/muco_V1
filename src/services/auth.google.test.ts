import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase/client', () => ({
  isFirebaseGoogleConfigured: vi.fn(),
}))

vi.mock('@/lib/firebase/google-sign-in', () => ({
  signInWithGoogleFirebase: vi.fn(async () => undefined),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(async () => ({ error: null })),
    },
  })),
}))

import { isFirebaseGoogleConfigured } from '@/lib/firebase/client'
import { signInWithGoogleFirebase } from '@/lib/firebase/google-sign-in'
import { signInWithGoogle } from '@/services/auth'

describe('signInWithGoogle', () => {
  beforeEach(() => {
    vi.mocked(isFirebaseGoogleConfigured).mockReset()
    vi.mocked(signInWithGoogleFirebase).mockClear()
  })

  it('uses Firebase popup flow when Firebase is configured', async () => {
    vi.mocked(isFirebaseGoogleConfigured).mockReturnValue(true)
    const mode = await signInWithGoogle()
    expect(mode).toBe('popup')
    expect(signInWithGoogleFirebase).toHaveBeenCalledOnce()
  })

  it('falls back to Supabase OAuth redirect when Firebase is not configured', async () => {
    vi.mocked(isFirebaseGoogleConfigured).mockReturnValue(false)
    const mode = await signInWithGoogle()
    expect(mode).toBe('redirect')
    expect(signInWithGoogleFirebase).not.toHaveBeenCalled()
  })
})
