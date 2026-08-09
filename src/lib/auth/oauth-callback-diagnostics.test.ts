import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildStorageDiagnosticFields,
  getSupabaseClientStorageKey,
  inspectSessionStorageRead,
  inspectVerifierStorageRead,
  mapSessionFailureToStage,
  pkceVerifierSlotKey,
  resolveActualAuthStorageCookieKey,
  wouldSupabaseTreatAsPkceCallback,
} from './oauth-callback-diagnostics'

describe('oauth-callback-diagnostics', () => {
  const cookieJar = new Map<string, string>()

  beforeEach(() => {
    cookieJar.clear()
    vi.stubGlobal('window', {
      location: { hostname: 'mucolabs.com', protocol: 'https:', pathname: '/auth/callback', search: '?code=x' },
    })
    vi.stubGlobal('document', {
      get cookie() {
        return [...cookieJar.entries()].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
      },
      set cookie(value: string) {
        const [pair] = value.split(';')
        const eq = pair.indexOf('=')
        if (eq < 0) return
        const name = pair.slice(0, eq).trim()
        const val = decodeURIComponent(pair.slice(eq + 1).trim())
        if (value.includes('Max-Age=0')) {
          cookieJar.delete(name)
        } else {
          cookieJar.set(name, val)
        }
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps session failure points to stages', () => {
    expect(mapSessionFailureToStage('initialize')).toBe('A_initialize')
    expect(mapSessionFailureToStage('get_session')).toBe('B_get_session')
    expect(mapSessionFailureToStage('pkce_exchange_skipped_or_failed')).toBe('C_pkce_exchange')
    expect(mapSessionFailureToStage(null)).toBe(null)
  })

  it('reads storageKey from Supabase client', () => {
    const client = {
      auth: { storageKey: 'sb-demo-auth-token', storage: { getItem: () => null } },
    } as unknown as SupabaseClient
    expect(getSupabaseClientStorageKey(client)).toBe('sb-demo-auth-token')
  })

  it('detects verifier readable via storage.getItem without exposing value', () => {
    const key = 'sb-demo-auth-token-code-verifier'
    const storage = {
      getItem: (k: string) => (k === key ? JSON.stringify('verifier/sign-in') : null),
    } as Storage
    expect(inspectVerifierStorageRead(storage, key)).toEqual({
      verifierReadable: true,
      verifierJsonParsable: true,
    })
  })

  it('detects session storage JSON readability', () => {
    const key = 'sb-demo-auth-token'
    const storage = {
      getItem: (k: string) => (k === key ? JSON.stringify({ access_token: 'secret' }) : null),
    } as Storage
    const result = inspectSessionStorageRead(storage, key)
    expect(result.sessionStorageReadable).toBe(true)
    expect(result.sessionJsonParsable).toBe(true)
  })

  it('resolves actual cookie key and buildStorageDiagnosticFields', () => {
    cookieJar.set('sb-demo-auth-token-code-verifier', JSON.stringify('v/sign-in'))
    const client = {
      auth: {
        storageKey: 'sb-demo-auth-token',
        storage: {
          getItem: (k: string) => {
            if (k === 'sb-demo-auth-token-code-verifier') {
              return JSON.stringify('v/sign-in')
            }
            return null
          },
        },
      },
    } as unknown as SupabaseClient
    expect(resolveActualAuthStorageCookieKey('sb-demo-auth-token', ['sb-demo-auth-token-code-verifier'])).toBe(null)
    cookieJar.set('sb-demo-auth-token', JSON.stringify({}))
    const fields = buildStorageDiagnosticFields(client)
    expect(fields.storageKeyExpected).toBe('sb-demo-auth-token')
    expect(fields.verifierReadable).toBe(true)
    expect(fields.verifierCookieKeyPresent).toBe(true)
    const clientStorage = (client.auth as unknown as { storage: Storage }).storage
    expect(
      wouldSupabaseTreatAsPkceCallback(clientStorage, 'sb-demo-auth-token', true, null),
    ).toBe(true)
  })

  it('uses flow slot key when sb_flow_id is present', () => {
    vi.stubGlobal('window', {
      location: {
        hostname: 'mucolabs.com',
        protocol: 'https:',
        pathname: '/auth/callback',
        search: '?code=x&sb_flow_id=flow-1',
      },
    })
    const storageKey = 'sb-demo-auth-token'
    const slotKey = pkceVerifierSlotKey(storageKey, 'flow-1')
    const storage = {
      getItem: (k: string) => {
        if (k === slotKey) return JSON.stringify('v/sign-in')
        return null
      },
    } as Storage
    expect(wouldSupabaseTreatAsPkceCallback(storage, storageKey, true, 'flow-1')).toBe(true)
  })
})
