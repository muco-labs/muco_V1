import type { ServiceSlug } from '@/config/routes'

export type PortfolioKind = 'client' | 'internal' | 'concept' | 'demo' | 'case_study'

export type PortfolioStatus = 'live' | 'in_development' | 'concept' | 'prototype'

export type PortfolioProject = {
  id: string
  title: string
  category: string
  kind: PortfolioKind
  status: PortfolioStatus
  tagline: string
  problem: string
  solution: string
  capabilities: string[]
  features: string[]
  technology: string[]
  role: string
  visual: 'commerce' | 'ai-dashboard' | 'saas' | 'premium-site' | 'mobile' | 'automation'
  relatedServiceSlug?: ServiceSlug
  /** Verified outcome only — omit when not confirmed. */
  outcome?: string
  /** Public URL when the project is accessible and verified. */
  projectUrl?: string
  /** Path under /public when a real screenshot is available. */
  screenshotSrc?: string
  /** Optional deeper narrative when enough verified detail exists. */
  caseStudy?: {
    challenge: string
    approach: string
    build: string
    result: string
  }
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

export function portfolioStatusLabel(status: PortfolioStatus): string {
  const labels: Record<PortfolioStatus, string> = {
    live: 'Live',
    in_development: 'In development',
    concept: 'Concept',
    prototype: 'Prototype',
  }
  return labels[status]
}

export function workPath(projectId: string): string {
  return `/work/${projectId}`
}

export function getPortfolioProject(projectId: string): PortfolioProject | undefined {
  return portfolioProjects.find((project) => project.id === projectId)
}

export function portfolioForService(
  serviceSlug: ServiceSlug,
  limit = 3,
): PortfolioProject[] {
  return portfolioProjects
    .filter((project) => project.relatedServiceSlug === serviceSlug)
    .slice(0, limit)
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'muco-labs-website',
    title: 'MUCO LABS public website',
    category: 'Marketing platform',
    kind: 'internal',
    status: 'in_development',
    tagline: 'Founder-led marketing site with design system, SEO foundation and honest portfolio labelling.',
    problem:
      'A technology company needs a credible public surface that explains services, pricing and delivery—without fake social proof.',
    solution:
      'Signal Forge–styled marketing experience with structured content, service detail pages, legal policies and conversion paths to contact and pricing.',
    capabilities: ['Brand narrative', 'Design system', 'Performance-focused frontend', 'SEO metadata'],
    features: [
      'Service and pricing pages',
      'Portfolio with explicit project classification',
      'Contact and lead capture',
      'Structured data for search',
    ],
    technology: ['React', 'TypeScript', 'Vite', 'CSS modules'],
    role: 'Product, design and engineering (in-house)',
    visual: 'premium-site',
    relatedServiceSlug: 'web-development',
    projectUrl: 'https://mucolabs.com',
  },
  {
    id: 'muco-business-platform',
    title: 'MUCO business operations platform',
    category: 'Internal software',
    kind: 'internal',
    status: 'in_development',
    tagline: 'Customer, team and admin portals connected to a unified API.',
    problem:
      'Client delivery needs proposals, projects, invoices, payments and support in one auditable system—not scattered spreadsheets.',
    solution:
      'Multi-portal platform with role-based access for customers, employees and administrators, backed by PostgreSQL and workflow services.',
    capabilities: ['Multi-tenant portals', 'Workflow automation', 'Payments integration', 'Audit-friendly operations'],
    features: [
      'Customer project and invoice views',
      'Employee task and project workspace',
      'Admin CRM and operations reporting',
      'Webhook-ready payment flows',
    ],
    technology: ['Node', 'PostgreSQL', 'Supabase auth', 'Razorpay', 'React portals'],
    role: 'Platform architecture and full-stack delivery (in-house)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
  },
  {
    id: 'textile-erp-portal',
    title: 'Enterprise ERP & supply chain portal',
    category: 'Web Development',
    kind: 'demo',
    status: 'prototype',
    tagline:
      'Cloud inventory, dispatch tracking, GST billing and supplier portals for textile operations.',
    problem:
      'Paper billing and fragmented spreadsheets cause inventory mismatches and delayed dispatch across manufacturing units.',
    solution:
      'React + Node.js + PostgreSQL ERP patterns with role-based vendor access, reorder alerts and automated GST invoicing workflows.',
    capabilities: ['Inventory & dispatch', 'GST e-invoicing', 'Multi-user RBAC', 'Vendor portal'],
    features: [
      'Real-time inventory and dispatch logging',
      'Automated GST invoice generation',
      'Supplier vendor portal',
      'Multi-unit operations visibility',
    ],
    technology: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
  },
  {
    id: 'b2b-export-marketplace',
    title: 'Multi-vendor B2B export marketplace',
    category: 'Web Development',
    kind: 'demo',
    status: 'prototype',
    tagline: 'Bulk catalog, multi-currency pricing and freight-aware inquiry flows for exporters.',
    problem:
      'Regional producers often lack a direct digital channel to overseas wholesale buyers.',
    solution:
      'B2B marketplace patterns with catalog search, sample booking and international payment-ready checkout flows.',
    capabilities: ['B2B catalog', 'Multi-currency pricing', 'Lead capture', 'Performance SEO'],
    features: [
      'Bulk SKU listing and filtering',
      'Freight and sample inquiry flows',
      'Buyer inquiry pipeline',
      'Fast catalog search patterns',
    ],
    technology: ['Next.js', 'TypeScript', 'Stripe', 'Redis'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'commerce',
    relatedServiceSlug: 'ecommerce-development',
  },
  {
    id: 'fleet-manager-app',
    title: 'Cross-platform fleet manager',
    category: 'Mobile App',
    kind: 'demo',
    status: 'prototype',
    tagline: 'GPS tracking, route optimization and offline proof-of-delivery for logistics fleets.',
    problem:
      'Fleet managers need verified delivery logs and live visibility when drivers go offline.',
    solution:
      'React Native patterns with background GPS, offline sync, route optimization and digital signature capture.',
    capabilities: ['Background GPS', 'Offline sync', 'Proof of delivery', 'Route optimization'],
    features: [
      'Live truck tracking',
      'Offline-first log sync',
      'Digital POD signatures',
      'Driver route guidance',
    ],
    technology: ['React Native', 'Expo', 'Google Maps API', 'TypeScript'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'mobile',
    relatedServiceSlug: 'mobile-app-development',
  },
  {
    id: 'ai-support-bot',
    title: 'AI smart customer support bot',
    category: 'AI & Automation',
    kind: 'demo',
    status: 'prototype',
    tagline: 'Gemini-powered assistant on web chat and WhatsApp with human handoff.',
    problem:
      'Support teams drown in repetitive catalog and FAQ questions without after-hours coverage.',
    solution:
      'Custom Gemini agent patterns with WhatsApp Business API and an embeddable widget for FAQs and lead routing.',
    capabilities: ['RAG assistants', 'WhatsApp API', 'Human handoff', 'Lead routing'],
    features: [
      'Always-on assistant responses',
      'Catalog and FAQ retrieval',
      'Seamless agent escalation',
      'Conversation analytics',
    ],
    technology: ['Gemini AI', 'Node.js', 'WhatsApp API', 'Express'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'ai-dashboard',
    relatedServiceSlug: 'ai-solutions',
  },
  {
    id: 'hospital-saas',
    title: 'Multi-tenant hospital & diagnostic SaaS',
    category: 'SaaS Platform',
    kind: 'demo',
    status: 'prototype',
    tagline: 'EHR, lab reports, appointments and billing for clinic networks.',
    problem:
      'Diagnostic clinics need a shared cloud system for records, reports and appointments without fragile desktop tools.',
    solution:
      'Hospital information SaaS patterns with patient records, PDF lab reports, booking and billing across tenants.',
    capabilities: ['Multi-tenant SaaS', 'EHR workflows', 'Report generation', 'Appointments'],
    features: [
      'Patient electronic health records',
      'Lab report PDF generators',
      'Doctor appointment booking',
      'Clinic billing modules',
    ],
    technology: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
  },
  {
    id: 'quick-commerce-app',
    title: 'On-demand grocery delivery apps',
    category: 'Mobile App',
    kind: 'demo',
    status: 'prototype',
    tagline: 'Consumer ordering and driver partner apps with UPI payments and live status.',
    problem:
      'Local grocery networks need reliable mobile ordering, driver assignment and payment collection.',
    solution:
      'Flutter consumer and driver app patterns with auth, push notifications and Razorpay UPI payments.',
    capabilities: ['Dual-app delivery', 'Push notifications', 'UPI payments', 'Order routing'],
    features: [
      'Real-time order status',
      'Driver partner workflows',
      'Razorpay UPI checkout',
      'Local delivery routing',
    ],
    technology: ['Flutter', 'Dart', 'Firebase Auth', 'Razorpay', 'Node.js'],
    role: 'Representative delivery pattern (MUCO LABS)',
    visual: 'mobile',
    relatedServiceSlug: 'mobile-app-development',
  },
  {
    id: 'concept-commerce',
    title: 'Modular commerce experience',
    category: 'E-commerce',
    kind: 'concept',
    status: 'concept',
    tagline: 'Headless storefront patterns for seasonal merchandising.',
    problem:
      'Retail teams need fast storefront iteration without rebuilding the entire stack each season.',
    solution:
      'Composable storefront concept with merchandising zones, performance-first discovery and checkout clarity.',
    capabilities: ['UX architecture', 'Headless commerce', 'Performance budgeting'],
    features: ['Merchandising zones', 'Checkout clarity', 'Catalog performance patterns'],
    technology: ['Web', 'Edge delivery', 'Design systems'],
    role: 'Concept exploration (MUCO LABS)',
    visual: 'commerce',
    relatedServiceSlug: 'ecommerce-development',
  },
  {
    id: 'concept-ai-dashboard',
    title: 'Operations intelligence surface',
    category: 'AI & dashboards',
    kind: 'concept',
    status: 'concept',
    tagline: 'Human-in-the-loop operations for real teams.',
    problem:
      'Operations leaders lack a single trustworthy view across workflows, alerts and approvals.',
    solution:
      'Dashboard concept with role-based panels, AI-assisted summaries and explicit approval actions.',
    capabilities: ['Data visualization', 'Workflow states', 'AI assist UX'],
    features: ['Role-based panels', 'Approval queues', 'AI summary cards'],
    technology: ['Web', 'APIs', 'Applied AI'],
    role: 'Concept exploration (MUCO LABS)',
    visual: 'ai-dashboard',
    relatedServiceSlug: 'ai-solutions',
  },
  {
    id: 'concept-saas',
    title: 'Vertical SaaS control plane',
    category: 'SaaS product',
    kind: 'concept',
    status: 'concept',
    tagline: 'Admin, billing and tenant tooling from day one.',
    problem:
      'B2B SaaS teams need onboarding, billing and admin tools that feel cohesive from launch.',
    solution:
      'Product concept for tenant admin, usage insights and modular feature flags with clear permissions.',
    capabilities: ['Product design', 'Multi-tenant UX', 'Admin patterns'],
    features: ['Tenant admin', 'Usage insights', 'Feature flags'],
    technology: ['SaaS', 'Cloud', 'Security'],
    role: 'Concept exploration (MUCO LABS)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
  },
  {
    id: 'concept-automation',
    title: 'Revenue operations automation',
    category: 'Automation',
    kind: 'concept',
    status: 'concept',
    tagline: 'Connect CRM, billing and support without spreadsheet glue.',
    problem: 'Revenue teams waste hours copying data between tools with no audit trail.',
    solution:
      'Automation concept wiring leads, invoices and support tickets with logged, reversible actions.',
    capabilities: ['Integrations', 'Workflow design', 'Audit logging'],
    features: ['CRM sync', 'Invoice triggers', 'Support ticket routing'],
    technology: ['APIs', 'Webhooks', 'Applied AI'],
    role: 'Concept exploration (MUCO LABS)',
    visual: 'automation',
    relatedServiceSlug: 'automation',
  },
]
