/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { waitForAuthSession } from './wait-for-auth-session'

function mockSession(): Session {
  return {
    access_token: 'at',
    refresh_token: 'rt',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'u@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: '',
    },
  } as Session
}

function createMockClient(handlers: {
  initialize?: () => Promise<{ error: Error | null }>
  getSession?: () => Promise<{ data: { session: Session | null }; error: Error | null }>
  exchangeCodeForSession?: (code: string) => Promise<{
    data: { session: Session | null }
    error: Error | null
  }>
}): SupabaseClient {
  const initialize =
    handlers.initialize ??
    (async (): Promise<{ error: Error | null }> => ({ error: null }))
  const getSession =
    handlers.getSession ??
    (async (): Promise<{ data: { session: Session | null }; error: Error | null }> => ({
      data: { session: null },
      error: null,
    }))
  const exchangeCodeForSession =
    handlers.exchangeCodeForSession ??
    (async (): Promise<{ data: { session: Session | null }; error: Error | null }> => ({
      data: { session: null },
      error: null,
    }))

  return {
    auth: {
      initialize: vi.fn(initialize),
      getSession: vi.fn(getSession),
      exchangeCodeForSession: vi.fn(exchangeCodeForSession),
    },
  } as unknown as SupabaseClient
}

describe('waitForAuthSession', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/auth/callback')
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('returns session when initialize and getSession succeed', async () => {
    const session = mockSession()
    const client = createMockClient({
      getSession: async () => ({ data: { session }, error: null }),
    })
    const result = await waitForAuthSession(client)
    expect(result.session?.user.id).toBe('user-1')
    expect(result.failurePoint).toBeNull()
  })

  it('exchanges PKCE code when session missing after getSession', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=pkce-code')
    const session = mockSession()
    const client = createMockClient({
      getSession: async () => ({ data: { session: null }, error: null }),
      exchangeCodeForSession: async (code) => {
        expect(code).toBe('pkce-code')
        return { data: { session }, error: null }
      },
    })
    const result = await waitForAuthSession(client)
    expect(result.session?.user.id).toBe('user-1')
    expect(window.location.pathname).toBe('/auth/callback')
    expect(window.location.search).toBe('')
  })

  it('recovers session when exchange reports code already used', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=used')
    const session = mockSession()
    let getSessionCalls = 0
    const client = createMockClient({
      getSession: async () => {
        getSessionCalls += 1
        if (getSessionCalls === 1) {
          return { data: { session: null }, error: null }
        }
        return { data: { session }, error: null }
      },
      exchangeCodeForSession: async () => ({
        data: { session: null },
        error: new Error('invalid grant: code has already been used'),
      }),
    })
    const result = await waitForAuthSession(client)
    expect(result.session?.user.id).toBe('user-1')
    expect(result.failurePoint).toBeNull()
  })
})
