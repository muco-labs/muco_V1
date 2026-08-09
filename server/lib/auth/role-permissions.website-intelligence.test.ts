import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from './role-permissions.js'

describe('Website Intelligence role permissions', () => {
  const wiView = 'website_intelligence.view'
  const wiRun = 'website_intelligence.run'

  it('grants ADMIN and SUPER_ADMIN view and run', () => {
    expect(defaultRolePermissions.ADMIN).toContain(wiView)
    expect(defaultRolePermissions.ADMIN).toContain(wiRun)
    expect(defaultRolePermissions.SUPER_ADMIN).toContain(wiView)
    expect(defaultRolePermissions.SUPER_ADMIN).toContain(wiRun)
  })

  it('grants FOUNDER view and run', () => {
    expect(defaultRolePermissions.FOUNDER).toContain(wiView)
    expect(defaultRolePermissions.FOUNDER).toContain(wiRun)
  })

  it('does not grant EMPLOYEE or CUSTOMER website intelligence access', () => {
    expect(defaultRolePermissions.EMPLOYEE).not.toContain(wiView)
    expect(defaultRolePermissions.EMPLOYEE).not.toContain(wiRun)
    expect(defaultRolePermissions.CUSTOMER).not.toContain(wiView)
    expect(defaultRolePermissions.CUSTOMER).not.toContain(wiRun)
  })
})
