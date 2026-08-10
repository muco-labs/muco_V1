import { describe, expect, it } from 'vitest'

describe('decorative R3F scenes', () => {
  it('default exports load without error', async () => {
    const modules = [
      import('./HeroAuroraScene'),
      import('./ServiceConstellationScene'),
      import('./TechnologyLatticeScene'),
      import('./ProductCoreScene'),
      import('./FounderDepthScene'),
    ]
    const loaded = await Promise.all(modules)
    for (const mod of loaded) {
      expect(mod.default).toBeTypeOf('function')
    }
  })
})
