import { describe, expect, it } from 'vitest'
import { buildAuthRedirectUrl } from './auth-redirect-url'

describe('buildAuthRedirectUrl', () => {
  it('appends /auth/callback to origin-only VITE_AUTH_REDIRECT_URL', () => {
    expect(buildAuthRedirectUrl('/auth/callback', 'https://www.mucolabs.com')).toBe(
      'https://www.mucolabs.com/auth/callback',
    )
  })

  it('appends /auth/callback when base has trailing slash', () => {
    expect(buildAuthRedirectUrl('/auth/callback', 'https://www.mucolabs.com/')).toBe(
      'https://www.mucolabs.com/auth/callback',
    )
  })

  it('does not double-append when base already ends with /auth/callback', () => {
    expect(
      buildAuthRedirectUrl('/auth/callback', 'https://www.mucolabs.com/auth/callback'),
    ).toBe('https://www.mucolabs.com/auth/callback')
  })

  it('uses window origin fallback when env base is absent', () => {
    expect(buildAuthRedirectUrl('/auth/callback', undefined, 'https://www.mucolabs.com')).toBe(
      'https://www.mucolabs.com/auth/callback',
    )
  })

  it('supports other auth paths on origin base', () => {
    expect(buildAuthRedirectUrl('/auth/reset-password', 'https://www.mucolabs.com')).toBe(
      'https://www.mucolabs.com/auth/reset-password',
    )
  })
})
