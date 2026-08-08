export const routePaths = {
  home: '/',
  services: '/services',
  serviceDetail: '/services/:slug',
  solutions: '/solutions',
  work: '/work',
  about: '/about',
  insights: '/insights',
  contact: '/contact',
  privacy: '/privacy-policy',
  terms: '/terms',
  cookies: '/cookie-policy',
} as const

export type ServiceSlug =
  | 'web-development'
  | 'software-development'
  | 'mobile-app-development'
  | 'ecommerce-development'
  | 'ai-solutions'
  | 'ui-ux-design'
  | 'seo'
  | 'digital-marketing'
  | 'automation'
  | 'technology-consulting'

export const serviceSlugs: ServiceSlug[] = [
  'web-development',
  'software-development',
  'mobile-app-development',
  'ecommerce-development',
  'ai-solutions',
  'ui-ux-design',
  'seo',
  'digital-marketing',
  'automation',
  'technology-consulting',
]

export function servicePath(slug: ServiceSlug): string {
  return `/services/${slug}`
}

export const staticRoutes = [
  routePaths.home,
  routePaths.services,
  ...serviceSlugs.map(servicePath),
  routePaths.solutions,
  routePaths.work,
  routePaths.about,
  routePaths.insights,
  routePaths.contact,
  routePaths.privacy,
  routePaths.terms,
  routePaths.cookies,
] as const
