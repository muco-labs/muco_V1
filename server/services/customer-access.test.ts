import { describe, expect, it } from 'vitest'
import { roleCanAccessPortal } from '../lib/auth/permissions.js'

/**
 * Authorization matrix for customer portal (logic-level).
 * Data isolation is enforced in customer.service via customerId from session.
 */
describe('customer portal access matrix', () => {
  it('TEST 9: customer cannot access admin portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('TEST 10: customer cannot access employee portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'employee')).toBe(false)
  })

  it('TEST 13: customer can access customer portal', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'customer')).toBe(true)
  })

  it('TEST 5–8: employee/admin roles must not receive customer portal by default', () => {
    expect(roleCanAccessPortal(['EMPLOYEE'], 'customer')).toBe(false)
    expect(roleCanAccessPortal(['ADMIN'], 'customer')).toBe(false)
  })
})

describe('customerOwns helpers', () => {
  it('returns false without database', async () => {
    const { customerOwnsInvoice, customerOwnsProject } = await import(
      '../services/customer.service.js'
    )
    await expect(customerOwnsInvoice('a', 'b')).resolves.toBe(false)
    await expect(customerOwnsProject('a', 'b')).resolves.toBe(false)
  })
})
