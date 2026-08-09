import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { serializeCustomerPayment } from './proposal-payment.service.js'
import { verifyRazorpayCheckoutSignature } from './payment.service.js'

describe('payments RBAC', () => {
  it('allows customers to view payments but not manage', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'payments.view')).toBe(true)
    expect(hasPermission(customer, 'payments.manage')).toBe(false)
  })
})

describe('serializeCustomerPayment', () => {
  const now = new Date('2026-01-15T10:00:00.000Z')

  it('exposes safe customer fields', () => {
    const dto = serializeCustomerPayment(
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        invoiceId: null,
        proposalId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        customerId: 'c3',
        amount: '1000.00',
        currency: 'INR',
        provider: 'razorpay',
        status: 'succeeded',
        gatewayReference: 'pay_123',
        signatureVerified: true,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      },
      { proposalReference: 'PROP-B2C3D4E5' },
    )
    expect(dto.reference).toBe('PAY-A1B2C3D4')
    expect(dto).not.toHaveProperty('gatewayReference')
    expect(dto).not.toHaveProperty('proposalId')
  })
})

describe('verifyRazorpayCheckoutSignature', () => {
  it('rejects when Razorpay is not configured', () => {
    expect(verifyRazorpayCheckoutSignature('order', 'pay', 'sig')).toBe(false)
  })
})
