import { describe, expect, it } from 'vitest'
import { customerNavMore, customerNavPrimary, customerPortalPaths } from '@/config/customer-portal'

describe('customer portal navigation', () => {
  it('exposes core delivery paths in primary nav', () => {
    const paths = customerNavPrimary.map((item) => item.path)
    expect(paths).toContain(customerPortalPaths.root)
    expect(paths).toContain(customerPortalPaths.projects)
    expect(paths).toContain(customerPortalPaths.proposals)
    expect(paths).toContain(customerPortalPaths.payments)
    expect(paths).toContain(customerPortalPaths.files)
    expect(paths).toContain(customerPortalPaths.messages)
    expect(paths).toContain(customerPortalPaths.profile)
  })

  it('keeps start project and settings in More', () => {
    const morePaths = customerNavMore.map((item) => item.path)
    expect(morePaths).toContain(customerPortalPaths.startProject)
    expect(morePaths).toContain(customerPortalPaths.settings)
    expect(morePaths).not.toContain(customerPortalPaths.files)
  })
})
