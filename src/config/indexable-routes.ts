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
  pageSeo.about.path,
  pageSeo.contact.path,
  pageSeo.pricing.path,
  pageSeo.privacy.path,
  pageSeo.terms.path,
  pageSeo.cookies.path,
]

export const nonIndexablePathPrefixes = [
  '/auth/',
  '/app/',
  '/admin/',
  '/employee/',
  '/customer/',
  '/team/',
  '/login/',
  '/signup/',
] as const

export function isIndexablePath(path: string): boolean {
  if (path === '/404' || path === routePaths.authSignIn || path === routePaths.authSignUp) {
    return false
  }
  return !nonIndexablePathPrefixes.some((prefix) => path.startsWith(prefix))
}
