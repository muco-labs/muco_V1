import { routePaths } from '@/config/routes'
import { servicePath, type ServiceSlug } from '@/config/routes'

export const hero = {
  headline: "Build what's next.",
  subcopy:
    'MUCO LABS designs, builds, automates and grows digital products and businesses through technology, software and AI.',
  primaryCta: 'Start a Project',
  secondaryCta: 'Explore Services',
} as const

export const intro = {
  headline: 'Design. Build. Automate. Grow.',
  body: 'MUCO LABS combines strategy, design, engineering, AI and digital growth to ship practical technology—systems that work in the real world and scale as your business does.',
} as const

export type CapabilityId = 'build' | 'design' | 'automate' | 'grow'

export const capabilities: Array<{
  id: CapabilityId
  title: string
  description: string
  href: string
}> = [
  {
    id: 'build',
    title: 'Build',
    description:
      'Websites, software, e-commerce, mobile applications and digital products.',
    href: routePaths.services,
  },
  {
    id: 'design',
    title: 'Design',
    description: 'UI/UX, product experiences and brand systems.',
    href: routePaths.services,
  },
  {
    id: 'automate',
    title: 'Automate',
    description: 'AI solutions, intelligent workflows and business automation.',
    href: servicePath('automation'),
  },
  {
    id: 'grow',
    title: 'Grow',
    description: 'SEO, digital marketing and conversion-focused digital systems.',
    href: servicePath('seo'),
  },
]

export const whyPrinciples = [
  {
    index: '01',
    title: 'Built for outcomes',
    body: 'Every engagement ties back to measurable business results—not deliverables for their own sake.',
  },
  {
    index: '02',
    title: 'Design meets engineering',
    body: 'Product thinking and production-grade engineering in one team, from concept through launch.',
  },
  {
    index: '03',
    title: 'Technology-first thinking',
    body: 'Architecture, security and performance are planned early, not patched in later.',
  },
  {
    index: '04',
    title: 'AI where it creates real value',
    body: 'Applied intelligence where it saves time, reduces error, or unlocks new capability.',
  },
  {
    index: '05',
    title: 'Built to scale',
    body: 'Systems designed for growth—clean codebases, observable infrastructure, maintainable UX.',
  },
  {
    index: '06',
    title: 'Long-term partnership',
    body: 'We stay engaged after launch with iteration, support and continuous improvement.',
  },
] as const

export const processStages = [
  { index: '01', title: 'Discover', body: 'Goals, constraints, users and success metrics.' },
  { index: '02', title: 'Strategize', body: 'Roadmap, architecture and delivery approach.' },
  { index: '03', title: 'Design', body: 'Experience, interfaces and technical specification.' },
  { index: '04', title: 'Build', body: 'Engineering, integration and quality assurance.' },
  { index: '05', title: 'Launch', body: 'Deployment, monitoring and handover.' },
  { index: '06', title: 'Grow', body: 'Optimization, automation and ongoing evolution.' },
] as const

export const techNodes = [
  { id: 'ai', label: 'AI' },
  { id: 'web', label: 'Web' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'automation', label: 'Automation' },
  { id: 'data', label: 'Data' },
  { id: 'security', label: 'Security' },
] as const

export const industries = [
  'Startups',
  'Retail',
  'E-commerce',
  'Manufacturing',
  'Education',
  'Healthcare',
  'Hospitality',
  'Real Estate',
  'Professional Services',
  'Technology',
] as const

export const conceptWork = [
  {
    id: 'ops-dashboard',
    title: 'Operations control surface',
    type: 'Concept work',
    discipline: 'Product · Software',
    description:
      'Internal concept for a unified operations dashboard—real-time status, workflows and role-based views.',
  },
  {
    id: 'commerce-system',
    title: 'Composable commerce experience',
    type: 'Concept work',
    discipline: 'E-commerce · Design',
    description:
      'Exploration of a modular storefront architecture with performance-first UX and flexible merchandising.',
  },
  {
    id: 'ai-workflows',
    title: 'Intelligent workflow layer',
    type: 'Concept work',
    discipline: 'AI · Automation',
    description:
      'Prototype patterns for AI-assisted business workflows with human oversight and auditability.',
  },
] as const

export const localPositioning = {
  eyebrow: 'Based in Erode',
  headline: 'Built in Erode. Ready for the world.',
  body: 'MUCO LABS is growing from Erode—serving teams across Tamil Nadu, India and international markets with the same engineering discipline and care.',
} as const

export const finalCta = {
  headline: 'Have an idea worth building?',
  subcopy: "Let's turn it into something real.",
  primary: 'Start a Project',
  secondary: 'Talk to MUCO LABS',
} as const

export type ServiceLink = {
  label: string
  slug?: ServiceSlug
}

export const serviceGroups: Array<{
  title: string
  items: ServiceLink[]
}> = [
  {
    title: 'Build',
    items: [
      { label: 'Website Development', slug: 'web-development' },
      { label: 'Software Development', slug: 'software-development' },
      { label: 'E-commerce', slug: 'ecommerce-development' },
      { label: 'Mobile Applications', slug: 'mobile-app-development' },
      { label: 'SaaS' },
    ],
  },
  {
    title: 'Design',
    items: [
      { label: 'UI/UX', slug: 'ui-ux-design' },
      { label: 'Product Design' },
      { label: 'Branding' },
    ],
  },
  {
    title: 'AI & Automation',
    items: [
      { label: 'AI Solutions', slug: 'ai-solutions' },
      { label: 'AI Agents' },
      { label: 'Business Automation', slug: 'automation' },
      { label: 'Workflow Automation' },
    ],
  },
  {
    title: 'Grow',
    items: [
      { label: 'SEO', slug: 'seo' },
      { label: 'Digital Marketing', slug: 'digital-marketing' },
      { label: 'Performance Marketing' },
      { label: 'Conversion Optimization' },
    ],
  },
  {
    title: 'Technology',
    items: [
      { label: 'Cloud' },
      { label: 'DevOps' },
      { label: 'Security' },
      { label: 'Technology Consulting', slug: 'technology-consulting' },
    ],
  },
  {
    title: 'Creative',
    items: [{ label: 'Video' }, { label: 'Motion' }, { label: 'Content' }],
  },
]

export function serviceLinkHref(item: ServiceLink): string | undefined {
  return item.slug ? servicePath(item.slug) : undefined
}
