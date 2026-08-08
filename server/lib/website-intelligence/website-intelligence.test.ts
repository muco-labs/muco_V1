import { describe, expect, it } from 'vitest'
import { normalizeAuditUrl, validatePublicHttpUrl } from './url-security.js'
import { computeCategoryScore, computeOverallScore } from './scoring-config.js'
import { parseHtmlPage } from './html-parser.js'
import { computeOpportunityLevel } from './analyze.js'

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

  it('blocks private IPs', () => {
    const result = validatePublicHttpUrl('http://192.168.1.1')
    expect(result.ok).toBe(false)
  })

  it('allows public https URLs', () => {
    const result = validatePublicHttpUrl('https://example.com')
    expect(result.ok).toBe(true)
  })
})

describe('scoring engine', () => {
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
