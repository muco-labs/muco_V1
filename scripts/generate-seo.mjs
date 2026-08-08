/**
 * Generates public/sitemap.xml and public/robots.txt from indexable routes.
 * Keep service slugs and static paths aligned with src/config/indexable-routes.ts
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(rootDir, '..')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://mucolabs.com').replace(/\/$/, '')

const serviceSlugs = [
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

const portfolioIds = [
  'muco-labs-website',
  'muco-business-platform',
  'concept-commerce',
  'concept-ai-dashboard',
  'concept-saas',
  'concept-premium-site',
  'concept-mobile',
  'concept-automation',
]

const industrySlugs = ['manufacturing', 'ecommerce', 'healthcare', 'education', 'startups']

const indexablePaths = [
  '/',
  '/services',
  '/solutions',
  ...industrySlugs.map((slug) => `/solutions/${slug}`),
  ...serviceSlugs.map((slug) => `/services/${slug}`),
  '/work',
  ...portfolioIds.map((id) => `/work/${id}`),
  '/about',
  '/erode',
  '/erode/web-development',
  '/erode/software-development',
  '/erode/seo',
  '/tamil-nadu',
  '/india',
  '/international',
  '/contact',
  '/pricing',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
]

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexablePaths
  .map((routePath) => {
    const loc = routePath === '/' ? siteUrl : `${siteUrl}${routePath}`
    return `  <url><loc>${escapeXml(loc)}</loc></url>`
  })
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
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

writeFileSync(path.join(projectRoot, 'public/sitemap.xml'), sitemap)
writeFileSync(path.join(projectRoot, 'public/robots.txt'), robots)

console.log(`SEO artifacts written for ${siteUrl} (${indexablePaths.length} URLs)`)
