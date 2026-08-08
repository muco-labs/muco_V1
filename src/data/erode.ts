import type { ServiceSlug } from '@/config/routes'
import { servicePath } from '@/config/routes'
import {
  erodeLocalServicePath,
  erodeLocalServiceSlugs,
  type ErodeLocalServiceSlug,
} from '@/content/erode/local-services'

export const erodePositioning = {
  headline: 'Technology from Erode, built for wider markets.',
  body: 'MUCO LABS works with businesses in Erode and Tamil Nadu—and partners nationally and internationally—with the same engineering and design standards.',
} as const

export const erodeServiceLinks: Array<{ label: string; slug: ServiceSlug; href: string }> = [
  { label: 'Website development in Erode', slug: 'web-development', href: erodeLocalServicePath('web-development') },
  { label: 'Software development in Erode', slug: 'software-development', href: erodeLocalServicePath('software-development') },
  { label: 'Mobile app development in Erode', slug: 'mobile-app-development', href: servicePath('mobile-app-development') },
  { label: 'AI solutions in Erode', slug: 'ai-solutions', href: servicePath('ai-solutions') },
  { label: 'SEO in Erode', slug: 'seo', href: erodeLocalServicePath('seo') },
  { label: 'Digital marketing in Erode', slug: 'digital-marketing', href: servicePath('digital-marketing') },
]

export function erodeServiceHref(slug: ServiceSlug): string {
  if ((erodeLocalServiceSlugs as readonly string[]).includes(slug)) {
    return erodeLocalServicePath(slug as ErodeLocalServiceSlug)
  }
  return servicePath(slug)
}

/** @deprecated Use erodeServiceLinks for navigable local service references. */
export const erodeServices = erodeServiceLinks.map((item) => item.label)
