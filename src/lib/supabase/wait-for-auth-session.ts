import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { preparePkceOAuthCallback } from '@/lib/supabase/pkce-callback-url'
import { getSupabaseAuthStorageKey } from '@/lib/supabase/client'
import { createSupabaseAuthStorage } from '@/lib/supabase/cross-subdomain-auth-storage'

export type AuthSessionFailurePoint =
  | 'initialize'
  | 'get_session'
  | 'pkce_exchange_skipped_or_failed'
  | null

function readOAuthCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('code')
}

function getClientAuthStorage(client: SupabaseClient): Storage {
  const auth = client.auth as { storage?: Storage }
  return auth.storage ?? createSupabaseAuthStorage()
}

function isPkceCodeAlreadyUsedError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('already been used') ||
    message.includes('invalid grant') ||
    message.includes('code verifier') ||
    message.includes('invalid flow state')
  )
}

function stripOAuthCodeFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('code')) return
  url.searchParams.delete('code')
  const search = url.searchParams.toString()
  const next = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
  window.history.replaceState(window.history.state, '', next)
}

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
  const oauthCodeCaptured = readOAuthCodeFromUrl()
  const storageKey = getSupabaseAuthStorageKey()
  if (storageKey && oauthCodeCaptured) {
    preparePkceOAuthCallback(storageKey, getClientAuthStorage(client))
  }

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
  const oauthCode = oauthCodeCaptured ?? readOAuthCodeFromUrl()

  if (!session && oauthCode) {
    const exchanged = await client.auth.exchangeCodeForSession(oauthCode)
    if (exchanged.error) {
      if (isPkceCodeAlreadyUsedError(exchanged.error)) {
        const recovered = await client.auth.getSession()
        session = recovered.data.session ?? null
        if (!session && recovered.error) {
          return {
            session: null,
            error: recovered.error,
            failurePoint: 'get_session',
            initializeOk: true,
            initializeError: null,
          }
        }
      } else {
        return {
          session: null,
          error: exchanged.error,
          failurePoint: 'pkce_exchange_skipped_or_failed',
          initializeOk: true,
          initializeError: null,
        }
      }
    } else {
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
  }

  if (!session && oauthCodeCaptured) {
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

  if (session && oauthCodeCaptured) {
    stripOAuthCodeFromUrl()
  }

  return {
    session,
    error: null,
    failurePoint: null,
    initializeOk: true,
    initializeError: null,
  }
}
