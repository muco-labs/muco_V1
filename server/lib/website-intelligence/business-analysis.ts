import type { IssueSeverity } from './analyze.js'
import type { AuditConfidence } from './crawl-coverage.js'
import { type MucoServiceName, resolveIssueBusinessRule } from './business-analysis-config.js'

export type BusinessOpportunityLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'

export type BusinessAnalysisIssueInput = {
  category: string
  severity: IssueSeverity
  title: string
  description: string
  recommendation: string
}

export type BusinessAnalysisInput = {
  issues: BusinessAnalysisIssueInput[]
  overallScore: number | null
  auditConfidence: AuditConfidence | null
  pagesCrawled: number | null
  pagesDiscovered: number | null
  coverageNote: string | null
  crawlLimitations: string | null
  categoryScores: Record<string, number | null>
  performanceMeasured: boolean
}

export type IssueBusinessInsight = {
  issueTitle: string
  category: string
  scannerSeverity: IssueSeverity
  priority: IssueSeverity
  businessImpact: string
  recommendedAction: string
  mucoServices: MucoServiceName[]
}

export type ServiceRecommendation = {
  service: MucoServiceName
  reason: string
  relatedIssueTitles: string[]
  priority: IssueSeverity
  confidence: AuditConfidence | null
}

export type BusinessAnalysisSummary = {
  websiteHealth: number | null
  crawlConfidence: AuditConfidence | null
  pagesAnalyzed: number | null
  keyFindingsCount: number
  topOpportunityServices: MucoServiceName[]
  topPriorityTitle: string | null
  importantLimitation: string | null
}

export type BusinessAnalysisReport = {
  summary: BusinessAnalysisSummary
  confidence: {
    level: AuditConfidence | null
    warning: string | null
  }
  opportunityLevel: BusinessOpportunityLevel
  opportunityExplanation: string
  issueInsights: IssueBusinessInsight[]
  serviceRecommendations: ServiceRecommendation[]
  topPriorities: string[]
  limitations: string[]
  performanceStatus: {
    measured: boolean
    message: string
  }
}

const POSITIVE_OR_LIMITATION_TITLES = new Set([
  'HTTP redirects to HTTPS',
  'Limited crawl coverage',
])

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = {
  critical: 12,
  high: 7,
  medium: 3,
  low: 1,
  informational: 0,
}

const PRIORITY_RANK: Record<IssueSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  informational: 1,
}

function meaningfulIssues(issues: BusinessAnalysisIssueInput[]): BusinessAnalysisIssueInput[] {
  return issues.filter((i) => !POSITIVE_OR_LIMITATION_TITLES.has(i.title))
}

export function computeBusinessOpportunityLevel(
  issues: BusinessAnalysisIssueInput[],
  auditConfidence: AuditConfidence | null,
  pagesCrawled: number | null,
): { level: BusinessOpportunityLevel; explanation: string } {
  const meaningful = meaningfulIssues(issues)
  let points = 0
  const categories = new Set<string>()

  for (const issue of meaningful) {
    points += SEVERITY_WEIGHT[issue.severity]
    categories.add(issue.category)
    if (issue.category === 'conversion') points += 1
    if (issue.category === 'technicalSeo' && issue.severity !== 'low') points += 1
  }

  if (categories.size >= 3) points += 3
  if (categories.size >= 5) points += 2

  let level: BusinessOpportunityLevel = 'very_low'
  if (points >= 40) level = 'very_high'
  else if (points >= 28) level = 'high'
  else if (points >= 16) level = 'moderate'
  else if (points >= 8) level = 'low'
  else level = 'very_low'

  if (meaningful.length === 0) {
    return {
      level: 'very_low',
      explanation: 'Few actionable findings were detected on scanned pages; opportunity may still exist on unscanned areas.',
    }
  }

  if (auditConfidence === 'low' || (pagesCrawled != null && pagesCrawled <= 1)) {
    if (level === 'very_high') level = 'high'
    else if (level === 'high') level = 'moderate'
    else if (level === 'moderate') level = 'low'
    return {
      level,
      explanation:
        'Opportunity level is tempered because crawl coverage is limited; additional pages may contain further findings.',
    }
  }

  if (auditConfidence === 'medium') {
    if (level === 'very_high') level = 'high'
    return {
      level,
      explanation: 'Opportunity reflects scanned pages; broader crawling could change the assessment.',
    }
  }

  return {
    level,
    explanation: 'Opportunity is based on issues detected during the crawl and their severity distribution.',
  }
}

