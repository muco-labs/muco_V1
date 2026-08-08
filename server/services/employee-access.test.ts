import { describe, expect, it } from 'vitest'
import { roleCanAccessPortal } from '../lib/auth/permissions.js'

describe('employee portal access matrix', () => {
  it('TEST 1: employee can access employee portal', () => {
    expect(roleCanAccessPortal(['EMPLOYEE'], 'employee')).toBe(true)
  })

  it('TEST 2: customer cannot access employee portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'employee')).toBe(false)
  })

  it('TEST 8: customer cannot access admin portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('TEST 9: employee without admin role cannot access admin portal', () => {
    expect(roleCanAccessPortal(['EMPLOYEE'], 'admin')).toBe(false)
  })
})

describe('employee project access helper', () => {
  it('returns false without database', async () => {
    const { employeeHasProjectAccess } = await import('../services/employee.service.js')
    await expect(employeeHasProjectAccess('a', 'b')).resolves.toBe(false)
  })
})
