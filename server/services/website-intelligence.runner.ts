import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  wiAuditEvents,
  wiAuditIssues,
  wiAuditMetrics,
  wiAuditPages,
  wiAudits,
} from '../db/schema.js'
import { analyzeSiteContext, computeOpportunityLevel, type IssueDraft } from '../lib/website-intelligence/analyze.js'
import { crawlWebsite } from '../lib/website-intelligence/crawler.js'
import { createPerformanceProvider } from '../lib/website-intelligence/performance-provider.js'
import {
  computeCategoryScore,
  computeOverallScore,
  type ScoreCategory,
} from '../lib/website-intelligence/scoring-config.js'

async function logEvent(auditId: string, event: string, detail?: string) {
  const db = getDb()
  if (!db) return
  await db.insert(wiAuditEvents).values({ auditId, event, detail: detail ?? null })
}

async function setPhase(auditId: string, phase: string) {
  const db = getDb()
  if (!db) return
  await db.update(wiAudits).set({ progressPhase: phase }).where(eq(wiAudits.id, auditId))
}

function groupIssuesByCategory(issues: IssueDraft[]): Record<ScoreCategory, Record<string, number>> {
  const map: Record<ScoreCategory, Record<string, number>> = {
    technicalSeo: {},
    content: {},
    accessibility: {},
    performance: {},
    mobile: {},
    security: {},
    conversion: {},
  }
  const categoryMap: Record<string, ScoreCategory> = {
    technicalSeo: 'technicalSeo',
    content: 'content',
    accessibility: 'accessibility',
    performance: 'performance',
    mobile: 'mobile',
    security: 'security',
    conversion: 'conversion',
  }
  for (const issue of issues) {
    const cat = categoryMap[issue.category] ?? 'technicalSeo'
    map[cat][issue.severity] = (map[cat][issue.severity] ?? 0) + 1
  }
  return map
}

