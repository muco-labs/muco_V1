import type { IssueSeverity } from './analyze.js'

/** MUCO service names aligned with public catalog + Website Intelligence offerings. */
export const MUCO_SERVICE_NAMES = [
  'Website Development',
  'Website Redesign',
  'UI/UX Design',
  'SEO',
  'Website Optimization',
  'Conversion Optimization',
  'Accessibility Optimization',
  'Security Hardening',
  'Content Strategy',
  'Digital Marketing',
] as const

export type MucoServiceName = (typeof MUCO_SERVICE_NAMES)[number]

export type IssueBusinessRule = {
  businessImpact: string
  recommendedAction: string
  mucoServices: MucoServiceName[]
  /** Business priority; may differ slightly from scanner severity. */
  priority: IssueSeverity
}

/** Deterministic mapping keyed by exact issue title from analyze.ts / runner. */
export const ISSUE_BUSINESS_RULES: Record<string, IssueBusinessRule> = {
  'Site not served over HTTPS': {
    businessImpact: 'Visitors may see security warnings, which can reduce trust and engagement.',
    recommendedAction: 'Enable HTTPS across the site and redirect HTTP to HTTPS.',
    mucoServices: ['Website Development', 'Security Hardening'],
    priority: 'critical',
  },
  'HTTP redirects to HTTPS': {
    businessImpact: 'HTTPS redirect is a positive technical signal for visitors and crawlers.',
    recommendedAction: 'Keep enforcing HTTPS and use HTTPS in canonical and internal links.',
    mucoServices: ['Website Optimization'],
    priority: 'informational',
  },
  'robots.txt not found': {
    businessImpact: 'Crawl guidance may be unclear for search engines without a robots.txt file.',
    recommendedAction: 'Publish a robots.txt that reflects your indexing preferences.',
    mucoServices: ['SEO', 'Website Optimization'],
    priority: 'medium',
  },
  'XML sitemap not discovered': {
    businessImpact: 'Search engines may discover fewer URLs without a sitemap reference.',
    recommendedAction: 'Add an XML sitemap and reference it in robots.txt.',
    mucoServices: ['SEO', 'Website Development'],
    priority: 'low',
  },
  'Missing page title': {
    businessImpact: 'Pages without titles may be harder to understand in search results and browser tabs.',
    recommendedAction: 'Add a unique, descriptive title for each important page.',
    mucoServices: ['SEO', 'Website Development'],
    priority: 'high',
  },
  'Title length outside common heuristic range': {
    businessImpact: 'Very short or long titles may be less clear in search snippets.',
    recommendedAction: 'Adjust title length to clearly describe the page topic.',
    mucoServices: ['SEO', 'Content Strategy'],
    priority: 'low',
  },
  'Missing meta description': {
    businessImpact: 'Missing descriptions may reduce clarity of search snippets.',
    recommendedAction: 'Add unique meta descriptions aligned with page intent.',
    mucoServices: ['SEO', 'Content Strategy'],
    priority: 'medium',
  },
  'Missing H1 heading': {
    businessImpact: 'A missing primary heading may weaken page structure and clarity for visitors and crawlers.',
    recommendedAction: 'Add one descriptive primary heading (H1) for the page topic.',
    mucoServices: ['SEO', 'Website Optimization', 'Content Strategy'],
    priority: 'medium',
  },
  'Multiple H1 headings': {
    businessImpact: 'Multiple H1s may dilute the main topic signal on a page.',
    recommendedAction: 'Use a single primary H1 unless your template intentionally uses more.',
    mucoServices: ['SEO', 'Content Strategy'],
    priority: 'low',
  },
  'Page marked noindex': {
    businessImpact: 'Pages with noindex may not appear in organic search results.',
    recommendedAction: 'Remove noindex on pages that should be discoverable.',
    mucoServices: ['SEO', 'Website Optimization'],
    priority: 'high',
  },
  'Thin content signal': {
    businessImpact: 'Limited on-page copy may provide less context for visitors and search engines.',
    recommendedAction: 'Expand substantive content where the page should inform or convert.',
    mucoServices: ['Content Strategy', 'SEO', 'Website Development'],
    priority: 'medium',
  },
  'Images missing alt text': {
    businessImpact: 'Missing alt text may reduce accessibility and clarity for assistive technologies.',
    recommendedAction: 'Add descriptive alt text for meaningful images.',
    mucoServices: ['Accessibility Optimization', 'UI/UX Design', 'Website Development'],
    priority: 'medium',
  },
  'Missing document language': {
    businessImpact: 'Missing language declaration may affect accessibility and localization hints.',
    recommendedAction: 'Set the html lang attribute to the primary page language.',
    mucoServices: ['Accessibility Optimization', 'Website Development'],
    priority: 'medium',
  },
  'Missing viewport meta tag': {
    businessImpact: 'Mobile layouts may not render optimally without a viewport meta tag.',
    recommendedAction: 'Add a responsive viewport meta tag.',
    mucoServices: ['UI/UX Design', 'Website Development', 'Website Optimization'],
    priority: 'high',
  },
  'Open Graph metadata missing': {
    businessImpact: 'Social and messaging previews may look generic without Open Graph tags.',
    recommendedAction: 'Add Open Graph title, description, and image where sharing matters.',
    mucoServices: ['SEO', 'Digital Marketing', 'Website Optimization'],
    priority: 'low',
  },
  'No obvious CTA detected': {
    businessImpact: 'A unclear primary action may make it harder for visitors to take the next step.',
    recommendedAction: 'Consider a visible primary call-to-action aligned with your goal.',
    mucoServices: ['Conversion Optimization', 'UI/UX Design', 'Website Development'],
    priority: 'low',
  },
  'Duplicate title tags': {
    businessImpact: 'Duplicate titles may make it harder to distinguish pages in search results.',
    recommendedAction: 'Use unique titles per URL.',
    mucoServices: ['SEO', 'Website Development'],
    priority: 'medium',
  },
  'Duplicate meta descriptions': {
    businessImpact: 'Duplicate descriptions may reduce clarity across similar pages in search.',
    recommendedAction: 'Write unique meta descriptions per page.',
    mucoServices: ['SEO', 'Content Strategy'],
    priority: 'medium',
  },
  'Client error page in crawl': {
    businessImpact: 'Broken pages in the crawl path may affect user journeys and crawl efficiency.',
    recommendedAction: 'Fix or remove links to URLs returning client errors.',
    mucoServices: ['Website Development', 'Website Optimization', 'SEO'],
    priority: 'high',
  },
  'Server error page in crawl': {
    businessImpact: 'Server errors may prevent visitors and crawlers from accessing content.',
    recommendedAction: 'Investigate and resolve server availability issues.',
    mucoServices: ['Website Development', 'Security Hardening'],
    priority: 'critical',
  },
  'Limited crawl coverage': {
    businessImpact: 'Findings may not represent the full public site; additional issues may exist on unscanned pages.',
    recommendedAction: 'Run a broader crawl or manual review before major business decisions.',
    mucoServices: ['SEO', 'Website Optimization'],
    priority: 'informational',
  },
}

