import { describe, expect, it } from 'vitest'
import { authRoutes } from '@/config/auth'
import {
  resolveMarketingNavbarAccountHref,
  resolveMarketingNavbarAccountLabel,
} from './marketing-navbar-account'
import type { MeResponse } from '@/contexts/auth-context'

const baseProfile: MeResponse = {
  registered: true,
  email: 'user@example.com',
  emailVerified: true,
  status: 'active',
  roles: ['CUSTOMER'],
  permissions: [],
  portals: { customer: true, employee: false, freelancer: false, admin: false },
}

describe('marketing-navbar-account', () => {
  it('prefers full name for label', () => {
    expect(
      resolveMarketingNavbarAccountLabel({
        profile: { ...baseProfile, fullName: 'Alex Customer' },
        email: 'other@example.com',
      }),
    ).toBe('Alex Customer')
  })

  it('routes customers to portal home on marketing host', () => {
    const href = resolveMarketingNavbarAccountHref(
      baseProfile,
      (portal) => portal === 'customer',
      'www.mucolabs.com',
    )
    expect(href).toMatch(/^https:\/\/app\.mucolabs\.com\//)
  })

  it('sends unregistered users to sign-up', () => {
    expect(
      resolveMarketingNavbarAccountHref(
        { ...baseProfile, registered: false },
        () => false,
        'www.mucolabs.com',
      ),
    ).toBe(authRoutes.signUp)
  })
})