export async function runWebsiteAuditJob(auditId: string): Promise<void> {
  const db = getDb()
  if (!db) return

  const [audit] = await db.select().from(wiAudits).where(eq(wiAudits.id, auditId)).limit(1)
  if (!audit) return
  if (audit.status === 'cancelled' || audit.status === 'completed') return

  await db
    .update(wiAudits)
    .set({ status: 'running', startedAt: new Date(), errorMessage: null })
    .where(eq(wiAudits.id, auditId))

  await logEvent(auditId, 'audit.started')
  const seedUrl = new URL(audit.normalizedUrl)

  try {
    await setPhase(auditId, 'Discovering website...')
    await logEvent(auditId, 'crawl.started')
    const crawl = await crawlWebsite(seedUrl)

    await setPhase(auditId, 'Scanning pages...')
    for (const page of crawl.pages) {
      await db.insert(wiAuditPages).values({
        auditId,
        url: page.url,
        statusCode: page.statusCode,
        title: page.parsed?.title ?? null,
        metaDescription: page.parsed?.metaDescription ?? null,
        canonical: page.parsed?.canonical ?? null,
        h1Texts: page.parsed ? JSON.stringify(page.parsed.h1Texts) : null,
        headings: page.parsed ? JSON.stringify(page.parsed.headings) : null,
        wordCount: page.parsed?.wordCount ?? null,
        internalLinks: page.parsed ? JSON.stringify(page.parsed.internalLinks.slice(0, 50)) : null,
        externalLinks: page.parsed ? JSON.stringify(page.parsed.externalLinks.slice(0, 30)) : null,
        imageCount: page.parsed?.imageCount ?? null,
        imagesMissingAlt: page.parsed?.imagesMissingAlt ?? null,
        robotsNoindex: page.parsed?.robotsNoindex ?? false,
        htmlLang: page.parsed?.htmlLang ?? null,
        viewportMeta: page.parsed?.viewportMeta ?? false,
        ogPresent: page.parsed?.ogPresent ?? false,
        twitterCardPresent: page.parsed?.twitterCardPresent ?? false,
        structuredDataTypes: page.parsed
          ? JSON.stringify(page.parsed.structuredDataTypes)
          : null,
        contentType: page.contentType,
        responseTimeMs: page.responseTimeMs,
      })
      await logEvent(auditId, 'page.scanned', page.url)
    }

    await setPhase(auditId, 'Checking SEO & content...')
    const issues = analyzeSiteContext({
      seedUrl: crawl.seedUrl,
      finalUrl: crawl.finalUrl,
      isHttps: crawl.isHttps,
      robotsTxtFound: crawl.robotsTxtFound,
      sitemapUrls: crawl.sitemapUrls,
      pages: crawl.pages.map((p) => ({
        url: p.url,
        statusCode: p.statusCode,
        parsed: p.parsed,
      })),
    })

    await setPhase(auditId, 'Analyzing performance...')
    const perf = createPerformanceProvider()
    let performanceScore: number | null = null
    if (perf.isConfigured()) {
      const measurement = await perf.measure(crawl.finalUrl.toString())
      performanceScore = measurement?.performanceScore ?? null
      if (measurement) {
        await db.insert(wiAuditMetrics).values({
          auditId,
          category: 'performance',
          metricKey: 'provider',
          metricValue: measurement.provider,
          measured: true,
        })
        if (performanceScore != null) {
          await db.insert(wiAuditMetrics).values({
            auditId,
            category: 'performance',
            metricKey: 'performance_score',
            metricValue: String(performanceScore),
            measured: true,
          })
        }
      }
    } else {
      await db.insert(wiAuditMetrics).values({
        auditId,
        category: 'performance',
        metricKey: 'status',
        metricValue: 'Performance provider not configured',
        measured: false,
      })
    }

    await setPhase(auditId, 'Generating report...')
    for (const issue of issues) {
      await db.insert(wiAuditIssues).values({
        auditId,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        affectedUrls: JSON.stringify(issue.affectedUrls),
        evidence: JSON.stringify(issue.evidence),
        recommendation: issue.recommendation,
      })
      await logEvent(auditId, 'issue.detected', issue.title)
    }

    const grouped = groupIssuesByCategory(issues)
    const categoryScores: Partial<Record<ScoreCategory, number | null>> = {
      technicalSeo: computeCategoryScore(100, grouped.technicalSeo),
      content: computeCategoryScore(100, grouped.content),
      accessibility: computeCategoryScore(100, grouped.accessibility),
      mobile: computeCategoryScore(100, grouped.mobile),
      security: computeCategoryScore(100, grouped.security),
      conversion: computeCategoryScore(100, grouped.conversion),
      performance: performanceScore,
    }

    const overall = computeOverallScore(categoryScores)
    const opportunityLevel = computeOpportunityLevel(issues)
    const opportunityScore = issues.reduce((acc, i) => {
      if (i.severity === 'critical') return acc + 8
      if (i.severity === 'high') return acc + 5
      if (i.severity === 'medium') return acc + 2
      if (i.severity === 'low') return acc + 1
      return acc
    }, 0)

    await db
      .update(wiAudits)
      .set({
        status: 'completed',
        completedAt: new Date(),
        progressPhase: 'Completed',
        overallScore: overall,
        categoryScores: JSON.stringify(categoryScores),
        opportunityLevel,
        opportunityScore,
      })
      .where(eq(wiAudits.id, auditId))

    await logEvent(auditId, 'audit.completed')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit failed'
    await db
      .update(wiAudits)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: message,
        progressPhase: 'Failed',
      })
      .where(eq(wiAudits.id, auditId))
    await logEvent(auditId, 'audit.failed', message)
  }
}

export function scheduleWebsiteAuditJob(auditId: string) {
  setImmediate(() => {
    void runWebsiteAuditJob(auditId)
  })
}
