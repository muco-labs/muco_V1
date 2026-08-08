import { describe, expect, it } from 'vitest'
import { hasPermission, roleCanAccessPortal } from '../lib/auth/permissions.js'
import { verifyRazorpayWebhookSignature } from './payment.service.js'

/**
 * Step 15 — launch gate logic tests (no live DB).
 * Data isolation is enforced in portal services via scoped queries.
 */
describe('privilege escalation matrix', () => {
  const cases: Array<{ roles: string[]; portal: 'customer' | 'employee' | 'admin'; allowed: boolean }> =
    [
      { roles: ['CUSTOMER'], portal: 'admin', allowed: false },
      { roles: ['CUSTOMER'], portal: 'employee', allowed: false },
      { roles: ['EMPLOYEE'], portal: 'admin', allowed: false },
      { roles: ['EMPLOYEE'], portal: 'customer', allowed: false },
      { roles: ['ADMIN'], portal: 'admin', allowed: true },
      { roles: ['FOUNDER'], portal: 'admin', allowed: true },
    ]

  it.each(cases)('$roles → $portal = $allowed', ({ roles, portal, allowed }) => {
    expect(roleCanAccessPortal(roles, portal)).toBe(allowed)
  })
})

describe('finance isolation for employees', () => {
  it('developer employee cannot view invoices without permission', () => {
    const perms = new Set(['tasks.view', 'projects.view', 'messages.view'])
    expect(hasPermission(perms, 'invoices.view')).toBe(false)
    expect(hasPermission(perms, 'payments.view')).toBe(false)
  })
})

describe('webhook hardening', () => {
  it('rejects unsigned webhooks when secret is not configured', () => {
    expect(verifyRazorpayWebhookSignature('{"event":"payment.captured"}', 'bad')).toBe(false)
  })
})
