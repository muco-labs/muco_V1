import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertProductionSeoOrigin, buildSeoArtifacts } from './seo-artifacts'

describe('seo-artifacts', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('production robots and sitemap never reference muco-v1 when DEPLOY_ENV=production', () => {
    vi.stubEnv('DEPLOY_ENV', 'production')
    vi.stubEnv('VITE_SITE_URL', 'https://muco-v1.vercel.app')

    const { robots, sitemap } = buildSeoArtifacts('https://www.mucolabs.com')
    expect(robots).toContain('Sitemap: https://www.mucolabs.com/sitemap.xml')
    expect(robots).not.toContain('muco-v1.vercel.app')
    expect(sitemap).not.toContain('muco-v1.vercel.app')
    expect(() => assertProductionSeoOrigin('https://www.mucolabs.com', robots, sitemap)).not.toThrow()
  })

  it('throws when production artifacts still contain vercel.app', () => {
    vi.stubEnv('DEPLOY_ENV', 'production')
    expect(() =>
      assertProductionSeoOrigin(
        'https://www.mucolabs.com',
        'Sitemap: https://muco-v1.vercel.app/sitemap.xml',
        '<loc>https://www.mucolabs.com</loc>',
      ),
    ).toThrow(/vercel\.app/)
  })

  it('preview may keep staging host in artifacts when explicitly passed', () => {
    vi.stubEnv('DEPLOY_ENV', 'preview')
    const { robots } = buildSeoArtifacts('https://muco-v1.vercel.app')
    expect(robots).toContain('Sitemap: https://muco-v1.vercel.app/sitemap.xml')
  })
})
