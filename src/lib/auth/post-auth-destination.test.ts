import { describe, expect, it } from 'vitest'
import { resolvePostAuthDestination } from './post-auth-destination'
import type { MeResponse } from '@/contexts/auth-context'

function profile(overrides: Partial<MeResponse> & { portals: MeResponse['portals'] }): MeResponse {
  return {
    registered: true,
    email: 'user@example.com',
    emailVerified: true,
    status: 'active',
    roles: [],
    permissions: [],
    ...overrides,
  }
}

describe('resolvePostAuthDestination', () => {
  it('routes admin before customer when no safe return path', () => {
    const dest = resolvePostAuthDestination(
      profile({
        portals: { customer: true, employee: false, admin: true, freelancer: false },
      }),
      null,
      'localhost',
    )
    expect(dest).toBe('/admin')
  })

  it('honors safe customer deep link when customer portal allowed', () => {
    const dest = resolvePostAuthDestination(
      profile({
        portals: { customer: true, employee: false, admin: false, freelancer: false },
      }),
      '/app/projects/abc',
    )
    expect(dest).toBe('/app/projects/abc')
  })

  it('rejects unsafe return and uses employee portal', () => {
    const dest = resolvePostAuthDestination(
      profile({
        portals: { customer: false, employee: true, admin: false, freelancer: false },
      }),
      'https://evil.test/app',
      'localhost',
    )
    expect(dest).toBe('/team')
  })

  it('uses subdomain origin on www for admin', () => {
    const dest = resolvePostAuthDestination(
      profile({
        portals: { customer: false, employee: false, admin: true, freelancer: false },
      }),
      null,
      'www.mucolabs.com',
    )
    expect(dest).toBe('https://admin.mucolabs.com/')
  })

  it('sends unregistered users to sign up', () => {
    expect(
      resolvePostAuthDestination({
        registered: false,
        email: 'a@b.com',
        emailVerified: false,
        roles: [],
        permissions: [],
        portals: { customer: false, employee: false, admin: false, freelancer: false },
      }),
    ).toBe('/auth/sign-up')
  })
})
