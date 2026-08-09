import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createSupabaseAuthStorage } from './cross-subdomain-auth-storage'

describe('cross-subdomain-auth-storage', () => {
  const cookieJar = new Map<string, string>()

  beforeEach(() => {
    cookieJar.clear()
    vi.stubGlobal('window', {
      location: { hostname: 'www.mucolabs.com', protocol: 'https:' },
    })
    vi.stubGlobal('document', {
      get cookie() {
        return [...cookieJar.entries()]
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('; ')
      },
      set cookie(value: string) {
        const [pair] = value.split(';')
        const eq = pair.indexOf('=')
        if (eq < 0) return
        const name = decodeURIComponent(pair.slice(0, eq).trim())
        const val = decodeURIComponent(pair.slice(eq + 1).trim())
        if (value.includes('Max-Age=0')) {
          cookieJar.delete(name)
        } else {
          cookieJar.set(name, val)
        }
      },
    })
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      key: () => null,
      length: 0,
      clear: () => undefined,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists values in chunked cookies on mucolabs hosts', () => {
    const storage = createSupabaseAuthStorage()
    const payload = 'x'.repeat(4000)
    storage.setItem('sb-test-auth-token', payload)
    expect(storage.getItem('sb-test-auth-token')).toBe(payload)
    storage.removeItem('sb-test-auth-token')
    expect(storage.getItem('sb-test-auth-token')).toBeNull()
  })
})
