import type { ServiceSlug } from '@/config/routes'
import { servicePath } from '@/config/routes'
import { routePaths } from '@/config/routes'

export type KeywordIntent = 'navigational' | 'commercial' | 'transactional' | 'informational' | 'local'

export type KeywordMapping = {
  /** Representative query cluster — not an exact-match target list. */
  cluster: string
  intent: KeywordIntent
  primaryPath: string
  notes?: string
}

/**
 * Strategic keyword-to-URL map. One primary URL per intent cluster to avoid cannibalization.
 * Validate volume and SERP fit with Search Console / keyword tools in production.
 */
export const keywordPageMap: KeywordMapping[] = [
  { cluster: 'MUCO Labs / brand', intent: 'navigational', primaryPath: routePaths.home },
  { cluster: 'MUCO Labs Erode', intent: 'local', primaryPath: routePaths.erode },
  {
    cluster: 'website / web development company',
    intent: 'commercial',
    primaryPath: servicePath('web-development'),
  },
  {
    cluster: 'software development company',
    intent: 'commercial',
    primaryPath: servicePath('software-development'),
  },
  {
    cluster: 'mobile app development company',
    intent: 'commercial',
    primaryPath: servicePath('mobile-app-development'),
  },
  {
    cluster: 'UI UX design company',
    intent: 'commercial',
    primaryPath: servicePath('ui-ux-design'),
  },
  {
    cluster: 'SaaS / custom software / CRM',
    intent: 'commercial',
    primaryPath: servicePath('software-development'),
    notes: 'CRM and SaaS fold into software-development unless a dedicated page is justified later.',
  },
  {
    cluster: 'ecommerce development',
    intent: 'commercial',
    primaryPath: servicePath('ecommerce-development'),
  },
  {
    cluster: 'AI development / automation',
    intent: 'commercial',
    primaryPath: servicePath('ai-solutions'),
  },
  {
    cluster: 'SEO company / services',
    intent: 'commercial',
    primaryPath: servicePath('seo'),
  },
  {
    cluster: 'digital marketing',
    intent: 'commercial',
    primaryPath: servicePath('digital-marketing'),
  },
  {
    cluster: 'web/software development Erode / Tamil Nadu',
    intent: 'local',
    primaryPath: routePaths.erode,
  },
  {
    cluster: 'website cost / pricing',
    intent: 'informational',
    primaryPath: routePaths.pricing,
    notes: 'Pairs with FAQ; future insights articles can support long-tail.',
  },
  {
    cluster: 'start project / contact',
    intent: 'transactional',
    primaryPath: routePaths.contact,
  },
  {
    cluster: 'portfolio / work samples',
    intent: 'commercial',
    primaryPath: routePaths.work,
  },
]

export function primaryPathForService(slug: ServiceSlug): string {
  return servicePath(slug)
}
