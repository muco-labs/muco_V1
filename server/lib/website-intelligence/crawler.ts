import { parseHtmlPage } from './html-parser.js'
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
  pages: CrawledPage[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchSafe(url: URL, config: CrawlConfig): Promise<Response> {
  await assertSafeResolvedHost(url.hostname)
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(config.requestTimeoutMs),
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'text/html,application/xhtml+xml',
    },
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

  const start = Date.now()
  const initial = await fetchSafe(seedUrl, cfg)
  const finalUrl = new URL(initial.url)
  await assertSafeResolvedHost(finalUrl.hostname)

  const isHttps = finalUrl.protocol === 'https:'
  let robotsTxtFound = false
  let robotsDisallowAll = false
  const sitemapUrls: string[] = []

  try {
    const robotsUrl = new URL('/robots.txt', finalUrl.origin)
    const robotsRes = await fetchSafe(robotsUrl, cfg)
    if (robotsRes.ok) {
      robotsTxtFound = true
      const text = await robotsRes.text()
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
        const res = await fetchSafe(sm, cfg)
        if (res.ok) sitemapUrls.push(sm.toString())
      } catch {
        /* ignore */
      }
    }
  }

  const pages: CrawledPage[] = []
  const seen = new Set<string>()
  const queue: Array<{ url: string; depth: number }> = [{ url: finalUrl.toString(), depth: 0 }]

  while (queue.length > 0 && pages.length < cfg.maxPages) {
    const next = queue.shift()!
    if (seen.has(next.url)) continue
    seen.add(next.url)

    if (next.depth > cfg.maxDepth) continue

    const pageUrl = new URL(next.url)
    const started = Date.now()
    try {
      await assertSafeResolvedHost(pageUrl.hostname)
      const res = await fetchSafe(pageUrl, cfg)
      const responseTimeMs = Date.now() - started
      const contentType = res.headers.get('content-type')
      const statusCode = res.status
      let html: string | null = null
      let parsed: ReturnType<typeof parseHtmlPage> | undefined

      if (contentType?.includes('text/html') && res.ok) {
        html = await res.text()
        if (html.length > 1_500_000) html = html.slice(0, 1_500_000)
        parsed = parseHtmlPage(html, pageUrl)

        if (next.depth < cfg.maxDepth) {
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

  if (robotsDisallowAll && pages.length <= 1) {
    // Respect broad disallow — keep seed only
  }

  void start
  return {
    seedUrl,
    finalUrl,
    isHttps,
    robotsTxtFound,
    robotsDisallowAll,
    sitemapUrls,
    pages,
  }
}
