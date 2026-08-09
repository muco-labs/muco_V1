import { env } from '@/config/env'
import { getSitemapIndexablePaths } from '@/config/indexable-routes'

export function getSitemapXml(siteUrl = env.siteUrl, additionalPaths: string[] = []): string {
  const urls = getSitemapIndexablePaths(additionalPaths)
    .map((path) => {
      const loc = path === '/' ? siteUrl : `${siteUrl}${path}`
      return `  <url><loc>${escapeXml(loc)}</loc></url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
