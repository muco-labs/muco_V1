import { describe, expect, it } from 'vitest'
import { resolvePostAuthDestination } from './post-auth-destination'
import { authRoutes } from '@/config/auth'

describe('MASTER 18 — customer sign-in registration gap', () => {
  it('sends unregistered sessions to sign-up until app profile exists', () => {
    expect(
      resolvePostAuthDestination({
        registered: false,
        email: 'user@example.com',
        emailVerified: true,
        roles: [],
        permissions: [],
        portals: { customer: false, employee: false, admin: false, freelancer: false },
      }),
    ).toBe(authRoutes.signUp)
  })
})

describe('MASTER 18 — password error messages', () => {
  it('does not expose internal keys in friendly auth errors', async () => {
    const { friendlyAuthError } = await import('./auth-errors')
    const msg = friendlyAuthError({ message: 'Invalid login credentials', name: 'AuthApiError' })
    expect(msg).not.toMatch(/supabase|service.role|jwt/i)
  })
})
