import { INTAKE_SERVICE_SLUGS, INTAKE_SERVICE_TITLES } from '../intake/service-slugs.js'

/** Canonical MUCO intake service (customer Start Project / proposals). */
export type MucoServiceSlug = (typeof INTAKE_SERVICE_SLUGS)[number]

export type MucoSubService = {
  id: string
  label: string
  serviceSlug: MucoServiceSlug
}

/**
 * Sub-offerings derived from public service catalog "delivers" lists (no DB seed).
 * Used as skill / sub-service identifiers for freelancer offerings.
 */
export const MUCO_SUB_SERVICES_BY_SERVICE: Record<MucoServiceSlug, MucoSubService[]> = {
  'web-development': [
    { id: 'responsive-ui', label: 'Responsive UI', serviceSlug: 'web-development' },
    { id: 'seo-foundation', label: 'SEO foundation', serviceSlug: 'web-development' },
    { id: 'analytics-hooks', label: 'Analytics hooks', serviceSlug: 'web-development' },
    { id: 'launch-support', label: 'Launch support', serviceSlug: 'web-development' },
  ],
  'software-development': [
    { id: 'multi-tenant-architecture', label: 'Multi-tenant architecture', serviceSlug: 'software-development' },
    { id: 'role-based-access', label: 'Role-based access', serviceSlug: 'software-development' },
    { id: 'apis-integrations', label: 'APIs & integrations', serviceSlug: 'software-development' },
    { id: 'documentation', label: 'Documentation', serviceSlug: 'software-development' },
  ],
  'mobile-app-development': [
    { id: 'cross-platform-apps', label: 'Cross-platform apps', serviceSlug: 'mobile-app-development' },
    { id: 'backend-apis', label: 'Backend APIs', serviceSlug: 'mobile-app-development' },
    { id: 'push-notifications', label: 'Push notifications', serviceSlug: 'mobile-app-development' },
    { id: 'store-assets', label: 'Store assets', serviceSlug: 'mobile-app-development' },
  ],
  'ecommerce-development': [
    { id: 'storefront-ux', label: 'Storefront UX', serviceSlug: 'ecommerce-development' },
    { id: 'payments-shipping', label: 'Payments & shipping', serviceSlug: 'ecommerce-development' },
    { id: 'catalog-tooling', label: 'Catalog tooling', serviceSlug: 'ecommerce-development' },
    { id: 'growth-hooks', label: 'Growth hooks', serviceSlug: 'ecommerce-development' },
  ],
  'ai-solutions': [
    { id: 'trained-assistants', label: 'Trained assistants', serviceSlug: 'ai-solutions' },
    { id: 'embeddable-widgets', label: 'Embeddable widgets', serviceSlug: 'ai-solutions' },
    { id: 'integrations', label: 'Integrations', serviceSlug: 'ai-solutions' },
    { id: 'analytics', label: 'Analytics', serviceSlug: 'ai-solutions' },
  ],
  'ui-ux-design': [
    { id: 'user-flows', label: 'User flows', serviceSlug: 'ui-ux-design' },
    { id: 'design-systems', label: 'Design systems', serviceSlug: 'ui-ux-design' },
    { id: 'high-fidelity-ui', label: 'High-fidelity UI', serviceSlug: 'ui-ux-design' },
    { id: 'developer-handoff', label: 'Developer handoff', serviceSlug: 'ui-ux-design' },
  ],
  seo: [
    { id: 'technical-audit', label: 'Technical audit', serviceSlug: 'seo' },
    { id: 'on-page-structure', label: 'On-page structure', serviceSlug: 'seo' },
    { id: 'content-plan', label: 'Content plan', serviceSlug: 'seo' },
    { id: 'measurement', label: 'Measurement', serviceSlug: 'seo' },
  ],
  'digital-marketing': [
    { id: 'seo-content-plan', label: 'SEO & content plan', serviceSlug: 'digital-marketing' },
    { id: 'ad-setup', label: 'Ad setup', serviceSlug: 'digital-marketing' },
    { id: 'conversion-tracking', label: 'Conversion tracking', serviceSlug: 'digital-marketing' },
    { id: 'monthly-reporting', label: 'Monthly reporting', serviceSlug: 'digital-marketing' },
  ],
  automation: [
    { id: 'workflow-design', label: 'Workflow design', serviceSlug: 'automation' },
    { id: 'webhooks-apis', label: 'Webhooks & APIs', serviceSlug: 'automation' },
    { id: 'error-handling', label: 'Error handling', serviceSlug: 'automation' },
    { id: 'audit-logs', label: 'Audit logs', serviceSlug: 'automation' },
  ],
  'technology-consulting': [
    { id: 'architecture-review', label: 'Architecture review', serviceSlug: 'technology-consulting' },
    { id: 'roadmap-options', label: 'Roadmap options', serviceSlug: 'technology-consulting' },
    { id: 'vendor-evaluation', label: 'Vendor evaluation', serviceSlug: 'technology-consulting' },
    { id: 'team-enablement', label: 'Team enablement', serviceSlug: 'technology-consulting' },
  ],
  other: [],
}

const serviceSlugSet = new Set<string>(INTAKE_SERVICE_SLUGS)

export function isMucoServiceSlug(slug: string): slug is MucoServiceSlug {
  return serviceSlugSet.has(slug)
}

export function listMucoServiceCatalog() {
  return INTAKE_SERVICE_SLUGS.map((slug) => ({
    slug,
    title: INTAKE_SERVICE_TITLES[slug],
    subServices: MUCO_SUB_SERVICES_BY_SERVICE[slug],
  }))
}

export function resolveSubService(serviceSlug: string, subServiceSlug: string | null | undefined) {
  if (!subServiceSlug) return null
  if (!isMucoServiceSlug(serviceSlug)) return null
  return MUCO_SUB_SERVICES_BY_SERVICE[serviceSlug].find((s) => s.id === subServiceSlug) ?? null
}

export function resolveSkillSlug(serviceSlug: string, skillSlug: string) {
  if (!isMucoServiceSlug(serviceSlug)) return null
  return MUCO_SUB_SERVICES_BY_SERVICE[serviceSlug].find((s) => s.id === skillSlug) ?? null
}

export function labelMucoService(slug: string): string {
  if (isMucoServiceSlug(slug)) return INTAKE_SERVICE_TITLES[slug]
  return slug
}
