import { env } from '@/config/env'

export function getRobotsTxt(siteUrl = env.siteUrl): string {
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

Sitemap: ${siteUrl}/sitemap.xml
`
}
