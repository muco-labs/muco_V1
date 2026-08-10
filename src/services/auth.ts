import { env } from '@/config/env'
import { buildAuthRedirectUrl } from '@/lib/auth/auth-redirect-url'
import { isMucolabsPortalOrigin } from '@/config/domains'
import { recordOAuthFlowDiagnosticsAtStart } from '@/lib/auth/oauth-callback-diagnostics'
import { isFirebaseGoogleConfigured } from '@/lib/firebase/client'
import { getSupabaseClient } from '@/lib/supabase/client'
import { apiRequest } from '@/services/api'
import type { User } from '@supabase/supabase-js'

export type OAuthProvider = 'google' | 'github'

function redirectUrl(path: string): string | undefined {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined
  const authRedirectBase =
    origin && isMucolabsPortalOrigin(origin) ? undefined : env.authRedirectUrl
  return buildAuthRedirectUrl(path, authRedirectBase, origin)
}

export async function signUpCustomer(input: {
  email: string
  password: string
  fullName: string
  companyName?: string
}) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: redirectUrl('/auth/verify-email'),
      data: { full_name: input.fullName.trim() },
    },
  })

  if (error) throw error
  if (!data.session) {
    return { needsVerification: true as const }
  }

  await apiRequest('/api/v1/auth/register', {
    method: 'POST',
    json: {
      fullName: input.fullName,
      companyName: input.companyName,
    },
  })

  return { needsVerification: false as const }
}

export async function completeRegistration(input: {
  fullName: string
  companyName?: string
}) {
  await apiRequest('/api/v1/auth/register', {
    method: 'POST',
    json: input,
  })
}

export async function signInWithPassword(identifier: string, password: string) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const trimmed = identifier.trim()
  const usesMucoId = !trimmed.includes('@')

  if (usesMucoId) {
    const session = await apiRequest<{
      accessToken: string
      refreshToken: string
      expiresIn?: number
    }>('/api/v1/auth/password-login', {
      method: 'POST',
      json: { identifier: trimmed, password },
    })

    const { error } = await client.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    })
    if (error) throw error
    return
  }

  const { error } = await client.auth.signInWithPassword({
    email: trimmed,
    password,
  })
  if (error) throw error
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const redirectTo = redirectUrl('/auth/callback')
  recordOAuthFlowDiagnosticsAtStart(redirectTo)

  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  })
  if (error) throw error
}

/** Google via Firebase popup when configured; otherwise Supabase OAuth redirect. */
export async function signInWithGoogle(): Promise<'popup' | 'redirect'> {
  if (isFirebaseGoogleConfigured()) {
    const { signInWithGoogleFirebase } = await import('@/lib/firebase/google-sign-in')
    await signInWithGoogleFirebase()
    return 'popup'
  }
  await signInWithOAuth('google')
  return 'redirect'
}

/** Provisions CUSTOMER profile when Supabase session exists but app user row is missing. */
export async function ensureCustomerRegistrationFromAuthUser(user: User) {
  const meta = user.user_metadata ?? {}
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    user.email?.split('@')[0]?.trim() ||
    'MUCO Labs user'

  await apiRequest('/api/v1/auth/register', {
    method: 'POST',
    json: { fullName },
  })
}

/** @deprecated Use ensureCustomerRegistrationFromAuthUser */
export const ensureCustomerRegistrationFromOAuthUser = ensureCustomerRegistrationFromAuthUser

export async function requestPasswordReset(email: string) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl('/auth/reset-password'),
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
}
