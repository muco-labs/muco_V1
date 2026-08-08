import { env } from '@/config/env'
import { getSupabaseClient } from '@/lib/supabase/client'
import { apiRequest } from '@/services/api'

function redirectUrl(path: string): string | undefined {
  if (env.authRedirectUrl) {
    return `${env.authRedirectUrl.replace(/\/$/, '')}${path}`
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return undefined
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

export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Authentication is not configured.')
  }

  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
}

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
