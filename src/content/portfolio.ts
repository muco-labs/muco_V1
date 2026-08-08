import type { ServiceSlug } from '@/config/routes'

export type PortfolioKind = 'client' | 'internal' | 'concept' | 'demo' | 'case_study'

export type PortfolioProject = {
  id: string
  title: string
  category: string
  kind: PortfolioKind
  tagline: string
  problem: string
  solution: string
  capabilities: string[]
  technology: string[]
  visual: 'commerce' | 'ai-dashboard' | 'saas' | 'premium-site' | 'mobile' | 'automation'
  relatedServiceSlug?: ServiceSlug
  /** Verified outcome only — omit when not confirmed. */
  outcome?: string
}

export function portfolioKindLabel(kind: PortfolioKind): string {
  const labels: Record<PortfolioKind, string> = {
    client: 'Client project',
    internal: 'Internal project',
    concept: 'Concept',
    demo: 'Demo',
    case_study: 'Case study',
  }
  return labels[kind]
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'concept-commerce',
    title: 'Modular commerce experience',
    category: 'E-commerce',
    kind: 'concept',
    tagline: 'Headless storefront patterns for seasonal merchandising.',
    problem:
      'Retail teams need fast storefront iteration without rebuilding the entire stack each season.',
    solution:
      'Composable storefront concept with merchandising zones, performance-first discovery and checkout clarity.',
    capabilities: ['UX architecture', 'Headless commerce', 'Performance budgeting'],
    technology: ['Web', 'Edge delivery', 'Design systems'],
    visual: 'commerce',
    relatedServiceSlug: 'ecommerce-development',
  },
  {
    id: 'concept-ai-dashboard',
    title: 'Operations intelligence surface',
    category: 'AI & dashboards',
    kind: 'concept',
    tagline: 'Human-in-the-loop operations for real teams.',
    problem:
      'Operations leaders lack a single trustworthy view across workflows, alerts and approvals.',
    solution:
      'Dashboard concept with role-based panels, AI-assisted summaries and explicit approval actions.',
    capabilities: ['Data visualization', 'Workflow states', 'AI assist UX'],
    technology: ['Web', 'APIs', 'Applied AI'],
    visual: 'ai-dashboard',
    relatedServiceSlug: 'ai-solutions',
  },
  {
    id: 'concept-saas',
    title: 'Vertical SaaS control plane',
    category: 'SaaS product',
    kind: 'concept',
    tagline: 'Admin, billing and tenant tooling from day one.',
    problem:
      'B2B SaaS teams need onboarding, billing and admin tools that feel cohesive from launch.',
    solution:
      'Product concept for tenant admin, usage insights and modular feature flags with clear permissions.',
    capabilities: ['Product design', 'Multi-tenant UX', 'Admin patterns'],
    technology: ['SaaS', 'Cloud', 'Security'],
    visual: 'saas',
    relatedServiceSlug: 'software-development',
  },
  {
    id: 'concept-premium-site',
    title: 'Editorial brand platform',
    category: 'Premium website',
    kind: 'concept',
    tagline: 'Credibility-first marketing for professional firms.',
    problem:
      'Professional firms need a digital presence that signals credibility without generic agency tropes.',
    solution:
      'Editorial site concept with asymmetric layouts, structured service storytelling and conversion paths.',
    capabilities: ['Brand narrative', 'Content architecture', 'SEO foundation'],
    technology: ['Web', 'CMS-ready structure'],
    visual: 'premium-site',
    relatedServiceSlug: 'web-development',
  },
  {
    id: 'concept-mobile',
    title: 'Field operations companion',
    category: 'Mobile app',
    kind: 'concept',
    tagline: 'Offline-aware mobile workflows.',
    problem: 'Field teams lose productivity when apps fail offline or hide critical actions.',
    solution:
      'Mobile concept with offline queues, biometric-friendly auth and role-based home screens.',
    capabilities: ['Mobile UX', 'Offline sync', 'Secure auth flows'],
    technology: ['React Native', 'APIs', 'Push notifications'],
    visual: 'mobile',
    relatedServiceSlug: 'mobile-app-development',
  },
  {
    id: 'concept-automation',
    title: 'Revenue operations automation',
    category: 'Automation',
    kind: 'concept',
    tagline: 'Connect CRM, billing and support without spreadsheet glue.',
    problem: 'Revenue teams waste hours copying data between tools with no audit trail.',
    solution:
      'Automation concept wiring leads, invoices and support tickets with logged, reversible actions.',
    capabilities: ['Integrations', 'Workflow design', 'Audit logging'],
    technology: ['APIs', 'Webhooks', 'Applied AI'],
    visual: 'automation',
    relatedServiceSlug: 'automation',
  },
]
