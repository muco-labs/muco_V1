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
    kind: 'case_study',
    status: 'live',
    tagline:
      'Cloud inventory, dispatch tracking, GST billing and supplier portals for textile manufacturers.',
    problem:
      'Paper billing and fragmented spreadsheets caused inventory mismatches and delayed dispatch across manufacturing units.',
    solution:
      'React + Node.js + PostgreSQL ERP with role-based vendor access, reorder alerts and automated GST invoicing workflows.',
    capabilities: ['Inventory & dispatch', 'GST e-invoicing', 'Multi-user RBAC', 'Vendor portal'],
    features: [
      'Real-time inventory and dispatch logging',
      'Automated GST invoice generation',
      'Supplier vendor portal',
      'Multi-unit operations visibility',
    ],
    technology: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    role: 'Full-stack delivery (MUCO LABS)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
    outcome: 'Faster dispatch cycles and cleaner GST compliance workflows.',
    screenshotSrc:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    caseStudy: {
      challenge:
        'Legacy paper-based billing and Excel sheets caused inventory mismatches and manual GST errors across units.',
      approach:
        'Unified cloud ERP with inventory alerts, vendor roles and one-click GST e-way bill generation.',
      build: 'React 18 frontend, Node.js API, PostgreSQL data model, role-based access controls.',
      result: 'Reduced order dispatch latency and automated GST invoice generation for operators.',
    },
  },
  {
    id: 'b2b-export-marketplace',
    title: 'Multi-vendor B2B export marketplace',
    category: 'Web Development',
    kind: 'case_study',
    status: 'live',
    tagline: 'Bulk catalog, multi-currency pricing and freight-aware inquiry flows for agri exporters.',
    problem:
      'Regional producers lacked a direct digital channel to overseas wholesale buyers.',
    solution:
      'High-concurrency B2B marketplace with catalog search, sample booking and international payment-ready checkout patterns.',
    capabilities: ['B2B catalog', 'Multi-currency pricing', 'Lead capture', 'Performance SEO'],
    features: [
      'Bulk SKU listing and filtering',
      'Freight and sample inquiry flows',
      'Buyer inquiry pipeline',
      'Sub-second catalog search patterns',
    ],
    technology: ['Next.js', 'TypeScript', 'Stripe', 'Redis', 'Tailwind CSS'],
    role: 'Product engineering (MUCO LABS)',
    visual: 'commerce',
    relatedServiceSlug: 'ecommerce-development',
    screenshotSrc:
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'fleet-manager-app',
    title: 'Cross-platform fleet manager',
    category: 'Mobile App',
    kind: 'case_study',
    status: 'live',
    tagline: 'GPS tracking, route optimization and offline proof-of-delivery for logistics fleets.',
    problem:
      'Fleet managers lacked verified delivery logs and live visibility on off-grid routes.',
    solution:
      'React Native app with background GPS, offline SQLite sync, route optimization and digital signature capture.',
    capabilities: ['Background GPS', 'Offline sync', 'Proof of delivery', 'Route optimization'],
    features: [
      'Live truck tracking',
      'Offline-first log sync',
      'Digital POD signatures',
      'Driver route guidance',
    ],
    technology: ['React Native', 'Expo', 'Google Maps API', 'Firebase', 'TypeScript'],
    role: 'Mobile product delivery (MUCO LABS)',
    visual: 'mobile',
    relatedServiceSlug: 'mobile-app-development',
    screenshotSrc:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ai-support-bot',
    title: 'AI smart customer support bot',
    category: 'AI & Automation',
    kind: 'case_study',
    status: 'live',
    tagline: 'Gemini-powered assistant on web chat and WhatsApp with human handoff.',
    problem:
      'Support teams drowned in repetitive catalog and FAQ questions without after-hours coverage.',
    solution:
      'Custom Gemini agent integrated with WhatsApp Business API and an embeddable web widget for catalog search, FAQs and lead routing.',
    capabilities: ['RAG assistants', 'WhatsApp API', 'Human handoff', 'Lead routing'],
    features: [
      '24/7 instant responses',
      'Catalog and FAQ retrieval',
      'Seamless agent escalation',
      'Conversation analytics',
    ],
    technology: ['Gemini AI', 'Node.js', 'WhatsApp API', 'Express'],
    role: 'AI systems delivery (MUCO LABS)',
    visual: 'ai-dashboard',
    relatedServiceSlug: 'ai-solutions',
    screenshotSrc:
      'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'hospital-saas',
    title: 'Multi-tenant hospital & diagnostic SaaS',
    category: 'SaaS Platform',
    kind: 'case_study',
    status: 'live',
    tagline: 'EHR, lab reports, appointments and billing for clinic networks.',
    problem:
      'Diagnostic clinics needed a shared cloud system for records, reports and appointments without fragile desktop tools.',
    solution:
      'Hospital information SaaS with patient records, PDF lab reports, booking and billing across clinic tenants.',
    capabilities: ['Multi-tenant SaaS', 'EHR workflows', 'Report generation', 'Appointments'],
    features: [
      'Patient electronic health records',
      'Lab report PDF generators',
      'Doctor appointment booking',
      'Clinic billing modules',
    ],
    technology: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Docker'],
    role: 'SaaS platform engineering (MUCO LABS)',
    visual: 'saas',
    relatedServiceSlug: 'software-development',
    screenshotSrc:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'quick-commerce-app',
    title: 'On-demand grocery delivery apps',
    category: 'Mobile App',
    kind: 'case_study',
    status: 'live',
    tagline: 'Consumer ordering and driver partner apps with UPI payments and live status.',
    problem:
      'Local grocery networks needed reliable mobile ordering, driver assignment and payment collection.',
    solution:
      'Flutter consumer and driver apps with Firebase auth, push notifications and Razorpay UPI payments.',
    capabilities: ['Dual-app delivery', 'Push notifications', 'UPI payments', 'Order routing'],
    features: [
      'Real-time order status',
      'Driver partner workflows',
      'Razorpay UPI checkout',
      'Local delivery routing',
    ],
    technology: ['Flutter', 'Dart', 'Firebase Auth', 'Razorpay', 'Node.js'],
    role: 'Mobile product delivery (MUCO LABS)',
    visual: 'mobile',
    relatedServiceSlug: 'mobile-app-development',
    screenshotSrc:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
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