function buildConfidenceWarning(confidence: AuditConfidence | null, pagesCrawled: number | null): string | null {
  if (confidence === 'low') {
    return 'Business opportunity assessment is based on limited crawl coverage.'
  }
  if (pagesCrawled != null && pagesCrawled <= 1) {
    return 'Only 1 page was analyzed. Additional pages may contain issues that were not detected.'
  }
  if (confidence === 'medium') {
    return 'Several pages were analyzed, but the full site may not be represented.'
  }
  return null
}

function aggregateServiceRecommendations(
  insights: IssueBusinessInsight[],
  confidence: AuditConfidence | null,
): ServiceRecommendation[] {
  const map = new Map<MucoServiceName, { titles: Set<string>; maxPriority: IssueSeverity; reasons: string[] }>()

  for (const insight of insights) {
    if (POSITIVE_OR_LIMITATION_TITLES.has(insight.issueTitle)) continue
    for (const service of insight.mucoServices) {
      const entry = map.get(service) ?? {
        titles: new Set<string>(),
        maxPriority: 'informational' as IssueSeverity,
        reasons: [],
      }
      entry.titles.add(insight.issueTitle)
      if (PRIORITY_RANK[insight.priority] > PRIORITY_RANK[entry.maxPriority]) {
        entry.maxPriority = insight.priority
      }
      map.set(service, entry)
    }
  }

  const recommendations: ServiceRecommendation[] = []
  for (const [service, entry] of map) {
    const count = entry.titles.size
    const reason =
      count === 1
        ? `One scanned finding suggests a potential opportunity related to ${service}.`
        : `Several scanned findings (${count}) may relate to ${service}; further review is recommended.`
    recommendations.push({
      service,
      reason,
      relatedIssueTitles: [...entry.titles],
      priority: entry.maxPriority,
      confidence,
    })
  }

  recommendations.sort((a, b) => {
    const pr = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
    if (pr !== 0) return pr
    return b.relatedIssueTitles.length - a.relatedIssueTitles.length
  })

  return recommendations
}

export function buildBusinessAnalysis(input: BusinessAnalysisInput): BusinessAnalysisReport {
  const {
    issues,
    overallScore,
    auditConfidence,
    pagesCrawled,
    coverageNote,
    crawlLimitations,
    performanceMeasured,
  } = input

  const issueInsights: IssueBusinessInsight[] = issues.map((issue) => {
    const rule = resolveIssueBusinessRule(issue.title, issue.category, issue.severity)
    return {
      issueTitle: issue.title,
      category: issue.category,
      scannerSeverity: issue.severity,
      priority: rule.priority,
      businessImpact: rule.businessImpact,
      recommendedAction: rule.recommendedAction,
      mucoServices: rule.mucoServices,
    }
  })

  const meaningful = meaningfulIssues(issues)
  const { level: opportunityLevel, explanation: opportunityExplanation } = computeBusinessOpportunityLevel(
    issues,
    auditConfidence,
    pagesCrawled,
  )

  const serviceRecommendations = aggregateServiceRecommendations(issueInsights, auditConfidence)

  const topPriorities = [...issueInsights]
    .filter((i) => !POSITIVE_OR_LIMITATION_TITLES.has(i.issueTitle))
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, 5)
    .map((i) => i.issueTitle)

  const limitations: string[] = []
  const confidenceWarning = buildConfidenceWarning(auditConfidence, pagesCrawled)
  if (confidenceWarning) limitations.push(confidenceWarning)
  if (coverageNote?.trim()) limitations.push(coverageNote.trim())
  if (crawlLimitations?.trim()) limitations.push(crawlLimitations.trim())
  if (pagesCrawled != null && pagesCrawled <= 1) {
    limitations.push('Only one page was analyzed; scores and opportunities reflect that page only.')
  }

  const topOpportunityServices = serviceRecommendations.slice(0, 3).map((s) => s.service)

  const performanceStatus = performanceMeasured
    ? { measured: true, message: 'Performance was measured for this audit.' }
    : {
        measured: false,
        message:
          'Performance data not measured. A performance assessment requires a configured measurement source (for example PageSpeed Insights API key).',
      }

  return {
    summary: {
      websiteHealth: overallScore,
      crawlConfidence: auditConfidence,
      pagesAnalyzed: pagesCrawled,
      keyFindingsCount: meaningful.length,
      topOpportunityServices,
      topPriorityTitle: topPriorities[0] ?? null,
      importantLimitation: limitations[0] ?? null,
    },
    confidence: {
      level: auditConfidence,
      warning: confidenceWarning,
    },
    opportunityLevel,
    opportunityExplanation,
    issueInsights,
    serviceRecommendations,
    topPriorities,
    limitations: [...new Set(limitations)],
    performanceStatus,
  }
}
