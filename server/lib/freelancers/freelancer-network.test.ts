import { describe, expect, it } from 'vitest'
import {
  canFreelancerSetAvailability,
  canTransitionApproval,
  canTransitionVerification,
} from './freelancer-status.js'
import { parsePortfolioUrls } from './portfolio-url.js'
import { FREELANCER_SERVICE_CATEGORY_IDS } from './service-categories.js'
import { validateFreelancerServiceCategories } from '../validation/freelancers.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { hasPermission } from '../auth/permissions.js'
import { userCanJoinProjectTeam } from '../projects/project-team.js'

describe('freelancer verification transitions', () => {
  it('allows pending to verified', () => {
    expect(canTransitionVerification('pending', 'verified')).toBe(true)
  })

  it('blocks verified back to pending', () => {
    expect(canTransitionVerification('verified', 'pending')).toBe(false)
  })
})

describe('freelancer approval transitions', () => {
  it('allows under_review to approved', () => {
    expect(canTransitionApproval('under_review', 'approved')).toBe(true)
  })

  it('blocks rejected to approved without review', () => {
    expect(canTransitionApproval('rejected', 'approved')).toBe(false)
  })
})

describe('freelancer availability', () => {
  it('requires verified and approved', () => {
    expect(
      canFreelancerSetAvailability({ verificationStatus: 'verified', approvalStatus: 'approved' }),
    ).toBe(true)
    expect(
      canFreelancerSetAvailability({ verificationStatus: 'pending', approvalStatus: 'approved' }),
    ).toBe(false)
  })
})

describe('portfolio URL validation', () => {
  it('accepts https URLs', () => {
    const urls = parsePortfolioUrls(['https://example.com/work'])
    expect(urls[0]).toContain('https://example.com')
  })

  it('rejects javascript URLs', () => {
    expect(() => parsePortfolioUrls(['javascript:alert(1)'])).toThrow()
  })
})

describe('service categories', () => {
  it('validates known category ids', () => {
    expect(validateFreelancerServiceCategories(['website-development', 'seo'])).toBe(true)
    expect(validateFreelancerServiceCategories(['fake-category'])).toBe(false)
    expect(FREELANCER_SERVICE_CATEGORY_IDS.length).toBeGreaterThan(5)
  })
})

describe('freelancer RBAC', () => {
  it('grants manage to admin', () => {
    const admin = new Set(defaultRolePermissions.ADMIN)
    expect(hasPermission(admin, 'freelancers.manage')).toBe(true)
  })

  it('freelancer role has no admin freelancer permissions', () => {
    const fl = new Set(defaultRolePermissions.FREELANCER)
    expect(hasPermission(fl, 'freelancers.view')).toBe(false)
  })

  it('customers cannot manage freelancers', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'freelancers.manage')).toBe(false)
  })
})

describe('role isolation', () => {
  it('freelancer is not treated as internal employee team', () => {
    expect(userCanJoinProjectTeam(['FREELANCER'])).toBe(false)
  })
})
