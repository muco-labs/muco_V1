/**
 * Smoke test: crawl + analyze a public URL (no database).
 * Usage: npx tsx scripts/wi-smoke-audit.ts [url]
 */
import { crawlWebsite } from '../server/lib/website-intelligence/crawler.js'
import { analyzeSiteContext, computeOpportunityLevel } from '../server/lib/website-intelligence/analyze.js'
import { computeAuditCoverage } from '../server/lib/website-intelligence/crawl-coverage.js'
import { computeCategoryScore, computeOverallScore } from '../server/lib/website-intelligence/scoring-config.js'
import { validatePublicHttpUrl } from '../server/lib/website-intelligence/url-security.js'
import { buildBusinessAnalysis } from '../server/lib/website-intelligence/business-analysis.js'

const target = process.argv[2] ?? 'https://kkbstore.com/'

const validated = validatePublicHttpUrl(target)
if (!validated.ok) {
  console.error(validated.error)
  process.exit(1)
}

console.log('Starting crawl for', validated.url.toString())
const crawl = await crawlWebsite(validated.url, { maxPages: 10, maxDepth: 2 })
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

const grouped: Record<string, Record<string, number>> = {}
for (const issue of issues) {
  grouped[issue.category] ??= {}
  grouped[issue.category][issue.severity] = (grouped[issue.category][issue.severity] ?? 0) + 1
}

const categoryScores = {
  technicalSeo: computeCategoryScore(100, grouped.technicalSeo ?? {}),
  content: computeCategoryScore(100, grouped.content ?? {}),
  accessibility: computeCategoryScore(100, grouped.accessibility ?? {}),
  mobile: computeCategoryScore(100, grouped.mobile ?? {}),
  security: computeCategoryScore(100, grouped.security ?? {}),
  conversion: computeCategoryScore(100, grouped.conversion ?? {}),
  performance: null as number | null,
}

const overall = computeOverallScore(categoryScores)
const opportunity = computeOpportunityLevel(issues)
const pagesCrawled = crawl.pages.length
const coverage = computeAuditCoverage({
  pagesCrawled,
  pagesDiscovered: crawl.pagesDiscovered,
  sitemapUrlCount: crawl.sitemapUrls.length,
  internalLinksOnPages: crawl.internalLinksFound,
  robotsDisallowAll: crawl.robotsDisallowAll,
  sitemapWasHtmlFallback: crawl.sitemapWasHtmlFallback,
})

const businessAnalysis = buildBusinessAnalysis({
  issues,
  overallScore: overall,
  auditConfidence: coverage.confidence,
  pagesCrawled,
  pagesDiscovered: crawl.pagesDiscovered,
  coverageNote: coverage.coverageNote,
  crawlLimitations: coverage.crawlLimitations,
  categoryScores,
  performanceMeasured: false,
})

console.log(
  JSON.stringify(
    {
      target: validated.url.toString(),
      finalUrl: crawl.finalUrl.toString(),
      pagesDiscovered: crawl.pagesDiscovered,
      pagesCrawled,
      sitemapUrls: crawl.sitemapUrls,
      sitemapWasHtmlFallback: crawl.sitemapWasHtmlFallback,
      internalLinksFound: crawl.internalLinksFound,
      issueCount: issues.length,
      overallScore: overall,
      auditConfidence: coverage.confidence,
      coverageLabel: coverage.coverageLabel,
      crawlLimitations: coverage.crawlLimitations,
      categoryScores,
      opportunityLevel: opportunity,
      businessOpportunityLevel: businessAnalysis.opportunityLevel,
      businessAnalysisSummary: businessAnalysis.summary,
      topBusinessPriorities: businessAnalysis.topPriorities,
      mucoServiceRecommendations: businessAnalysis.serviceRecommendations.map((s) => ({
        service: s.service,
        priority: s.priority,
      })),
      performanceNote: 'Not measured unless PAGESPEED_INSIGHTS_API_KEY is set in full audit job',
      sampleIssues: issues.slice(0, 8).map((i) => ({
        severity: i.severity,
        title: i.title,
      })),
    },
    null,
    2,
  ),
)
