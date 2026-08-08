import { describe, expect, it } from 'vitest'
import { createProductWaitlistSchema } from '../../lib/validation/product-waitlist.js'
import {
  assertOrganizationScope,
  roleMeetsMinimum,
} from './tenant-scope.js'

describe('createProductWaitlistSchema', () => {
  it('accepts valid client-hub waitlist payload', () => {
    const parsed = createProductWaitlistSchema.safeParse({
      productSlug: 'client-hub',
      email: 'founder@example.com',
      fullName: 'Alex',
      company: 'Studio',
      useCase: 'Share deliverables with clients',
      marketingConsent: true,
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown product slug', () => {
    const parsed = createProductWaitlistSchema.safeParse({
      productSlug: 'unknown-saas',
      email: 'a@b.com',
      marketingConsent: true,
    })
    expect(parsed.success).toBe(false)
  })
})

describe('tenant scope helpers', () => {
  it('denies cross-organization access', () => {
    expect(assertOrganizationScope('org-a', 'org-b')).toBe(false)
    expect(assertOrganizationScope('org-a', 'org-a')).toBe(true)
  })

  it('enforces role hierarchy', () => {
    expect(roleMeetsMinimum('owner', 'admin')).toBe(true)
    expect(roleMeetsMinimum('member', 'admin')).toBe(false)
  })
})
