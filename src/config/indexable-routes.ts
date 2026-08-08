import { pageSeo } from '@/config/seo'
import { routePaths, serviceSlugs, servicePath } from '@/config/routes'
import { insightArticles } from '@/data/insights'

/** Public routes that should appear in sitemap and receive index,follow metadata. */
export const indexablePaths: string[] = [
  pageSeo.home.path,
  pageSeo.services.path,
  ...serviceSlugs.map(servicePath),
  pageSeo.solutions.path,
  pageSeo.work.path,
  pageSeo.about.path,
  pageSeo.insights.path,
  ...insightArticles.map((article) => article.path),
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
  '/login/',
  '/signup/',
] as const

export function isIndexablePath(path: string): boolean {
  if (path === '/404' || path === routePaths.authSignIn || path === routePaths.authSignUp) {
    return false
  }
  return !nonIndexablePathPrefixes.some((prefix) => path.startsWith(prefix))
}
