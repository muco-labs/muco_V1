import type { AuthError } from '@supabase/supabase-js'

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Sign in failed. Check your email and password.',
  email_not_confirmed: 'Confirm your email before signing in. Check your inbox.',
  user_already_exists: 'An account with this email already exists. Try signing in.',
  weak_password: 'Choose a stronger password (at least 8 characters).',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  oauth_cancelled: 'Sign-in was cancelled.',
  provider_disabled: 'This sign-in method is not available yet.',
  unauthorized_domain:
    'Google sign-in is not allowed for this site URL. Try www.mucolabs.com or email sign-in.',
  pkce_code_verifier_not_found:
    'Sign-in could not be completed. Start again from the sign-in page (do not refresh this page).',
}

export function friendlyAuthError(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (!error || typeof error !== 'object') return fallback
  const authError = error as AuthError
  const code = authError.code ?? authError.message?.toLowerCase().replace(/\s+/g, '_')
  if (code && MESSAGES[code]) return MESSAGES[code]
  const msg = authError.message ?? ''
  if (/invalid login credentials/i.test(msg)) return MESSAGES.invalid_credentials
  if (/email not confirmed/i.test(msg)) return MESSAGES.email_not_confirmed
  if (/already registered|already exists/i.test(msg)) return MESSAGES.user_already_exists
  if (/password/i.test(msg) && /weak|short/i.test(msg)) return MESSAGES.weak_password
  if (/rate limit/i.test(msg)) return MESSAGES.over_request_rate_limit
  if (/unauthorized[- ]domain/i.test(msg)) return MESSAGES.unauthorized_domain
  if (authError.code === 'auth/unauthorized-domain') return MESSAGES.unauthorized_domain
  if (authError.code === 'pkce_code_verifier_not_found') return MESSAGES.pkce_code_verifier_not_found
  if (/code verifier/i.test(msg)) return MESSAGES.pkce_code_verifier_not_found
  return fallback
}