const CATEGORY_FALLBACK: Record<string, IssueBusinessRule> = {
  technicalSeo: {
    businessImpact: 'Technical SEO signals on scanned pages may affect how clearly the site communicates with search engines.',
    recommendedAction: 'Review technical SEO findings and prioritize indexability fixes.',
    mucoServices: ['SEO', 'Website Optimization'],
    priority: 'medium',
  },
  content: {
    businessImpact: 'Content structure on scanned pages may affect clarity for visitors.',
    recommendedAction: 'Improve headings and substantive copy on key pages.',
    mucoServices: ['Content Strategy', 'SEO'],
    priority: 'medium',
  },
  accessibility: {
    businessImpact: 'Accessibility gaps may affect some visitors’ ability to use the site effectively.',
    recommendedAction: 'Address accessibility findings on high-traffic templates.',
    mucoServices: ['Accessibility Optimization', 'UI/UX Design'],
    priority: 'medium',
  },
  mobile: {
    businessImpact: 'Mobile experience issues may affect visitors on smaller screens.',
    recommendedAction: 'Validate responsive layout and mobile meta configuration.',
    mucoServices: ['UI/UX Design', 'Website Development'],
    priority: 'medium',
  },
  security: {
    businessImpact: 'Security-related signals may affect visitor trust or transport safety.',
    recommendedAction: 'Remediate security findings with engineering review.',
    mucoServices: ['Security Hardening', 'Website Development'],
    priority: 'high',
  },
  conversion: {
    businessImpact: 'Conversion path clarity may influence whether visitors take action.',
    recommendedAction: 'Review primary CTAs and contact pathways on key pages.',
    mucoServices: ['Conversion Optimization', 'UI/UX Design'],
    priority: 'low',
  },
  performance: {
    businessImpact: 'Performance can affect perceived quality; measurement is required before prioritizing fixes.',
    recommendedAction: 'Run a performance measurement when a provider is configured.',
    mucoServices: ['Website Optimization'],
    priority: 'informational',
  },
}

export function resolveIssueBusinessRule(
  title: string,
  category: string,
  severity: IssueSeverity,
): IssueBusinessRule {
  const exact = ISSUE_BUSINESS_RULES[title]
  if (exact) return exact
  const fallback = CATEGORY_FALLBACK[category]
  if (fallback) {
    return {
      ...fallback,
      priority: severity === 'critical' || severity === 'high' ? severity : fallback.priority,
    }
  }
  return {
    businessImpact: 'This finding may warrant review in the context of your business goals.',
    recommendedAction: 'Discuss this finding with your web team or agency.',
    mucoServices: ['Website Development'],
    priority: severity,
  }
}
