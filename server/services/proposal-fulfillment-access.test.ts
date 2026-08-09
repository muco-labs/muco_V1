import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { serializeCustomerProposal } from './proposal-fulfillment.service.js'

describe('proposals RBAC', () => {
  it('allows customers to view and approve but not create or send', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'proposals.view')).toBe(true)
    expect(hasPermission(customer, 'proposals.approve')).toBe(true)
    expect(hasPermission(customer, 'proposals.create')).toBe(false)
    expect(hasPermission(customer, 'proposals.send')).toBe(false)
  })

  it('grants proposal management to admin roles', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'] as const) {
      const perms = new Set(defaultRolePermissions[role])
      expect(hasPermission(perms, 'proposals.view')).toBe(true)
      expect(hasPermission(perms, 'proposals.create')).toBe(true)
      expect(hasPermission(perms, 'proposals.update')).toBe(true)
      expect(hasPermission(perms, 'proposals.send')).toBe(true)
    }
  })
})

describe('serializeCustomerProposal', () => {
  const now = new Date('2026-01-15T10:00:00.000Z')

  it('does not expose internal ids beyond public reference', () => {
    const dto = serializeCustomerProposal(
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        leadId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        customerId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        projectId: null,
        title: 'Website proposal',
        scope: 'Scope text',
        deliverables: null,
        timeline: null,
        terms: null,
        status: 'sent',
        amount: '1000.00',
        currency: 'INR',
        validUntil: null,
        customerDecidedAt: null,
        customerDecisionNote: null,
        version: 1,
        revisedFromId: null,
        discountAmount: null,
        discountNote: null,
        approvedForSendAt: null,
        approvedForSendBy: null,
        paymentSchedule: null,
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          id: 'd1',
          proposalId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          description: 'Design',
          quantity: '1',
          unitAmount: '1000',
          itemType: 'service',
          sortOrder: 0,
        },
      ],
      { sourceRequestReference: 'REQ-B2C3D4E5' },
    )

    expect(dto.reference).toBe('PROP-A1B2C3D4')
    expect(dto).not.toHaveProperty('leadId')
    expect(dto).not.toHaveProperty('customerId')
    expect(dto.subtotal).toBe('1000.00')
  })
})
