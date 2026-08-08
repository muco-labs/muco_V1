import { describe, expect, it } from 'vitest'
import { requireExecutiveAccess } from './org.service.js'

describe('requireExecutiveAccess', () => {
  const base = {
    authUserId: 'a',
    userId: 'a',
    email: 'a@test.com',
    status: 'active',
    permissions: new Set<string>(),
    roles: [] as string[],
  }

  it('allows founder', () => {
    expect(() =>
      requireExecutiveAccess({ ...base, roles: ['FOUNDER'], permissions: new Set() }),
    ).not.toThrow()
  })

  it('denies plain employee', () => {
    expect(() =>
      requireExecutiveAccess({ ...base, roles: ['EMPLOYEE'], permissions: new Set(['leads.view']) }),
    ).toThrow()
  })

  it('allows analytics + settings manage', () => {
    expect(() =>
      requireExecutiveAccess({
        ...base,
        roles: ['ADMIN'],
        permissions: new Set(['analytics.view', 'settings.manage']),
      }),
    ).not.toThrow()
  })
})
