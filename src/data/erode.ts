import type { ServiceSlug } from '@/config/routes'
import { servicePath } from '@/config/routes'

export const erodePositioning = {
  headline: 'Technology from Erode, built for wider markets.',
  body: 'MUCO LABS works with businesses in Erode and Tamil Nadu—and partners nationally and internationally—with the same engineering and design standards.',
} as const

export const erodeServiceLinks: Array<{ label: string; slug: ServiceSlug }> = [
  { label: 'Website development in Erode', slug: 'web-development' },
  { label: 'Software development in Erode', slug: 'software-development' },
  { label: 'Mobile app development in Erode', slug: 'mobile-app-development' },
  { label: 'AI solutions in Erode', slug: 'ai-solutions' },
  { label: 'SEO in Erode', slug: 'seo' },
  { label: 'Digital marketing in Erode', slug: 'digital-marketing' },
]

export function erodeServiceHref(slug: ServiceSlug): string {
  return servicePath(slug)
}

/** @deprecated Use erodeServiceLinks for navigable local service references. */
export const erodeServices = erodeServiceLinks.map((item) => item.label)
