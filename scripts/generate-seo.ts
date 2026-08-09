/**
 * Writes public/sitemap.xml and public/robots.txt from src/config (single source of truth).
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { careersOpeningPath } from '@/config/routes'
import {
  assertProductionSeoOrigin,
  buildSeoArtifacts,
  resolveSeoSiteUrl,
} from '@/config/seo-artifacts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(rootDir, '..')

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

const siteUrl = resolveSeoSiteUrl()
const extraPaths = careersOpeningsFromEnv()
const { robots, sitemap, urlCount } = buildSeoArtifacts(siteUrl, extraPaths)

assertProductionSeoOrigin(siteUrl, robots, sitemap)

writeFileSync(path.join(projectRoot, 'public/sitemap.xml'), sitemap)
writeFileSync(path.join(projectRoot, 'public/robots.txt'), robots)

console.log(`SEO artifacts written for ${siteUrl} (${urlCount} URLs)`)
