import { describe, expect, it, vi } from 'vitest'
import {
  applyOAuthCallbackRecoveryIfNeeded,
  oauthCallbackRecoveryTarget,
  shouldRecoverOAuthCallbackUrl,
} from './oauth-callback-recovery'

function loc(
  overrides: Partial<{
    pathname: string
    search: string
    hash: string
    hostname: string
  }> = {},
) {
  return {
    pathname: '/',
    search: '',
    hash: '',
    hostname: 'www.mucolabs.com',
    ...overrides,
  }
}

describe('oauth-callback-recovery', () => {
  describe('shouldRecoverOAuthCallbackUrl', () => {
    it('A. recovers /?code=abc to /auth/callback?code=abc', () => {
      expect(shouldRecoverOAuthCallbackUrl(loc({ search: '?code=abc' }))).toBe(true)
      expect(oauthCallbackRecoveryTarget(loc({ search: '?code=abc' }))).toBe(
        '/auth/callback?code=abc',
      )
    })

    it('B. preserves state in query', () => {
      expect(shouldRecoverOAuthCallbackUrl(loc({ search: '?code=abc&state=xyz' }))).toBe(true)
      expect(oauthCallbackRecoveryTarget(loc({ search: '?code=abc&state=xyz' }))).toBe(
        '/auth/callback?code=abc&state=xyz',
      )
    })

    it('C. recovers OAuth error query', () => {
      expect(shouldRecoverOAuthCallbackUrl(loc({ search: '?error=access_denied' }))).toBe(true)
      expect(oauthCallbackRecoveryTarget(loc({ search: '?error=access_denied' }))).toBe(
        '/auth/callback?error=access_denied',
      )
    })

    it('D. does not recover when already on /auth/callback', () => {
      expect(
        shouldRecoverOAuthCallbackUrl(
          loc({ pathname: '/auth/callback', search: '?code=abc' }),
        ),
      ).toBe(false)
    })

    it('E. does not recover normal /', () => {
      expect(shouldRecoverOAuthCallbackUrl(loc())).toBe(false)
    })

    it('F. does not recover normal /services', () => {
      expect(shouldRecoverOAuthCallbackUrl(loc({ pathname: '/services' }))).toBe(false)
    })

    it('preserves hash when recovering', () => {
      expect(
        oauthCallbackRecoveryTarget(loc({ search: '?code=abc', hash: '#fragment' })),
      ).toBe('/auth/callback?code=abc#fragment')
    })
  })

  describe('applyOAuthCallbackRecoveryIfNeeded', () => {
    it('calls location.replace for misplaced OAuth code', () => {
      const replace = vi.fn()
      vi.stubGlobal('window', {
        location: {
          pathname: '/',
          search: '?code=abc',
          hash: '',
          hostname: 'www.mucolabs.com',
          replace,
        },
      })
      expect(applyOAuthCallbackRecoveryIfNeeded()).toBe(true)
      expect(replace).toHaveBeenCalledWith('/auth/callback?code=abc')
      vi.unstubAllGlobals()
    })

    it('does not replace when already on callback', () => {
      const replace = vi.fn()
      vi.stubGlobal('window', {
        location: {
          pathname: '/auth/callback',
          search: '?code=abc',
          hash: '',
          hostname: 'www.mucolabs.com',
          replace,
        },
      })
      expect(applyOAuthCallbackRecoveryIfNeeded()).toBe(false)
      expect(replace).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })
  })
})
