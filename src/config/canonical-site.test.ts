import { describe, expect, it, vi, afterEach } from 'vitest'
import { getRobotsTxt } from '@/config/robots'
import { getSitemapXml } from '@/config/sitemap'
import {
  DEFAULT_CANONICAL_SITE_URL,
  resolveCanonicalSiteUrl,
} from './canonical-site'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('canonical-site', () => {
  it('uses www production host', () => {
    expect(DEFAULT_CANONICAL_SITE_URL).toBe('https://www.mucolabs.com')
  })

  it('forces www on production deploy even when VITE_SITE_URL is staging', () => {
    expect(
      resolveCanonicalSiteUrl({
        viteSiteUrl: 'https://muco-v1.vercel.app',
        deployEnv: 'production',
      }),
    ).toBe('https://www.mucolabs.com')
  })

  it('forces www when Netlify CONTEXT is production', () => {
    expect(
      resolveCanonicalSiteUrl({
        viteSiteUrl: 'https://deploy-preview-1--example.netlify.app',
        context: 'production',
      }),
    ).toBe('https://www.mucolabs.com')
  })

  it('allows preview override for staging QA', () => {
    expect(
      resolveCanonicalSiteUrl({
        viteSiteUrl: 'https://muco-v1.vercel.app',
        deployEnv: 'preview',
      }),
    ).toBe('https://muco-v1.vercel.app')
  })

  it('defaults to www when env is empty', () => {
    expect(resolveCanonicalSiteUrl({ viteSiteUrl: '', deployEnv: 'development' })).toBe(
      'https://www.mucolabs.com',
    )
  })

  it('production SEO artifacts never include muco-v1.vercel.app', () => {
    const siteUrl = resolveCanonicalSiteUrl({
      viteSiteUrl: 'https://muco-v1.vercel.app',
      deployEnv: 'production',
    })
    const robots = getRobotsTxt(siteUrl)
    const sitemap = getSitemapXml(siteUrl)
    expect(robots).not.toContain('muco-v1.vercel.app')
    expect(sitemap).not.toContain('muco-v1.vercel.app')
    expect(robots).toContain('https://www.mucolabs.com/sitemap.xml')
    expect(sitemap).toContain('https://www.mucolabs.com/services')
  })
})
