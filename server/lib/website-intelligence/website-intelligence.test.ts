import { describe, expect, it } from 'vitest'
import { normalizeAuditUrl, validatePublicHttpUrl, isBlockedIp } from './url-security.js'
import { computeCategoryScore, computeOverallScore, scoreCategoryWeights } from './scoring-config.js'
import { parseHtmlPage } from './html-parser.js'
import { computeOpportunityLevel } from './analyze.js'
import { computeAuditCoverage } from './crawl-coverage.js'
import { discoverUrlsFromSitemaps } from './sitemap.js'

describe('URL validation', () => {
  it('normalizes bare domains to https', () => {
    const url = normalizeAuditUrl('example.com')
    expect(url.protocol).toBe('https:')
    expect(url.hostname).toBe('example.com')
  })

  it('blocks localhost', () => {
    const result = validatePublicHttpUrl('http://localhost/test')
    expect(result.ok).toBe(false)
  })

  it('blocks 127.0.0.1', () => {
    expect(validatePublicHttpUrl('http://127.0.0.1').ok).toBe(false)
  })

  it('blocks private IPs', () => {
    const result = validatePublicHttpUrl('http://192.168.1.1')
    expect(result.ok).toBe(false)
  })

  it('blocks file protocol', () => {
    expect(validatePublicHttpUrl('file:///etc/passwd').ok).toBe(false)
  })

  it('blocks metadata hostnames', () => {
    expect(validatePublicHttpUrl('http://metadata.google.internal').ok).toBe(false)
  })

  it('allows public https URLs', () => {
    const result = validatePublicHttpUrl('https://example.com')
    expect(result.ok).toBe(true)
  })

  it('flags private IPv6', () => {
    expect(isBlockedIp('::1')).toBe(true)
    expect(isBlockedIp('fc00::1')).toBe(true)
  })
})

describe('scoring engine', () => {
  it('category weights sum to 1', () => {
    const sum = Object.values(scoreCategoryWeights).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('perfect category when no issues', () => {
    expect(computeCategoryScore(100, {})).toBe(100)
  })

  it('reduces score based on severity', () => {
    const score = computeCategoryScore(100, { high: 2, medium: 1 })
    expect(score).toBeLessThan(100)
  })

  it('skips unmeasured categories in overall score', () => {
    const overall = computeOverallScore({
      technicalSeo: 80,
      content: 70,
      performance: null,
    })
    expect(overall).not.toBeNull()
  })

  it('renormalizes weights when performance is excluded', () => {
    const withPerf = computeOverallScore({
      technicalSeo: 100,
      content: 100,
      accessibility: 100,
      mobile: 100,
      security: 100,
      conversion: 100,
      performance: 0,
    })
    const withoutPerf = computeOverallScore({
      technicalSeo: 100,
      content: 100,
      accessibility: 100,
      mobile: 100,
      security: 100,
      conversion: 100,
      performance: null,
    })
    expect(withoutPerf).toBe(100)
    expect(withPerf).toBeLessThan(100)
  })

  it('returns null overall when no categories measured', () => {
    expect(computeOverallScore({ performance: null })).toBeNull()
  })

  it('is deterministic for the same inputs', () => {
    const input = {
      technicalSeo: 88,
      content: 92,
      accessibility: 90,
      mobile: 95,
      security: 100,
      conversion: 85,
      performance: null,
    }
    expect(computeOverallScore(input)).toBe(computeOverallScore(input))
  })
})

describe('audit coverage confidence', () => {
  it('marks single-page audits as low confidence', () => {
    const result = computeAuditCoverage({
      pagesCrawled: 1,
      pagesDiscovered: 1,
      sitemapUrlCount: 1,
      internalLinksOnPages: 0,
      robotsDisallowAll: false,
      sitemapWasHtmlFallback: true,
    })
    expect(result.confidence).toBe('low')
    expect(result.coverageLabel).toContain('single page')
  })
})

describe('sitemap ingestion', () => {
  it('parses XML urlset loc entries on same host', async () => {
    const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://example.com/about</loc></url>
      <url><loc>https://other.com/nope</loc></url>
    </urlset>`
    const urls = await discoverUrlsFromSitemaps(
      ['https://example.com/sitemap.xml'],
      new URL('https://example.com'),
      async () => ({ body: xml, contentType: 'application/xml' }),
    )
    expect(urls).toEqual(['https://example.com/about'])
  })

  it('ignores HTML served as sitemap', async () => {
    const urls = await discoverUrlsFromSitemaps(
      ['https://example.com/sitemap.xml'],
      new URL('https://example.com'),
      async () => ({
        body: '<!doctype html><html><body>SPA</body></html>',
        contentType: 'text/html',
      }),
    )
    expect(urls).toEqual([])
  })
})

describe('html parser', () => {
  it('detects missing title and meta', () => {
    const parsed = parseHtmlPage('<html><body><h1>Hi</h1></body></html>', new URL('https://a.com'))
    expect(parsed.title).toBeNull()
    expect(parsed.h1Texts).toEqual(['Hi'])
  })
})

describe('opportunity level', () => {
  it('returns high for many severe issues', () => {
    const level = computeOpportunityLevel([
      {
        category: 'technicalSeo',
        severity: 'critical',
        title: 'a',
        description: 'b',
        affectedUrls: [],
        evidence: {},
        recommendation: 'c',
      },
      {
        category: 'technicalSeo',
        severity: 'high',
        title: 'a',
        description: 'b',
        affectedUrls: [],
        evidence: {},
        recommendation: 'c',
      },
    ])
    expect(['medium', 'high']).toContain(level)
  })
})
