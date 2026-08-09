import type { SupabaseClient, Session } from '@supabase/supabase-js'

export type AuthSessionFailurePoint =
  | 'initialize'
  | 'get_session'
  | 'pkce_exchange_skipped_or_failed'
  | null

/**
 * Wait for Supabase client initialization (PKCE / implicit URL handling) before reading session.
 */
export async function waitForAuthSession(client: SupabaseClient): Promise<{
  session: Session | null
  error: Error | null
  failurePoint: AuthSessionFailurePoint
}> {
  const init = await client.auth.initialize()
  if (init.error) {
    return { session: null, error: init.error, failurePoint: 'initialize' }
  }
  const { data, error } = await client.auth.getSession()
  if (error) {
    return { session: null, error, failurePoint: 'get_session' }
  }
  const session = data.session ?? null
  const hasOAuthCode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('code')
  if (!session && hasOAuthCode) {
    return {
      session: null,
      error: new Error(
        'OAuth callback did not produce a session (PKCE exchange may have been skipped or storage read failed).',
      ),
      failurePoint: 'pkce_exchange_skipped_or_failed',
    }
  }
  return { session, error: null, failurePoint: null }
}
