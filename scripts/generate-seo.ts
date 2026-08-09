/**
 * Writes public/sitemap.xml and public/robots.txt from src/config (single source of truth).
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCanonicalSiteUrl } from '@/config/canonical-site'
import { careersOpeningPath } from '@/config/routes'
import { getSitemapIndexablePaths } from '@/config/indexable-routes'
import { getSitemapXml } from '@/config/sitemap'
import { getRobotsTxt } from '@/config/robots'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(rootDir, '..')

function siteUrlFromEnv(): string {
  return resolveCanonicalSiteUrl()
}

/** Optional comma-separated job slugs for build-time sitemap (published openings). */
function careersOpeningsFromEnv(): string[] {
  const raw = process.env.SEO_CAREERS_OPENING_SLUGS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((slug) => careersOpeningPath(slug))
}

const siteUrl = siteUrlFromEnv()
const extraPaths = careersOpeningsFromEnv()
const pathCount = getSitemapIndexablePaths(extraPaths).length

writeFileSync(path.join(projectRoot, 'public/sitemap.xml'), getSitemapXml(siteUrl, extraPaths))
writeFileSync(path.join(projectRoot, 'public/robots.txt'), getRobotsTxt(siteUrl))

console.log(`SEO artifacts written for ${siteUrl} (${pathCount} URLs)`)
