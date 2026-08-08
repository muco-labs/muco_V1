import type { ParsedPage } from './html-parser.js'

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type IssueDraft = {
  category: string
  severity: IssueSeverity
  title: string
  description: string
  affectedUrls: string[]
  evidence: Record<string, unknown>
  recommendation: string
}

export function analyzeSiteContext(input: {
  seedUrl: URL
  finalUrl: URL
  isHttps: boolean
  robotsTxtFound: boolean
  sitemapUrls: string[]
  pages: Array<{ url: string; statusCode: number | null; parsed?: ParsedPage }>
}): IssueDraft[] {
  const issues: IssueDraft[] = []
  const { seedUrl, finalUrl, isHttps, robotsTxtFound, sitemapUrls, pages } = input

  if (!isHttps) {
    issues.push({
      category: 'security',
      severity: 'high',
      title: 'Site not served over HTTPS',
      description: 'The audit target did not resolve to HTTPS.',
      affectedUrls: [finalUrl.toString()],
      evidence: { seed: seedUrl.toString(), final: finalUrl.toString() },
      recommendation: 'Serve the site over HTTPS with a valid TLS certificate.',
    })
  } else if (seedUrl.protocol === 'http:' && finalUrl.protocol === 'https:') {
    issues.push({
      category: 'technicalSeo',
      severity: 'informational',
      title: 'HTTP redirects to HTTPS',
      description: 'HTTP entry URL redirects to HTTPS (positive signal).',
      affectedUrls: [seedUrl.toString()],
      evidence: { redirectTo: finalUrl.toString() },
      recommendation: 'Ensure all canonical and internal links use HTTPS directly.',
    })
  }

  if (!robotsTxtFound) {
    issues.push({
      category: 'technicalSeo',
      severity: 'medium',
      title: 'robots.txt not found',
      description: 'No robots.txt was returned at the standard path.',
      affectedUrls: [`${finalUrl.origin}/robots.txt`],
      evidence: {},
      recommendation: 'Publish a robots.txt if you need crawl guidance for search engines.',
    })
  }

  if (sitemapUrls.length === 0) {
    issues.push({
      category: 'technicalSeo',
      severity: 'low',
      title: 'XML sitemap not discovered',
      description: 'No sitemap reference was found in robots.txt or common paths.',
      affectedUrls: [finalUrl.origin],
      evidence: {},
      recommendation: 'Add an XML sitemap and reference it in robots.txt.',
    })
  }

  const titles = new Map<string, string[]>()
  const descriptions = new Map<string, string[]>()

  for (const page of pages) {
    if (!page.parsed || page.statusCode == null || page.statusCode >= 400) continue
    const p = page.parsed
    const pageUrl = page.url

    if (!p.title) {
      issues.push({
        category: 'technicalSeo',
        severity: 'high',
        title: 'Missing page title',
        description: 'HTML title element is empty or missing.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Add a unique, descriptive title for each indexable page.',
      })
    } else if (p.title.length < 15 || p.title.length > 70) {
      issues.push({
        category: 'technicalSeo',
        severity: 'low',
        title: 'Title length outside common heuristic range',
        description: `Title length is ${p.title.length} characters (heuristic: ~15–70).`,
        affectedUrls: [pageUrl],
        evidence: { title: p.title },
        recommendation: 'Consider a concise title that reflects the page topic.',
      })
      const list = titles.get(p.title) ?? []
      list.push(pageUrl)
      titles.set(p.title, list)
    } else {
      const list = titles.get(p.title) ?? []
      list.push(pageUrl)
      titles.set(p.title, list)
    }

    if (!p.metaDescription) {
      issues.push({
        category: 'technicalSeo',
        severity: 'medium',
        title: 'Missing meta description',
        description: 'No meta description was found on this page.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Add a unique meta description aligned with page intent.',
      })
    } else {
      const list = descriptions.get(p.metaDescription) ?? []
      list.push(pageUrl)
      descriptions.set(p.metaDescription, list)
    }

    if (p.h1Texts.length === 0) {
      issues.push({
        category: 'content',
        severity: 'medium',
        title: 'Missing H1 heading',
        description: 'No H1 element was detected.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Add a single clear H1 describing the primary topic.',
      })
    } else if (p.h1Texts.length > 1) {
      issues.push({
        category: 'content',
        severity: 'low',
        title: 'Multiple H1 headings',
        description: `Found ${p.h1Texts.length} H1 elements.`,
        affectedUrls: [pageUrl],
        evidence: { h1: p.h1Texts },
        recommendation: 'Consider a single primary H1 per page unless your template requires otherwise.',
      })
    }

    if (p.robotsNoindex) {
      issues.push({
        category: 'technicalSeo',
        severity: 'high',
        title: 'Page marked noindex',
        description: 'Meta robots includes noindex.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Remove noindex if this page should appear in search results.',
      })
    }

    if (p.wordCount > 0 && p.wordCount < 120) {
      issues.push({
        category: 'content',
        severity: 'medium',
        title: 'Thin content signal',
        description: `Low visible word count (${p.wordCount}).`,
        affectedUrls: [pageUrl],
        evidence: { wordCount: p.wordCount },
        recommendation: 'Expand substantive copy if this page should rank or convert.',
      })
    }

    if (p.imagesMissingAlt > 0) {
      issues.push({
        category: 'accessibility',
        severity: p.imagesMissingAlt > 3 ? 'high' : 'medium',
        title: 'Images missing alt text',
        description: `${p.imagesMissingAlt} of ${p.imageCount} images lack alt attributes.`,
        affectedUrls: [pageUrl],
        evidence: { imageCount: p.imageCount, missingAlt: p.imagesMissingAlt },
        recommendation: 'Provide descriptive alt text for meaningful images.',
      })
    }

    if (!p.htmlLang) {
      issues.push({
        category: 'accessibility',
        severity: 'medium',
        title: 'Missing document language',
        description: 'html element has no lang attribute.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Set lang on the html element (e.g. lang="en").',
      })
    }

    if (!p.viewportMeta) {
      issues.push({
        category: 'mobile',
        severity: 'high',
        title: 'Missing viewport meta tag',
        description: 'No mobile viewport meta tag detected.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Add a responsive viewport meta tag for mobile layouts.',
      })
    }

    if (!p.ogPresent) {
      issues.push({
        category: 'technicalSeo',
        severity: 'low',
        title: 'Open Graph metadata missing',
        description: 'No Open Graph meta tags detected.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Add og:title, og:description, and og:image for richer sharing previews.',
      })
    }

    if (!p.hasMainCta) {
      issues.push({
        category: 'conversion',
        severity: 'low',
        title: 'No obvious CTA detected',
        description: 'Heuristic did not find common call-to-action link/button text.',
        affectedUrls: [pageUrl],
        evidence: {},
        recommendation: 'Consider a clear primary action (contact, shop, sign up) above the fold.',
      })
    }
  }

  for (const [title, urls] of titles) {
    if (urls.length > 1) {
      issues.push({
        category: 'technicalSeo',
        severity: 'medium',
        title: 'Duplicate title tags',
        description: `Title "${title}" appears on multiple pages.`,
        affectedUrls: urls,
        evidence: { title },
        recommendation: 'Use unique titles per URL.',
      })
    }
  }

  for (const [desc, urls] of descriptions) {
    if (urls.length > 1) {
      issues.push({
        category: 'technicalSeo',
        severity: 'medium',
        title: 'Duplicate meta descriptions',
        description: 'The same meta description appears on multiple pages.',
        affectedUrls: urls,
        evidence: { description: desc.slice(0, 120) },
        recommendation: 'Write unique descriptions per page.',
      })
    }
  }

  for (const page of pages) {
    if (page.statusCode && page.statusCode >= 400 && page.statusCode < 500) {
      issues.push({
        category: 'technicalSeo',
        severity: 'high',
        title: 'Client error page in crawl',
        description: `HTTP ${page.statusCode} response.`,
        affectedUrls: [page.url],
        evidence: { statusCode: page.statusCode },
        recommendation: 'Fix broken URLs or remove internal links to them.',
      })
    }
    if (page.statusCode && page.statusCode >= 500) {
      issues.push({
        category: 'technicalSeo',
        severity: 'critical',
        title: 'Server error page in crawl',
        description: `HTTP ${page.statusCode} response.`,
        affectedUrls: [page.url],
        evidence: { statusCode: page.statusCode },
        recommendation: 'Investigate server errors affecting availability.',
      })
    }
  }

  return issues
}

export function computeOpportunityLevel(issues: IssueDraft[]): 'low' | 'medium' | 'high' {
  let points = 0
  for (const issue of issues) {
    if (issue.severity === 'critical') points += 8
    else if (issue.severity === 'high') points += 5
    else if (issue.severity === 'medium') points += 2
    else if (issue.severity === 'low') points += 1
  }
  if (points >= 25) return 'high'
  if (points >= 10) return 'medium'
  return 'low'
}
