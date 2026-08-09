export type AuditConfidence = 'high' | 'medium' | 'low'

export type CoverageInput = {
  pagesCrawled: number
  pagesDiscovered: number
  sitemapUrlCount: number
  internalLinksOnPages: number
  robotsDisallowAll: boolean
  sitemapWasHtmlFallback: boolean
}

export type CoverageResult = {
  confidence: AuditConfidence
  coverageLabel: string
  coverageNote: string
  crawlLimitations: string
}

export function computeAuditCoverage(input: CoverageInput): CoverageResult {
  const {
    pagesCrawled,
    pagesDiscovered,
    sitemapUrlCount,
    internalLinksOnPages,
    robotsDisallowAll,
    sitemapWasHtmlFallback,
  } = input

  void sitemapUrlCount

  const limitations: string[] = []

  if (robotsDisallowAll) {
    limitations.push('robots.txt disallows broad crawling; only the entry URL was analyzed.')
  }

  if (sitemapWasHtmlFallback) {
    limitations.push(
      'Sitemap path returned HTML (common on SPAs), not XML — sitemap URLs were not ingested.',
    )
  }

  if (internalLinksOnPages === 0 && pagesCrawled > 0) {
    limitations.push(
      'No same-host links found in static HTML — site may rely on JavaScript navigation (headless crawl not in Phase 1).',
    )
  }

  const effectiveDiscovered = Math.max(pagesDiscovered, pagesCrawled)

  let confidence: AuditConfidence = 'low'
  if (pagesCrawled >= 8 && effectiveDiscovered > 0 && pagesCrawled / effectiveDiscovered >= 0.4) {
    confidence = 'high'
  } else if (pagesCrawled >= 3 || (effectiveDiscovered >= 5 && pagesCrawled >= 2)) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  if (pagesCrawled <= 1) {
    confidence = 'low'
    limitations.push('Only one page was analyzed; scores reflect that page, not the full site.')
  }

  const coverageLabel = formatCoverageLabel(pagesCrawled, effectiveDiscovered)

  const coverageNote =
    confidence === 'high'
      ? 'Multiple pages were analyzed; findings are more representative of the public site.'
      : confidence === 'medium'
        ? 'Several pages were analyzed, but coverage may not include the full site.'
        : 'Very few pages were analyzed — treat scores as directional for the pages scanned only.'

  return {
    confidence,
    coverageLabel,
    coverageNote,
    crawlLimitations: limitations.join(' '),
  }
}

export function formatCoverageLabel(pagesCrawled: number, pagesDiscovered: number): string {
  const effectiveDiscovered = Math.max(pagesDiscovered, pagesCrawled)
  if (effectiveDiscovered > pagesCrawled) {
    return `Limited (${pagesCrawled} of ${effectiveDiscovered} discovered URLs analyzed)`
  }
  return pagesCrawled <= 1 ? 'Limited (single page)' : `Partial (${pagesCrawled} pages analyzed)`
}
