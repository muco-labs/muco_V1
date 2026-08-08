/**
 * Smoke test: crawl + analyze a public URL (no database).
 * Usage: npx tsx scripts/wi-smoke-audit.ts [url]
 */
import { crawlWebsite } from '../server/lib/website-intelligence/crawler.js'
import { analyzeSiteContext, computeOpportunityLevel } from '../server/lib/website-intelligence/analyze.js'
import { computeCategoryScore, computeOverallScore } from '../server/lib/website-intelligence/scoring-config.js'
import { validatePublicHttpUrl } from '../server/lib/website-intelligence/url-security.js'

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

console.log(
  JSON.stringify(
    {
      target: validated.url.toString(),
      finalUrl: crawl.finalUrl.toString(),
      pagesCrawled: crawl.pages.length,
      issueCount: issues.length,
      overallScore: overall,
      categoryScores,
      opportunityLevel: opportunity,
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
