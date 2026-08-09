import { startProjectPaths } from '@/config/start-project'
import { pageSeo } from '@/config/seo'
import { routePaths, serviceSlugs, servicePath } from '@/config/routes'
import { erodeLocalServiceSlugs, erodeLocalServicePath } from '@/content/erode/local-services'
import { industrySolutionSlugs, industrySolutionPath } from '@/content/solutions/industries'
import { portfolioProjects } from '@/data/portfolio'
import { workPath } from '@/data/portfolio'

/** Public routes that should appear in sitemap and receive index,follow metadata. */
export const indexablePaths: string[] = [
  pageSeo.home.path,
  pageSeo.services.path,
  pageSeo.solutions.path,
  ...industrySolutionSlugs.map((slug) => industrySolutionPath(slug)),
  ...serviceSlugs.map(servicePath),
  pageSeo.work.path,
  ...portfolioProjects.map((project) => workPath(project.id)),
  pageSeo.erode.path,
  ...erodeLocalServiceSlugs.map((slug) => erodeLocalServicePath(slug)),
  pageSeo.tamilNadu.path,
  pageSeo.india.path,
  pageSeo.international.path,
  pageSeo.products.path,
  pageSeo.clientHubProduct.path,
  pageSeo.about.path,
  pageSeo.contact.path,
  pageSeo.careers.path,
  pageSeo.careersApply.path,
  pageSeo.pricing.path,
  pageSeo.privacy.path,
  pageSeo.terms.path,
  pageSeo.cookies.path,
]

/** Deduplicated paths for sitemap.xml (static + optional build-time extras such as job openings). */
export function getSitemapIndexablePaths(additionalPaths: string[] = []): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const routePath of [...indexablePaths, ...additionalPaths]) {
    if (seen.has(routePath)) continue
    seen.add(routePath)
    ordered.push(routePath)
  }
  return ordered
}

export const nonIndexablePathPrefixes = [
  '/auth/',
  '/app/',
  '/admin/',
  '/employee/',
  '/customer/',
  '/team/',
  '/login/',
  '/signup/',
  '/freelancers/',
] as const

const nonIndexableExactPaths = new Set<string>([
  pageSeo.notFound.path,
  pageSeo.insights.path,
  routePaths.authSignIn,
  routePaths.authSignUp,
  routePaths.freelancersApply,
  startProjectPaths.entry,
])

export function isIndexablePath(pathname: string): boolean {
  const path = pathname.split('?')[0]?.split('#')[0] ?? pathname
  if (nonIndexableExactPaths.has(path)) {
    return false
  }
  if (path === '/404') {
    return false
  }
  if (path.startsWith(startProjectPaths.flow) || path.startsWith('/app/start-project')) {
    return false
  }
  return !nonIndexablePathPrefixes.some((prefix) => path.startsWith(prefix))
}
