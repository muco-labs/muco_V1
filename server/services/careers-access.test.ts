import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'

describe('careers RBAC', () => {
  it('does not grant careers permissions to customers or employees by default', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    const employee = new Set(defaultRolePermissions.EMPLOYEE)
    expect(hasPermission(customer, 'careers.view')).toBe(false)
    expect(hasPermission(employee, 'careers.view')).toBe(false)
    expect(hasPermission(employee, 'careers.manage')).toBe(false)
  })

  it('grants careers permissions to admin roles', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'] as const) {
      const perms = new Set(defaultRolePermissions[role])
      expect(hasPermission(perms, 'careers.view')).toBe(true)
      expect(hasPermission(perms, 'careers.manage')).toBe(true)
      expect(hasPermission(perms, 'careers.notes')).toBe(true)
    }
  })
})
