import { resolveCanonicalSiteUrl } from '@/config/canonical-site'

export function getRobotsTxt(siteUrl?: string): string {
  const origin = (siteUrl ?? resolveCanonicalSiteUrl()).replace(/\/$/, '')
  return `User-agent: *
Allow: /

Disallow: /app/
Disallow: /admin/
Disallow: /employee/
Disallow: /customer/
Disallow: /login/
Disallow: /signup/
Disallow: /auth/
Disallow: /team/
Disallow: /start-project/
Disallow: /freelancers/

Sitemap: ${origin}/sitemap.xml
`
}
