import { describe, expect, it } from 'vitest'
import { resolveIssueBusinessRule } from './business-analysis-config.js'
import { buildBusinessAnalysis, computeBusinessOpportunityLevel } from './business-analysis.js'
import type { BusinessAnalysisIssueInput } from './business-analysis.js'

describe('issue business mapping', () => {
  it('maps Missing H1 to SEO-related services with medium priority', () => {
    const rule = resolveIssueBusinessRule('Missing H1 heading', 'content', 'medium')
    expect(rule.mucoServices).toContain('SEO')
    expect(rule.priority).toBe('medium')
    expect(rule.businessImpact.toLowerCase()).toContain('may')
  })

  it('maps No obvious CTA to conversion services', () => {
    const rule = resolveIssueBusinessRule('No obvious CTA detected', 'conversion', 'low')
    expect(rule.mucoServices).toContain('Conversion Optimization')
  })

  it('maps HTTPS site issue to security hardening', () => {
    const rule = resolveIssueBusinessRule('Site not served over HTTPS', 'security', 'high')
    expect(rule.priority).toBe('critical')
    expect(rule.mucoServices).toContain('Security Hardening')
  })
})

describe('business opportunity engine', () => {
  it('reduces opportunity level under low confidence', () => {
    const issues: BusinessAnalysisIssueInput[] = [
      {
        category: 'technicalSeo',
        severity: 'high',
        title: 'Missing page title',
        description: '',
        recommendation: '',
      },
      {
        category: 'technicalSeo',
        severity: 'high',
        title: 'Page marked noindex',
        description: '',
        recommendation: '',
      },
      {
        category: 'content',
        severity: 'medium',
        title: 'Missing H1 heading',
        description: '',
        recommendation: '',
      },
      {
        category: 'conversion',
        severity: 'low',
        title: 'No obvious CTA detected',
        description: '',
        recommendation: '',
      },
    ]
    const highConf = computeBusinessOpportunityLevel(issues, 'high', 10)
    const lowConf = computeBusinessOpportunityLevel(issues, 'low', 1)
    const rank = (l: string) =>
      ['very_low', 'low', 'moderate', 'high', 'very_high'].indexOf(l)
    expect(rank(lowConf.level)).toBeLessThanOrEqual(rank(highConf.level))
    expect(lowConf.explanation).toMatch(/crawl coverage is limited/i)
  })

  it('returns very_low when no meaningful issues', () => {
    const result = computeBusinessOpportunityLevel(
      [
        {
          category: 'technicalSeo',
          severity: 'informational',
          title: 'HTTP redirects to HTTPS',
          description: '',
          recommendation: '',
        },
      ],
      'high',
      5,
    )
    expect(result.level).toBe('very_low')
  })
})

describe('buildBusinessAnalysis', () => {
  const baseInput = {
    overallScore: 99,
    auditConfidence: 'low' as const,
    pagesCrawled: 1,
    pagesDiscovered: 1,
    coverageNote: 'Very few pages were analyzed.',
    crawlLimitations: 'Only one page was analyzed.',
    categoryScores: { performance: null },
    performanceMeasured: false,
  }

  it('is deterministic', () => {
    const issues: BusinessAnalysisIssueInput[] = [
      {
        category: 'content',
        severity: 'medium',
        title: 'Missing H1 heading',
        description: 'd',
        recommendation: 'r',
      },
      {
        category: 'conversion',
        severity: 'low',
        title: 'No obvious CTA detected',
        description: 'd',
        recommendation: 'r',
      },
    ]
    const a = buildBusinessAnalysis({ ...baseInput, issues })
    const b = buildBusinessAnalysis({ ...baseInput, issues })
    expect(a).toEqual(b)
  })

  it('includes low-confidence warnings for one-page KKB-like audits', () => {
    const report = buildBusinessAnalysis({
      ...baseInput,
      issues: [
        {
          category: 'content',
          severity: 'medium',
          title: 'Missing H1 heading',
          description: '',
          recommendation: '',
        },
        {
          category: 'conversion',
          severity: 'low',
          title: 'No obvious CTA detected',
          description: '',
          recommendation: '',
        },
      ],
    })
    expect(report.confidence.warning).toMatch(/limited crawl coverage/i)
    expect(report.limitations.some((l) => /one page/i.test(l))).toBe(true)
    expect(report.performanceStatus.measured).toBe(false)
    expect(report.performanceStatus.message).toMatch(/not measured/i)
    expect(report.issueInsights.find((i) => i.issueTitle === 'Missing H1 heading')).toBeTruthy()
  })

  it('does not invent performance issues when not measured', () => {
    const report = buildBusinessAnalysis({ ...baseInput, issues: [] })
    expect(report.performanceStatus.measured).toBe(false)
    expect(report.issueInsights.every((i) => i.category !== 'performance')).toBe(true)
  })

  it('elevates critical server errors in priorities', () => {
    const report = buildBusinessAnalysis({
      ...baseInput,
      auditConfidence: 'high',
      pagesCrawled: 8,
      issues: [
        {
          category: 'technicalSeo',
          severity: 'critical',
          title: 'Server error page in crawl',
          description: '',
          recommendation: '',
        },
      ],
    })
    expect(report.topPriorities[0]).toBe('Server error page in crawl')
    expect(report.serviceRecommendations.some((s) => s.service === 'Website Development')).toBe(true)
  })

  it('aggregates multiple categories into service recommendations', () => {
    const report = buildBusinessAnalysis({
      ...baseInput,
      auditConfidence: 'medium',
      pagesCrawled: 4,
      issues: [
        {
          category: 'technicalSeo',
          severity: 'medium',
          title: 'Missing meta description',
          description: '',
          recommendation: '',
        },
        {
          category: 'mobile',
          severity: 'high',
          title: 'Missing viewport meta tag',
          description: '',
          recommendation: '',
        },
      ],
    })
    expect(report.serviceRecommendations.length).toBeGreaterThan(1)
    expect(report.summary.keyFindingsCount).toBe(2)
  })

  it('handles empty issues with sales-safe summary', () => {
    const report = buildBusinessAnalysis({
      ...baseInput,
      auditConfidence: 'high',
      pagesCrawled: 10,
      issues: [],
    })
    expect(report.summary.keyFindingsCount).toBe(0)
    expect(report.opportunityLevel).toBe('very_low')
    expect(JSON.stringify(report)).not.toMatch(/revenue|competitor|penaliz/i)
  })
})

describe('export shape', () => {
  it('business analysis object includes required sections for JSON export', () => {
    const report = buildBusinessAnalysis({
      overallScore: 80,
      auditConfidence: 'medium',
      pagesCrawled: 3,
      pagesDiscovered: 5,
      coverageNote: null,
      crawlLimitations: null,
      categoryScores: {},
      performanceMeasured: false,
      issues: [],
    })
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('serviceRecommendations')
    expect(report).toHaveProperty('opportunityLevel')
    expect(report).toHaveProperty('issueInsights')
  })
})
