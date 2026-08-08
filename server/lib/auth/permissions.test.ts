import { describe, expect, it } from 'vitest'
import {
  hasPermission,
  roleCanAccessPortal,
  hasAnyRole,
} from './permissions.js'

describe('roleCanAccessPortal', () => {
  it('allows customers only on customer portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'customer')).toBe(true)
    expect(roleCanAccessPortal(['CUSTOMER'], 'employee')).toBe(false)
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('denies employee from admin without admin role', () => {
    expect(roleCanAccessPortal(['EMPLOYEE'], 'admin')).toBe(false)
    expect(roleCanAccessPortal(['EMPLOYEE'], 'employee')).toBe(true)
  })

  it('allows founder on admin portal', () => {
    expect(roleCanAccessPortal(['FOUNDER'], 'admin')).toBe(true)
  })
})

describe('hasPermission', () => {
  it('checks permission membership', () => {
    const perms = new Set(['leads.view'])
    expect(hasPermission(perms, 'leads.view')).toBe(true)
    expect(hasPermission(perms, 'payments.manage')).toBe(false)
  })
})

describe('cross-user access scenarios (authorization logic)', () => {
  it('customer cannot access admin portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('employee cannot access financial admin without permission', () => {
    const employeePerms = new Set(['tasks.view', 'projects.view'])
    expect(hasPermission(employeePerms, 'payments.manage')).toBe(false)
  })

  it('admin role flag alone is not enough without portal mapping for customer', () => {
    expect(roleCanAccessPortal(['ADMIN'], 'customer')).toBe(false)
  })

  it('founder has admin portal access', () => {
    expect(hasAnyRole(['FOUNDER'], 'FOUNDER', 'SUPER_ADMIN')).toBe(true)
    expect(roleCanAccessPortal(['FOUNDER'], 'admin')).toBe(true)
  })
})
