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
    summary: 'Fast, accessible marketing and product sites engineered for conversion and SEO.',
    problem: 'Sites that load slowly, read generically and cannot support campaigns.',
    delivers: ['Responsive UI', 'SEO foundation', 'Analytics hooks', 'Launch support'],
    from: '₹9,999',
  },
  {
    slug: 'software-development',
    title: 'Custom Software & SaaS',
    category: 'Build',
    summary: 'CRM, ERP, internal tools and SaaS platforms tailored to your workflow.',
    problem: 'Spreadsheets and off-the-shelf tools that break as you scale.',
    delivers: ['Multi-tenant architecture', 'Role-based access', 'APIs & integrations', 'Documentation'],
    from: '₹79,999',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    category: 'Build',
    summary: 'React Native & Flutter apps with store publishing support.',
    problem: 'Mobile ideas stuck in prototypes without reliable release paths.',
    delivers: ['Cross-platform apps', 'Backend APIs', 'Push notifications', 'Store assets'],
    from: '₹49,999',
  },
  {
    slug: 'ai-solutions',
    title: 'AI Chatbots & Automation',
    category: 'AI',
    summary: 'RAG assistants, workflow automation and AI surfaces with human oversight.',
    problem: 'Support and ops teams drowning in repetitive work without auditability.',
    delivers: ['Trained assistants', 'Embeddable widgets', 'Integrations', 'Analytics'],
    from: '₹29,999',
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Grow',
    summary: 'SEO, paid media and reporting tied to your product—not isolated campaigns.',
    problem: 'Ad spend without clear attribution or landing experiences.',
    delivers: ['SEO & content plan', 'Ad setup', 'Conversion tracking', 'Monthly reporting'],
    from: '₹10,000/mo',
  },
  {
    slug: 'automation',
    title: 'Business Automation',
    category: 'AI',
    summary: 'Integrations and workflows between the tools your team already uses.',
    problem: 'Manual copy-paste between CRM, billing and support.',
    delivers: ['Workflow design', 'Webhooks & APIs', 'Error handling', 'Audit logs'],
  },
]
