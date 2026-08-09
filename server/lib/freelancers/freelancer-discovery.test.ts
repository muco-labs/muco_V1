import { describe, expect, it } from 'vitest'
import {
  buildDiscoveryReasons,
  compareDiscoveryCandidates,
  DISCOVERY_HIGH_ACTIVE_TASK_THRESHOLD,
  normalizeProjectServiceToSlug,
  resolveDiscoveryMatchTier,
} from './freelancer-discovery.js'
import { freelancerDiscoverQuerySchema } from '../validation/freelancers.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'

describe('normalizeProjectServiceToSlug', () => {
  it('accepts canonical slugs', () => {
    expect(normalizeProjectServiceToSlug('web-development')).toBe('web-development')
  })

  it('maps intake titles', () => {
    expect(normalizeProjectServiceToSlug('Website Development')).toBe('web-development')
  })

  it('does not invent unknown services', () => {
    expect(normalizeProjectServiceToSlug('mystery consulting')).toBeNull()
  })
})

describe('discovery match tier and reasons', () => {
  it('prefers service + skill tier', () => {
    expect(
      resolveDiscoveryMatchTier({ serviceMatch: true, skillRequired: true, skillMatch: true }),
    ).toBe('service_and_skill')
  })

  it('builds explainable reasons', () => {
    const reasons = buildDiscoveryReasons({
      serviceMatch: true,
      skillRequired: true,
      skillMatch: true,
      availabilityStatus: 'limited',
      activeTaskCount: DISCOVERY_HIGH_ACTIVE_TASK_THRESHOLD,
      overdueTaskCount: 1,
      blockedTaskCount: 0,
      onProject: true,
      currentTaskAssignee: false,
      taskHasOtherAssignee: false,
    })
    expect(reasons).toContain('Service + skill match')
    expect(reasons).toContain('Limited availability')
    expect(reasons).toContain('Already on project')
    expect(reasons).toContain('High current workload')
  })

  it('does not penalize missing skill when not required', () => {
    const reasons = buildDiscoveryReasons({
      serviceMatch: true,
      skillRequired: false,
      skillMatch: false,
      availabilityStatus: 'available',
      activeTaskCount: 0,
      overdueTaskCount: 0,
      blockedTaskCount: 0,
      onProject: false,
      currentTaskAssignee: false,
      taskHasOtherAssignee: false,
    })
    expect(reasons).toContain('Service match')
    expect(reasons.some((r) => r.includes('skill'))).toBe(false)
  })
})

describe('discovery candidate ordering', () => {
  it('orders service+skill before service-only', () => {
    const sorted = [
      {
        matchTier: 'service_only' as const,
        availabilityStatus: 'available',
        activeTaskCount: 0,
        displayName: 'Zed',
      },
      {
        matchTier: 'service_and_skill' as const,
        availabilityStatus: 'limited',
        activeTaskCount: 5,
        displayName: 'Amy',
      },
    ].sort(compareDiscoveryCandidates)
    expect(sorted[0].displayName).toBe('Amy')
  })
})

describe('discovery query validation', () => {
  it('rejects invalid uuid projectId', () => {
    const parsed = freelancerDiscoverQuerySchema.safeParse({ projectId: 'not-a-uuid' })
    expect(parsed.success).toBe(false)
  })
})

describe('discovery RBAC', () => {
  it('admin can discover', () => {
    const admin = new Set(defaultRolePermissions.ADMIN)
    expect(hasPermission(admin, 'freelancers.view')).toBe(true)
  })

  it('customer cannot discover', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'freelancers.view')).toBe(false)
  })

  it('freelancer cannot discover', () => {
    const fl = new Set(defaultRolePermissions.FREELANCER)
    expect(hasPermission(fl, 'freelancers.view')).toBe(false)
  })
})

describe('customer DTO isolation', () => {
  it('customer project summary has no discovery fields', () => {
    const dto = serializeCustomerProjectSummary({
      id: '00000000-0000-4000-8000-000000000099',
      customerId: 'c1',
      leadId: null,
      proposalId: null,
      name: 'Website',
      description: null,
      service: 'web-development',
      status: 'active',
      startDate: null,
      expectedCompletion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    const json = JSON.stringify(dto)
    expect(json).not.toMatch(/discover/i)
    expect(json).not.toMatch(/basePrice/i)
  })
})
