import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isFreelancerEligibleForProjectAssignment } from './freelancer-status.js'
import { isFreelancerOpenForNewAssignments } from './freelancer-availability.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { ASSIGNMENT_REQUIRES_CONFIRMATION } from './freelancer-assignment-workflow.js'
import { isMucoServiceSlug } from './muco-service-catalog.js'
import { validateFreelancerPricingFields } from './freelancer-pricing.js'

const migrationsDir = join(process.cwd(), 'server', 'db', 'migrations')

describe('freelancer migration chain', () => {
  const expected = [
    '0025_freelancer_network.sql',
    '0026_project_freelancers.sql',
    '0027_freelancer_services_skills.sql',
    '0028_freelancer_availability_capacity.sql',
  ]

  for (const file of expected) {
    it(`includes ${file}`, () => {
      expect(existsSync(join(migrationsDir, file))).toBe(true)
    })
  }
})

describe('centralized assignment eligibility', () => {
  const approved = {
    approvalStatus: 'approved',
    verificationStatus: 'verified',
    userId: 'u1',
    userStatus: 'active',
    availabilityStatus: 'available',
    openToProjects: true,
  } as const

  it('blocks unapproved freelancers from new assignment eligibility', () => {
    expect(isFreelancerEligibleForProjectAssignment({ ...approved, approvalStatus: 'suspended' })).toBe(
      false,
    )
  })

  it('blocks unavailable from open-for-assignment helper', () => {
    expect(isFreelancerOpenForNewAssignments('unavailable')).toBe(false)
    expect(
      isFreelancerEligibleForProjectAssignment({ ...approved, availabilityStatus: 'unavailable' }),
    ).toBe(false)
  })

  it('allows limited availability for new assignment', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...approved, availabilityStatus: 'limited' }),
    ).toBe(true)
  })
})

describe('customer isolation', () => {
  it('customer project DTO excludes freelancer operational fields', () => {
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
    const json = JSON.stringify(dto).toLowerCase()
    expect(json).not.toMatch(/freelancer/)
    expect(json).not.toMatch(/workload/)
    expect(json).not.toMatch(/baseprice/)
    expect(json).not.toMatch(/availability/)
  })
})

describe('RBAC boundaries', () => {
  it('freelancer cannot access admin freelancer APIs', () => {
    const fl = new Set(defaultRolePermissions.FREELANCER)
    expect(hasPermission(fl, 'freelancers.view')).toBe(false)
    expect(hasPermission(fl, 'freelancers.manage')).toBe(false)
    expect(hasPermission(fl, 'projects.assign')).toBe(false)
  })

  it('customer has no project assign or freelancer view', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'projects.assign')).toBe(false)
    expect(hasPermission(customer, 'freelancers.view')).toBe(false)
  })
})

describe('service catalog and pricing validation', () => {
  it('rejects unknown service slugs for offerings', () => {
    expect(isMucoServiceSlug('not-a-real-service')).toBe(false)
    expect(isMucoServiceSlug('web-development')).toBe(true)
  })

  it('rejects invalid pricing currency server-side', () => {
    expect(() =>
      validateFreelancerPricingFields({
        pricingType: 'fixed',
        basePrice: '100.00',
        minimumPrice: null,
        currency: 'FAKE',
      }),
    ).toThrow()
  })
})

describe('assignment workflow does not auto-persist', () => {
  it('requires explicit confirmation in admin UI contract', () => {
    expect(ASSIGNMENT_REQUIRES_CONFIRMATION).toBe(true)
  })
})

describe('assignment persistence entry points', () => {
  it('project assignment service uses eligibility before insert', () => {
    const source = readFileSync(
      join(process.cwd(), 'server', 'services', 'project-freelancer-assignment.service.ts'),
      'utf8',
    )
    expect(source).toContain('assertFreelancerEligibleForProjectAssignment')
    expect(source).toContain("action: 'freelancer.project_assigned'")
  })

  it('task assignment service uses centralized task eligibility helper', () => {
    const source = readFileSync(join(process.cwd(), 'server', 'services', 'project-tasks.service.ts'), 'utf8')
    expect(source).toContain('assertFreelancerEligibleForTaskAssignment')
    expect(source).toContain("action: 'freelancer.task_assigned'")
  })

  it('discovery service does not insert project_freelancers or tasks', () => {
    const source = readFileSync(
      join(process.cwd(), 'server', 'services', 'freelancer-discovery.service.ts'),
      'utf8',
    )
    expect(source).not.toMatch(/insert\s*\(/)
    expect(source).not.toContain('project_freelancers')
  })
})
