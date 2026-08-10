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
  initializeOk: boolean
  initializeError: Error | null
}> {
  const init = await client.auth.initialize()
  if (init.error) {
    return {
      session: null,
      error: init.error,
      failurePoint: 'initialize',
      initializeOk: false,
      initializeError: init.error,
    }
  }
  const { data, error } = await client.auth.getSession()
  if (error) {
    return {
      session: null,
      error,
      failurePoint: 'get_session',
      initializeOk: true,
      initializeError: null,
    }
  }
  let session = data.session ?? null
  const oauthCode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code')
      : null

  if (!session && oauthCode) {
    const exchanged = await client.auth.exchangeCodeForSession(oauthCode)
    if (exchanged.error) {
      return {
        session: null,
        error: exchanged.error,
        failurePoint: 'pkce_exchange_skipped_or_failed',
        initializeOk: true,
        initializeError: null,
      }
    }
    session = exchanged.data.session ?? null
    if (!session) {
      const afterExchange = await client.auth.getSession()
      session = afterExchange.data.session ?? null
      if (afterExchange.error && !session) {
        return {
          session: null,
          error: afterExchange.error,
          failurePoint: 'get_session',
          initializeOk: true,
          initializeError: null,
        }
      }
    }
  }

  if (!session && oauthCode) {
    return {
      session: null,
      error: new Error(
        'OAuth callback did not produce a session (PKCE exchange completed without a session).',
      ),
      failurePoint: 'pkce_exchange_skipped_or_failed',
      initializeOk: true,
      initializeError: null,
    }
  }
  return {
    session,
    error: null,
    failurePoint: null,
    initializeOk: true,
    initializeError: null,
  }
}
