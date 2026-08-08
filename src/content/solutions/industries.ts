import type { ServiceSlug } from '@/config/routes'

export const industrySolutionSlugs = [
  'manufacturing',
  'ecommerce',
  'healthcare',
  'education',
  'startups',
] as const

export type IndustrySolutionSlug = (typeof industrySolutionSlugs)[number]

export function isIndustrySolutionSlug(value: string): value is IndustrySolutionSlug {
  return (industrySolutionSlugs as readonly string[]).includes(value)
}

export function industrySolutionPath(slug: IndustrySolutionSlug): string {
  return `/solutions/${slug}`
}

export type IndustrySolutionContent = {
  slug: IndustrySolutionSlug
  h1: string
  lead: string
  problems: string[]
  approach: string
  technologies: string[]
  relatedServices: ServiceSlug[]
  faqs: Array<{ question: string; answer: string }>
}

export const industrySolutions: Record<IndustrySolutionSlug, IndustrySolutionContent> = {
  manufacturing: {
    slug: 'manufacturing',
    h1: 'Software for manufacturing and operations',
    lead:
      'Digitise production support, inventory visibility and customer-facing channels without bolting together fragile spreadsheets. MUCO LABS scopes integrations and internal tools around how your plant or job shop actually runs.',
    problems: [
      'Production and dispatch data living in disconnected sheets',
      'Dealers or B2B buyers lacking a reliable portal or catalog',
      'Quality and traceability requests from larger buyers',
    ],
    approach:
      'We start with one measurable workflow—orders, job cards, inventory or dealer login—then expand. UI is built for shop-floor realities: clear states, mobile-friendly views and role-based access.',
    technologies: ['PostgreSQL', 'API-first backends', 'React web apps', 'Reporting dashboards', 'Barcode/QR integrations where needed'],
    relatedServices: ['software-development', 'automation', 'web-development'],
    faqs: [
      {
        question: 'Do you implement full ERP replacements?',
        answer:
          'We typically integrate with or extend existing ERPs rather than rip-and-replace. Scope is defined in discovery.',
      },
      {
        question: 'Can you work with Tamil Nadu manufacturing units?',
        answer:
          'Yes—many engagements are remote across India. On-site discovery in Tamil Nadu is possible when agreed in scope.',
      },
    ],
  },
  ecommerce: {
    slug: 'ecommerce',
    h1: 'Ecommerce development for growing brands',
    lead:
      'Launch or upgrade storefronts with performance, payments and operations in mind—from catalog and checkout to admin workflows and analytics.',
    problems: [
      'Slow storefronts that hurt conversion on mobile',
      'Payment and shipping rules that are hard to maintain',
      'Marketing teams blocked by developers for every content change',
    ],
    approach:
      'We choose stack based on catalog complexity and internal skills—custom builds or composable setups—with Razorpay-ready checkout patterns and SEO foundations.',
    technologies: ['Headless/composable commerce', 'Razorpay', 'CDN-friendly frontends', 'Inventory sync APIs'],
    relatedServices: ['ecommerce-development', 'web-development', 'seo'],
    faqs: [
      {
        question: 'Do you only build custom ecommerce?',
        answer: 'We recommend the simplest architecture that meets growth plans—custom, hybrid or integrated platforms after discovery.',
      },
    ],
  },
  healthcare: {
    slug: 'healthcare',
    h1: 'Websites and systems for healthcare operators',
    lead:
      'Patient-facing websites, appointment flows and lightweight admin tools—with privacy-aware design. We do not claim clinical certifications we do not hold.',
    problems: [
      'Outdated sites that do not explain services or locations clearly',
      'Phone-heavy scheduling without online self-service',
      'Staff using informal tools for patient communication',
    ],
    approach:
      'Clear information architecture, accessible UI and secure hosting patterns. Integrations with existing practice software only when APIs and agreements exist.',
    technologies: ['Secure web apps', 'Role-based access', 'Audit-friendly logging', 'HIPAA-aware patterns where applicable to scope'],
    relatedServices: ['web-development', 'software-development', 'ui-ux-design'],
    faqs: [
      {
        question: 'Can you build telemedicine platforms?',
        answer:
          'We can scope patient portals and scheduling with your clinical and legal advisors. Regulatory compliance remains your responsibility with our engineering support.',
      },
    ],
  },
  education: {
    slug: 'education',
    h1: 'Digital platforms for education providers',
    lead:
      'Institution websites, student/parent portals and internal tools that respect how academic teams actually work—without overpromising LMS features you do not need.',
    problems: [
      'Websites that do not reflect programs, admissions and outcomes',
      'Admissions inquiries lost across email and WhatsApp',
      'Fragmented tools for attendance, fees or content',
    ],
    approach:
      'Phase delivery: public site and inquiry flows first, then portals or integrations once stakeholders align on data ownership.',
    technologies: ['Content-managed marketing sites', 'Portals', 'Payment integrations', 'Reporting'],
    relatedServices: ['web-development', 'software-development', 'mobile-app-development'],
    faqs: [
      {
        question: 'Do you build full learning management systems?',
        answer:
          'We build custom portals and integrate with LMS products when appropriate. Full LMS builds are scoped only when justified.',
      },
    ],
  },
  startups: {
    slug: 'startups',
    h1: 'Product engineering for startups',
    lead:
      'MVP to v1 for founders who need honest timelines, maintainable code and a path to scale—not a pitch-deck prototype that collapses under real users.',
    problems: [
      'Agencies that ship templates without product thinking',
      'Technical debt before finding product-market fit',
      'Founders without visibility into what was built',
    ],
    approach:
      'Thin vertical slices, weekly demos and documentation you can hand to future hires. We align on stack, hosting and ownership up front.',
    technologies: ['React', 'TypeScript', 'Node/API layers', 'Postgres', 'Cloud hosting', 'CI basics'],
    relatedServices: ['software-development', 'mobile-app-development', 'ai-solutions', 'ui-ux-design'],
    faqs: [
      {
        question: 'Do you take equity?',
        answer: 'Primary engagements are fee-based. Equity or hybrid deals are considered only with explicit mutual agreement—not by default.',
      },
    ],
  },
}

export function getIndustrySolutionSeo(slug: IndustrySolutionSlug) {
  const content = industrySolutions[slug]
  return {
    path: industrySolutionPath(slug),
    documentTitle: `${content.h1} | MUCO LABS`,
    description: content.lead.slice(0, 155),
  }
}
