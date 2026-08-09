import { describe, expect, it } from 'vitest'
import {
  isMucoServiceSlug,
  listMucoServiceCatalog,
  resolveSkillSlug,
  resolveSubService,
} from './muco-service-catalog.js'
import {
  FREELANCER_PRICING_TYPES,
  isFreelancerPricingType,
  parseFreelancerPrice,
  validateFreelancerPricingFields,
} from './freelancer-pricing.js'
import { canFreelancerPublishActiveOfferings } from './freelancer-status.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'

describe('muco service catalog', () => {
  it('accepts intake service slugs', () => {
    expect(isMucoServiceSlug('web-development')).toBe(true)
    expect(isMucoServiceSlug('not-a-service')).toBe(false)
  })

  it('resolves sub-services from catalog delivers', () => {
    const sub = resolveSubService('web-development', 'responsive-ui')
    expect(sub?.label).toBe('Responsive UI')
    expect(resolveSubService('web-development', 'fake')).toBeNull()
  })

  it('resolves skills within service', () => {
    expect(resolveSkillSlug('seo', 'technical-audit')?.label).toBe('Technical audit')
  })

  it('lists services without empty other sub-services requirement', () => {
    const items = listMucoServiceCatalog()
    expect(items.some((i) => i.slug === 'web-development')).toBe(true)
  })
})

describe('freelancer pricing validation', () => {
  it('rejects negative prices', () => {
    expect(() => parseFreelancerPrice(-1)).toThrow()
  })

  it('requires base price for fixed pricing', () => {
    expect(() =>
      validateFreelancerPricingFields({
        pricingType: 'fixed',
        basePrice: null,
        minimumPrice: null,
        currency: 'INR',
      }),
    ).toThrow()
  })

  it('allows custom quote without base price', () => {
    const result = validateFreelancerPricingFields({
      pricingType: 'custom_quote',
      basePrice: null,
      minimumPrice: null,
      currency: 'USD',
    })
    expect(result.currency).toBe('USD')
  })

  it('rejects invalid currency', () => {
    expect(() =>
      validateFreelancerPricingFields({
        pricingType: 'custom_quote',
        basePrice: null,
        minimumPrice: null,
        currency: 'FAKE',
      }),
    ).toThrow()
  })

  it('includes all pricing types', () => {
    expect(FREELANCER_PRICING_TYPES).toContain('hourly')
    expect(isFreelancerPricingType('per_project')).toBe(true)
    expect(isFreelancerPricingType('invalid')).toBe(false)
  })
})

describe('service eligibility', () => {
  it('only approved freelancers may publish active offerings', () => {
    expect(canFreelancerPublishActiveOfferings('approved')).toBe(true)
    expect(canFreelancerPublishActiveOfferings('suspended')).toBe(false)
    expect(canFreelancerPublishActiveOfferings('under_review')).toBe(false)
  })
})

describe('RBAC and customer isolation', () => {
  it('customers cannot manage freelancers', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'freelancers.manage')).toBe(false)
    expect(hasPermission(customer, 'freelancers.view')).toBe(false)
  })

  it('freelancers have no admin permissions', () => {
    const fl = new Set(defaultRolePermissions.FREELANCER)
    expect(hasPermission(fl, 'freelancers.manage')).toBe(false)
  })

  it('customer project DTO stays freelancer-free', () => {
    const dto = serializeCustomerProjectSummary({
      id: '11111111-1111-1111-1111-111111111111',
      customerId: 'c1',
      leadId: null,
      proposalId: null,
      name: 'Website',
      description: null,
      service: 'web',
      status: 'active',
      startDate: null,
      expectedCompletion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    expect(JSON.stringify(dto)).not.toMatch(/freelancer/i)
    expect(JSON.stringify(dto)).not.toMatch(/basePrice/i)
  })
})
