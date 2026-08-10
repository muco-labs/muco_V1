import type { ServiceSlug } from '@/config/routes'

export type ServiceHighlight = {
  slug: ServiceSlug
  title: string
  category: string
  summary: string
  problem: string
  delivers: string[]
  from?: string
}

/** Summaries aligned with public mucolabs.com catalog; detail pages use service-content.ts */
export const serviceHighlights: ServiceHighlight[] = [
  {
    slug: 'web-development',
    title: 'Website Development',
    category: 'Build',
    summary:
      'High-speed, SEO-optimized websites and web apps built with React, Next.js and TypeScript.',
    problem: 'Sites that load slowly, read generically and cannot support campaigns.',
    delivers: ['Custom UI/UX', 'React / Next.js source', 'Technical SEO', 'Launch & hosting support'],
    from: '₹9,999',
  },
  {
    slug: 'software-development',
    title: 'Custom Software & SaaS',
    category: 'Build',
    summary: 'CRM, ERP, internal tools and multi-tenant SaaS platforms tailored to your workflow.',
    problem: 'Spreadsheets and off-the-shelf tools that break as you scale.',
    delivers: ['Multi-tenant architecture', 'Role-based access', 'Billing & APIs', 'Admin consoles'],
    from: '₹79,999',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    category: 'Build',
    summary:
      'Native-grade iOS & Android apps with React Native or Flutter and store publishing support.',
    problem: 'Mobile ideas stuck in prototypes without reliable release paths.',
    delivers: ['Cross-platform apps', 'Backend APIs', 'Push notifications', 'Store listing assets'],
    from: '₹49,999',
  },
  {
    slug: 'ai-solutions',
    title: 'AI Chatbots & Automation',
    category: 'AI',
    summary: 'Custom RAG assistants, WhatsApp bots and OCR workflows with human oversight.',
    problem: 'Support and ops teams drowning in repetitive work without auditability.',
    delivers: ['Trained agents', 'Embeddable widgets', 'WhatsApp integration', 'Analytics dashboard'],
    from: '₹29,999',
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Grow',
    summary: 'SEO, Google/Meta ads and social growth campaigns with transparent ROI reporting.',
    problem: 'Ad spend without clear attribution or landing experiences.',
    delivers: ['SEO & content plan', 'Ad creatives', 'Conversion tracking', 'Monthly ROI reports'],
    from: '₹10,000/mo',
  },
  {
    slug: 'automation',
    title: 'Business Automation',
    category: 'AI',
    summary:
      'WhatsApp Business API, CRM/ERP workflows and cloud integrations that remove busywork.',
    problem: 'Manual copy-paste between CRM, billing and support.',
    delivers: ['Workflow design', 'Webhooks & APIs', 'Error handling', 'Audit logs'],
  },
  {
    slug: 'ecommerce-development',
    title: 'E-commerce Development',
    category: 'Build',
    summary: 'Storefronts and B2B marketplaces built for merchandising, payments and fulfillment.',
    problem: 'Stores that are slow, hard to update and leak revenue at checkout.',
    delivers: ['Storefront UX', 'Payments & shipping', 'Catalog tooling', 'Growth hooks'],
    from: 'Custom quote',
  },
  {
    slug: 'ui-ux-design',
    title: 'UI/UX Design',
    category: 'Design',
    summary: 'Research, flows, brand systems and production-ready UI your engineers can ship.',
    problem: 'Interfaces that look fine in mockups but fail in real workflows.',
    delivers: ['User flows', 'Design systems', 'High-fidelity UI', 'Developer handoff'],
    from: '₹2,999',
  },
  {
    slug: 'seo',
    title: 'SEO',
    category: 'Grow',
    summary: 'Technical SEO, structured data and content architecture for crawlability and rankings.',
    problem: 'Pages that cannot be crawled, indexed or matched to intent.',
    delivers: ['Technical audit', 'On-page structure', 'Content plan', 'Measurement'],
    from: 'Custom quote',
  },
  {
    slug: 'technology-consulting',
    title: 'Technology Consulting',
    category: 'Advisory',
    summary: 'Architecture, WhatsApp API setup and CTO-level guidance before major investments.',
    problem: 'Expensive commitments made without an independent technical view.',
    delivers: ['Architecture reviews', 'Cloud maps', 'Vendor evaluation', 'Delivery roadmaps'],
    from: '₹5,000',
  },
]
