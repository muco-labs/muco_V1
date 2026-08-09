import { assertSafeResolvedHost, canonicalizeCrawlUrl } from './url-security.js'

const MAX_SITEMAP_URLS = 200
const MAX_SITEMAP_FETCH = 5

function extractLocTags(xml: string): string[] {
  const urls: string[] = []
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/gi
  let match: RegExpExecArray | null
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim())
  }
  return urls
}

function isLikelyXmlSitemap(body: string, contentType: string | null): boolean {
  if (contentType?.includes('xml')) return true
  const trimmed = body.trimStart()
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<urlset') || trimmed.startsWith('<sitemapindex')
}

export async function discoverUrlsFromSitemaps(
  sitemapUrls: string[],
  siteOrigin: URL,
  fetchText: (url: URL) => Promise<{ body: string; contentType: string | null }>,
): Promise<string[]> {
  const discovered = new Set<string>()
  const toFetch = [...sitemapUrls].slice(0, MAX_SITEMAP_FETCH)

  for (const raw of toFetch) {
    try {
      const smUrl = new URL(raw, siteOrigin)
      if (smUrl.hostname.toLowerCase() !== siteOrigin.hostname.toLowerCase()) continue
      const { body, contentType } = await fetchText(smUrl)
      if (!isLikelyXmlSitemap(body, contentType)) continue

      if (body.includes('<sitemapindex')) {
        const childSitemaps = extractLocTags(body).slice(0, MAX_SITEMAP_FETCH)
        for (const child of childSitemaps) {
          try {
            const childUrl = new URL(child, siteOrigin)
            const childFetch = await fetchText(childUrl)
            if (!isLikelyXmlSitemap(childFetch.body, childFetch.contentType)) continue
            for (const loc of extractLocTags(childFetch.body)) {
              const canon = canonicalizeCrawlUrl(siteOrigin, loc)
              if (canon) discovered.add(canon)
              if (discovered.size >= MAX_SITEMAP_URLS) return [...discovered]
            }
          } catch {
            /* skip child */
          }
        }
      } else {
        for (const loc of extractLocTags(body)) {
          const canon = canonicalizeCrawlUrl(siteOrigin, loc)
          if (canon) discovered.add(canon)
          if (discovered.size >= MAX_SITEMAP_URLS) break
        }
      }
    } catch {
      /* skip invalid sitemap */
    }
  }

  return [...discovered]
}

export async function assertSafeRedirectChain(
  start: URL,
  fetchOnce: (url: URL) => Promise<Response>,
  maxHops = 6,
): Promise<{ response: Response; finalUrl: URL }> {
  let current = start
  for (let hop = 0; hop < maxHops; hop++) {
    await assertSafeResolvedHost(current.hostname)
    const response = await fetchOnce(current)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        return { response, finalUrl: current }
      }
      current = new URL(location, current)
      continue
    }
    return { response, finalUrl: current }
  }
  throw new Error('Too many redirects')
}
