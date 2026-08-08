import { describe, expect, it } from 'vitest'
import { hasPermission, roleCanAccessPortal } from '../lib/auth/permissions.js'
import { getIntegrationStatus } from './admin.service.js'

describe('admin portal access matrix', () => {
  it('TEST 1: customer cannot access admin portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('TEST 2: employee without admin role cannot access admin portal', () => {
    expect(roleCanAccessPortal(['EMPLOYEE'], 'admin')).toBe(false)
  })

  it('TEST 4: admin can access admin portal', () => {
    expect(roleCanAccessPortal(['ADMIN'], 'admin')).toBe(true)
    expect(roleCanAccessPortal(['FOUNDER'], 'admin')).toBe(true)
  })
})

describe('financial permission', () => {
  it('TEST 7: employee without financial permissions', () => {
    const employeePerms = new Set(['tasks.view', 'projects.view'])
    expect(hasPermission(employeePerms, 'invoices.view')).toBe(false)
    expect(hasPermission(employeePerms, 'payments.view')).toBe(false)
  })

  it('admin role permissions include invoices.view', () => {
    const adminPerms = new Set(['invoices.view', 'payments.view'])
    expect(hasPermission(adminPerms, 'invoices.view')).toBe(true)
  })
})

describe('integration status', () => {
  it('TEST 13: never returns secret key material', () => {
    const status = getIntegrationStatus()
    const serialized = JSON.stringify(status)
    expect(serialized).not.toMatch(/sk_[a-z0-9]+/i)
    expect(status).not.toHaveProperty('razorpayKeySecret')
    expect(Object.keys(status)).not.toContain('webhookSecret')
  })
})
