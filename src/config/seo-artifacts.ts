import { resolveCanonicalSiteUrl } from '@/config/canonical-site'
import { isProductionDeploy } from '@/config/deploy-env'
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
  if (!isProductionDeploy()) return

  const bannedHosts = ['vercel.app', 'netlify.app']
  for (const host of bannedHosts) {
    if (siteUrl.includes(host)) {
      throw new Error(`Production SEO siteUrl must not use ${host} (got ${siteUrl})`)
    }
    if (robots.includes(host) || sitemap.includes(host)) {
      throw new Error(`Production SEO artifacts must not reference ${host}`)
    }
  }
}
