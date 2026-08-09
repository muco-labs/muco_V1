import { describe, expect, it } from 'vitest'
import { defaultRolePermissions } from '../lib/auth/role-permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { PROJECT_FULFILLMENT_STATUSES } from '../lib/projects/project-fulfillment.js'
import { serializeCustomerProjectSummary } from './project-fulfillment.service.js'

describe('projects RBAC', () => {
  it('allows customers to view their projects but not create or update', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'projects.view')).toBe(true)
    expect(hasPermission(customer, 'projects.create')).toBe(false)
    expect(hasPermission(customer, 'projects.update')).toBe(false)
  })

  it('grants project management to admin roles', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'] as const) {
      const perms = new Set(defaultRolePermissions[role])
      expect(hasPermission(perms, 'projects.view')).toBe(true)
      expect(hasPermission(perms, 'projects.create')).toBe(true)
      expect(hasPermission(perms, 'projects.update')).toBe(true)
    }
  })

  it('does not grant projects.create to employees by default', () => {
    const employee = new Set(defaultRolePermissions.EMPLOYEE)
    expect(hasPermission(employee, 'projects.view')).toBe(true)
    expect(hasPermission(employee, 'projects.create')).toBe(false)
  })
})

describe('serializeCustomerProjectSummary', () => {
  const now = new Date('2026-01-15T10:00:00.000Z')

  it('exposes customer-safe fields only', () => {
    const leadId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const projectId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
    const dto = serializeCustomerProjectSummary({
      id: projectId,
      customerId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      leadId,
      name: 'Acme Website',
      description: 'Build marketing site',
      status: 'draft',
      service: 'Web development',
      operationalPhase: 'discovery',
      proposalId: null,
      startDate: now,
      expectedCompletion: null,
      createdAt: now,
      updatedAt: now,
    })

    expect(dto.reference).toBe('PROJ-B2C3D4E5')
    expect(dto.sourceRequestReference).toBe('REQ-A1B2C3D4')
    expect(dto.statusLabel).toBe('Planning')
    expect(dto).not.toHaveProperty('leadId')
    expect(dto).not.toHaveProperty('customerId')
    expect(dto).not.toHaveProperty('operationalPhase')
  })
})

describe('PROJECT_FULFILLMENT_STATUSES', () => {
  it('includes the fulfillment lifecycle set', () => {
    expect([...PROJECT_FULFILLMENT_STATUSES]).toEqual([
      'draft',
      'active',
      'on_hold',
      'completed',
      'cancelled',
    ])
  })
})
