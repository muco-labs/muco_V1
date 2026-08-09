import { resolveCanonicalSiteUrl } from '@/config/canonical-site'
import { getRobotsTxt } from '@/config/robots'
import { getSitemapXml } from '@/config/sitemap'
import { getSitemapIndexablePaths } from '@/config/indexable-routes'

export function resolveSeoSiteUrl(): string {
  return resolveCanonicalSiteUrl()
}

export function buildSeoArtifacts(siteUrl: string, extraPaths: string[] = []) {
  const robots = getRobotsTxt(siteUrl)
  const sitemap = getSitemapXml(siteUrl, extraPaths)
  return { robots, sitemap, urlCount: getSitemapIndexablePaths(extraPaths).length }
}

export function assertProductionSeoOrigin(siteUrl: string, robots: string, sitemap: string): void {
  const vercelEnv =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.VERCEL_ENV

  if (vercelEnv !== 'production') return

  if (siteUrl.includes('vercel.app')) {
    throw new Error(`Production SEO siteUrl must not use vercel.app (got ${siteUrl})`)
  }
  if (robots.includes('vercel.app') || sitemap.includes('vercel.app')) {
    throw new Error('Production SEO artifacts must not reference vercel.app')
  }
}
