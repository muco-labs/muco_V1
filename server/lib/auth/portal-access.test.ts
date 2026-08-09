import { describe, expect, it } from 'vitest'
import { resolvePortalAccessFlags } from './portal-access.js'

describe('resolvePortalAccessFlags', () => {
  it('denies freelancer portal without approved status', () => {
    const flags = resolvePortalAccessFlags({
      roles: ['FREELANCER'],
      freelancerApprovalStatus: 'under_review',
    })
    expect(flags.freelancer).toBe(false)
    expect(flags.customer).toBe(false)
  })

  it('allows freelancer portal when role and approval match', () => {
    const flags = resolvePortalAccessFlags({
      roles: ['FREELANCER'],
      freelancerApprovalStatus: 'approved',
    })
    expect(flags.freelancer).toBe(true)
  })

  it('denies freelancer portal when role missing even if approved', () => {
    const flags = resolvePortalAccessFlags({
      roles: ['CUSTOMER'],
      freelancerApprovalStatus: 'approved',
    })
    expect(flags.freelancer).toBe(false)
  })

  it('preserves admin and employee separation', () => {
    expect(
      resolvePortalAccessFlags({ roles: ['EMPLOYEE'], freelancerApprovalStatus: null }).admin,
    ).toBe(false)
    expect(
      resolvePortalAccessFlags({ roles: ['ADMIN'], freelancerApprovalStatus: null }).admin,
    ).toBe(true)
  })
})
