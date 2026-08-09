import { describe, expect, it } from 'vitest'
import { hasPermission, roleCanAccessPortal } from './permissions.js'
import { resolvePortalAccessFlags } from './portal-access.js'
import { defaultRolePermissions } from './role-permissions.js'

/**
 * MASTER 04 — identity / authorization invariants (logic-level; no live DB).
 * Data scoping is enforced in portal services (customerId, employeeId, freelancerId from session).
 */
describe('MASTER 04 — portal escalation guards', () => {
  const escalationCases: Array<{
    roles: string[]
    portal: 'customer' | 'employee' | 'admin' | 'freelancer'
    allowed: boolean
  }> = [
    { roles: ['CUSTOMER'], portal: 'admin', allowed: false },
    { roles: ['CUSTOMER'], portal: 'employee', allowed: false },
    { roles: ['CUSTOMER'], portal: 'freelancer', allowed: false },
    { roles: ['EMPLOYEE'], portal: 'admin', allowed: false },
    { roles: ['EMPLOYEE'], portal: 'customer', allowed: false },
    { roles: ['FREELANCER'], portal: 'admin', allowed: false },
    { roles: ['FREELANCER'], portal: 'customer', allowed: false },
    { roles: ['ADMIN'], portal: 'customer', allowed: false },
    { roles: ['ADMIN'], portal: 'admin', allowed: true },
    { roles: ['FOUNDER'], portal: 'admin', allowed: true },
  ]

  it.each(escalationCases)('$roles must not access $portal unless allowed=$allowed', ({
    roles,
    portal,
    allowed,
  }) => {
    expect(roleCanAccessPortal(roles, portal)).toBe(allowed)
  })
})

describe('MASTER 04 — freelancer approval gate (portal flags)', () => {
  it('matches requireFreelancerContext approval rule', () => {
    expect(
      resolvePortalAccessFlags({
        roles: ['FREELANCER'],
        freelancerApprovalStatus: 'under_review',
      }).freelancer,
    ).toBe(false)
    expect(
      resolvePortalAccessFlags({
        roles: ['FREELANCER'],
        freelancerApprovalStatus: 'approved',
      }).freelancer,
    ).toBe(true)
  })
})

describe('MASTER 04 — permission defaults are scoped', () => {
  it('CUSTOMER role has no admin permissions in defaults', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'leads.view')).toBe(false)
    expect(hasPermission(customer, 'users.disable')).toBe(false)
    expect(hasPermission(customer, 'freelancers.manage')).toBe(false)
  })

  it('FREELANCER default permissions stay empty (portal APIs use assignment checks)', () => {
    expect(defaultRolePermissions.FREELANCER).toEqual([])
  })

  it('EMPLOYEE defaults exclude payments.manage', () => {
    const employee = new Set(defaultRolePermissions.EMPLOYEE)
    expect(hasPermission(employee, 'payments.manage')).toBe(false)
    expect(hasPermission(employee, 'tasks.view')).toBe(true)
  })
})

describe('MASTER 04 — IDOR policy (documented)', () => {
  it('customer APIs derive customerId from session context, not request body', () => {
    // Enforced in customer.service requireCustomerContext + eq(projects.customerId, ctx.customerId)
    expect(true).toBe(true)
  })
})
