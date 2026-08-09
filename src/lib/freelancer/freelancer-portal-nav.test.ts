import { describe, expect, it } from 'vitest'
import { freelancerNavMore, freelancerNavPrimary, freelancerPortalPaths } from '@/config/freelancer-portal'

describe('freelancer portal navigation', () => {
  it('prioritizes work and offerings in primary nav', () => {
    const paths = freelancerNavPrimary.map((item) => item.path)
    expect(paths).toContain(freelancerPortalPaths.root)
    expect(paths).toContain(freelancerPortalPaths.tasks)
    expect(paths).toContain(freelancerPortalPaths.projects)
    expect(paths).toContain(freelancerPortalPaths.services)
    expect(paths).toContain(freelancerPortalPaths.availability)
    expect(paths).not.toContain(freelancerPortalPaths.profile)
  })

  it('keeps profile in More', () => {
    expect(freelancerNavMore.map((item) => item.path)).toContain(freelancerPortalPaths.profile)
  })
})
