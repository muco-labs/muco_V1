import { parseHtmlPage } from './html-parser.js'
import { discoverUrlsFromSitemaps, assertSafeRedirectChain } from './sitemap.js'
import { assertSafeResolvedHost, canonicalizeCrawlUrl } from './url-security.js'

export type CrawlConfig = {
  maxPages: number
  maxDepth: number
  requestTimeoutMs: number
  delayMs: number
  userAgent: string
}

export const defaultCrawlConfig: CrawlConfig = {
  maxPages: Number.parseInt(process.env.WI_MAX_PAGES ?? '15', 10) || 15,
  maxDepth: Number.parseInt(process.env.WI_MAX_DEPTH ?? '2', 10) || 2,
  requestTimeoutMs: Number.parseInt(process.env.WI_REQUEST_TIMEOUT_MS ?? '15000', 10) || 15_000,
  delayMs: Number.parseInt(process.env.WI_CRAWL_DELAY_MS ?? '500', 10) || 500,
  userAgent: process.env.WI_USER_AGENT ?? 'MUCO-Website-Intelligence/1.0 (+https://mucolabs.com)',
}

export type CrawledPage = {
  url: string
  statusCode: number | null
  contentType: string | null
  responseTimeMs: number | null
  html: string | null
  parsed?: ReturnType<typeof parseHtmlPage>
  error?: string
}

export type CrawlResult = {
  seedUrl: URL
  finalUrl: URL
  isHttps: boolean
  robotsTxtFound: boolean
  robotsDisallowAll: boolean
  sitemapUrls: string[]
  sitemapWasHtmlFallback: boolean
  pagesDiscovered: number
  internalLinksFound: number
  pages: CrawledPage[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isLikelyHtmlDocument(body: string, contentType: string | null): boolean {
  if (contentType?.includes('text/html')) return true
  const trimmed = body.trimStart().toLowerCase()
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
}

async function fetchWithSafeRedirects(
  url: URL,
  config: CrawlConfig,
): Promise<{ response: Response; finalUrl: URL }> {
  return assertSafeRedirectChain(url, async (current) => {
    await assertSafeResolvedHost(current.hostname)
    return fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(config.requestTimeoutMs),
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml,text/xml,*/*',
      },
    })
  })
}

function parseRobots(txt: string): { disallowAll: boolean; sitemaps: string[] } {
  const sitemaps: string[] = []
  let disallowAll = false
  for (const line of txt.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().startsWith('sitemap:')) {
      sitemaps.push(trimmed.slice(8).trim())
    }
    if (/^disallow:\s*\/\s*$/i.test(trimmed)) {
      disallowAll = true
    }
  }
  return { disallowAll, sitemaps }
}

export async function crawlWebsite(seedUrl: URL, config: Partial<CrawlConfig> = {}): Promise<CrawlResult> {
  const cfg = { ...defaultCrawlConfig, ...config }
  await assertSafeResolvedHost(seedUrl.hostname)

  const initial = await fetchWithSafeRedirects(seedUrl, cfg)
  const finalUrl = initial.finalUrl
  await assertSafeResolvedHost(finalUrl.hostname)

  const isHttps = finalUrl.protocol === 'https:'
  let robotsTxtFound = false
  let robotsDisallowAll = false
  const sitemapUrls: string[] = []
  let sitemapWasHtmlFallback = false

  try {
    const robotsUrl = new URL('/robots.txt', finalUrl.origin)
    const robotsRes = await fetchWithSafeRedirects(robotsUrl, cfg)
    if (robotsRes.response.ok) {
      robotsTxtFound = true
      const text = await robotsRes.response.text()
      const parsed = parseRobots(text)
      robotsDisallowAll = parsed.disallowAll
      sitemapUrls.push(...parsed.sitemaps)
    }
  } catch {
    /* ignore */
  }

  if (!sitemapUrls.length) {
    for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
      try {
        const sm = new URL(path, finalUrl.origin)
        const res = await fetchWithSafeRedirects(sm, cfg)
        if (res.response.ok) {
          sitemapUrls.push(sm.toString())
          const body = await res.response.text()
          if (isLikelyHtmlDocument(body, res.response.headers.get('content-type'))) {
            sitemapWasHtmlFallback = true
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  const pages: CrawledPage[] = []
  const seen = new Set<string>()
  const queue: Array<{ url: string; depth: number }> = [{ url: finalUrl.toString(), depth: 0 }]
  let sitemapDiscoveredCount = 0

  if (!robotsDisallowAll && sitemapUrls.length > 0) {
    const fromSitemap = await discoverUrlsFromSitemaps(sitemapUrls, finalUrl, async (smUrl) => {
      const res = await fetchWithSafeRedirects(smUrl, cfg)
      const body = await res.response.text()
      const contentType = res.response.headers.get('content-type')
      if (isLikelyHtmlDocument(body, contentType)) {
        sitemapWasHtmlFallback = true
      }
      return { body, contentType }
    })
    sitemapDiscoveredCount = fromSitemap.length
    for (const url of fromSitemap) {
      if (!seen.has(url) && !queue.some((q) => q.url === url)) {
        queue.push({ url, depth: 1 })
      }
    }
  }

  const pagesDiscovered = Math.max(queue.length, sitemapDiscoveredCount, 1)
  let internalLinksFound = 0

  while (queue.length > 0 && pages.length < cfg.maxPages) {
    const next = queue.shift()!
    if (seen.has(next.url)) continue
    seen.add(next.url)

    if (next.depth > cfg.maxDepth) continue

    const pageUrl = new URL(next.url)
    const started = Date.now()
    try {
      const { response: res, finalUrl: pageFinal } = await fetchWithSafeRedirects(pageUrl, cfg)
      const responseTimeMs = Date.now() - started
      const contentType = res.headers.get('content-type')
      const statusCode = res.status
      let html: string | null = null
      let parsed: ReturnType<typeof parseHtmlPage> | undefined

      if (contentType?.includes('text/html') && res.ok) {
        html = await res.text()
        if (html.length > 1_500_000) html = html.slice(0, 1_500_000)
        parsed = parseHtmlPage(html, pageFinal)
        internalLinksFound += parsed.internalLinks.length

        if (next.depth < cfg.maxDepth && !robotsDisallowAll) {
          for (const link of parsed.internalLinks) {
            const canon = canonicalizeCrawlUrl(finalUrl, link)
            if (canon && !seen.has(canon)) {
              queue.push({ url: canon, depth: next.depth + 1 })
            }
          }
        }
      }

      pages.push({
        url: next.url,
        statusCode,
        contentType,
        responseTimeMs,
        html: null,
        parsed,
      })
    } catch (error) {
      pages.push({
        url: next.url,
        statusCode: null,
        contentType: null,
        responseTimeMs: Date.now() - started,
        html: null,
        error: error instanceof Error ? error.message : 'Fetch failed',
      })
    }

    if (cfg.delayMs > 0) await sleep(cfg.delayMs)
  }

  const discoveredTotal = Math.max(pagesDiscovered, seen.size + queue.length, pages.length)

  return {
    seedUrl,
    finalUrl,
    isHttps,
    robotsTxtFound,
    robotsDisallowAll,
    sitemapUrls,
    sitemapWasHtmlFallback,
    pagesDiscovered: discoveredTotal,
    internalLinksFound,
    pages,
  }
}
