import type { ServiceSlug } from '@/config/routes'

export const erodeLocalServiceSlugs = ['web-development', 'software-development', 'seo'] as const

export type ErodeLocalServiceSlug = (typeof erodeLocalServiceSlugs)[number]

export function isErodeLocalServiceSlug(value: string): value is ErodeLocalServiceSlug {
  return (erodeLocalServiceSlugs as readonly string[]).includes(value)
}

export function erodeLocalServicePath(slug: ErodeLocalServiceSlug): string {
  return `/erode/${slug}`
}

export type ErodeLocalServiceContent = {
  slug: ErodeLocalServiceSlug
  nationalServiceSlug: ServiceSlug
  h1: string
  lead: string
  sections: Array<{ title: string; body: string }>
  faqs: Array<{ question: string; answer: string }>
}

export const erodeLocalServices: Record<ErodeLocalServiceSlug, ErodeLocalServiceContent> = {
  'web-development': {
    slug: 'web-development',
    nationalServiceSlug: 'web-development',
    h1: 'Website development for Erode businesses',
    lead:
      'Fast, accessible business websites for SMEs, retailers and professional firms in Erode and Tamil Nadu—scoped clearly and delivered with founder oversight from MUCO LABS.',
    sections: [
      {
        title: 'What local businesses typically need',
        body:
          'Clear service pages, mobile-friendly layouts, contact and inquiry flows, basic SEO structure, and content you can update without breaking the site. We avoid template dumping—each build is scoped to your offer and audience.',
      },
      {
        title: 'How we work with Erode teams',
        body:
          'Discovery and written scope first, then design and build in milestones. Meetings can be on-site in Erode when useful, or remote when that is faster for your team.',
      },
      {
        title: 'Pricing transparency',
        body:
          'Public starting prices are on our pricing page. Final quotes depend on pages, integrations and content—always confirmed in writing before build starts.',
      },
    ],
    faqs: [
      {
        question: 'How long does a business website take?',
        answer:
          'Typical marketing sites run a few weeks to a few months depending on content readiness, integrations and review cycles. We give a timeline in your proposal.',
      },
      {
        question: 'Do you handle domain and hosting?',
        answer:
          'We can advise and coordinate deployment; ownership stays with you. We document credentials and handover clearly.',
      },
    ],
  },
  'software-development': {
    slug: 'software-development',
    nationalServiceSlug: 'software-development',
    h1: 'Custom software for Erode & Tamil Nadu operators',
    lead:
      'Internal tools, customer portals, CRM extensions and workflow systems for businesses that have outgrown spreadsheets—engineered in TypeScript with maintainability in mind.',
    sections: [
      {
        title: 'Common local use cases',
        body:
          'Inventory and order tracking for trading businesses, operations dashboards for manufacturing support functions, appointment or service scheduling, and integrations between website leads and back-office tools.',
      },
      {
        title: 'Security and ownership',
        body:
          'Role-based access, audit-friendly patterns, and documentation so your team or future partners can extend the system. We do not lock you into proprietary black boxes.',
      },
      {
        title: 'When custom software is justified',
        body:
          'If off-the-shelf SaaS cannot match your process without heavy workarounds, a focused custom build often pays off. We will tell you honestly if a simpler tool is enough.',
      },
    ],
    faqs: [
      {
        question: 'Can you integrate with our existing website?',
        answer: 'Yes—lead capture, customer logins and APIs can connect to a new or existing site when scope allows.',
      },
    ],
  },
  seo: {
    slug: 'seo',
    nationalServiceSlug: 'seo',
    h1: 'SEO for Erode businesses that want qualified demand',
    lead:
      'Technical SEO, on-page structure and content support for local and regional visibility—without guaranteed rankings or spammy tactics.',
    sections: [
      {
        title: 'Realistic local SEO',
        body:
          'We improve site structure, performance, metadata and helpful content. Rankings depend on competition, history and ongoing effort—we report what we measure, not promises we cannot prove.',
      },
      {
        title: 'Fit with product and marketing',
        body:
          'SEO works best alongside a credible site and clear offers. We align with your service pages and inquiry flow so traffic can convert.',
      },
    ],
    faqs: [
      {
        question: 'Do you guarantee first page on Google?',
        answer: 'No. We follow best practices and share progress; search engines control rankings.',
      },
    ],
  },
}

export function getErodeLocalServiceSeo(slug: ErodeLocalServiceSlug) {
  const content = erodeLocalServices[slug]
  return {
    path: erodeLocalServicePath(slug),
    documentTitle: `${content.h1} | MUCO LABS`,
    description: content.lead.slice(0, 155),
  }
}
