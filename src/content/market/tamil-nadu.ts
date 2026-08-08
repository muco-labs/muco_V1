import { contact } from '@/content/contact'
import { routePaths, servicePath, type ServiceSlug } from '@/config/routes'

export const tamilNaduHub = {
  path: '/tamil-nadu',
  h1: 'Technology delivery across Tamil Nadu',
  lead:
    'MUCO LABS is headquartered in Erode and partners with businesses across Tamil Nadu—from Chennai and Coimbatore to Madurai, Salem and Tiruppur. We combine on-site collaboration when it helps with remote delivery when it is faster.',
  coverage: [
    'Discovery, written scope and milestone delivery for SMEs, startups and established operators.',
    'Website, software, mobile, AI, automation, UI/UX, SEO and digital marketing under one team.',
    'No fabricated local offices—clear communication about where we meet in person versus remote.',
  ],
  industries:
    'Textiles and apparel, manufacturing support, retail, education, healthcare administration, professional services and export-oriented SMEs are common partners—we scope honestly for each sector.',
  remote:
    'Most projects run with shared boards, async updates and scheduled video reviews. On-site workshops in Tamil Nadu are available when discovery or training benefits from face-to-face time.',
} as const

export const tamilNaduFaqs = [
  {
    question: 'Does MUCO LABS have offices in every Tamil Nadu city?',
    answer:
      'No. We operate from Erode and collaborate remotely across the state. We do not claim physical branches we do not maintain.',
  },
  {
    question: 'Can you visit our site in Chennai or Coimbatore?',
    answer:
      'Yes when travel and scope justify it—typically for discovery or training milestones. Day-to-day execution is usually remote with clear checkpoints.',
  },
  {
    question: 'How is this different from the Erode page?',
    answer:
      'The Erode page focuses on our home market. This hub describes Tamil Nadu-wide coverage and how we work with teams across the state.',
  },
] as const

export const tamilNaduServiceLinks: Array<{ slug: ServiceSlug; label: string; href: string }> = [
  { slug: 'web-development', label: 'Website development', href: servicePath('web-development') },
  { slug: 'software-development', label: 'Software & SaaS', href: servicePath('software-development') },
  { slug: 'ai-solutions', label: 'AI & automation', href: servicePath('ai-solutions') },
  { slug: 'seo', label: 'SEO', href: servicePath('seo') },
]

export const tamilNaduRelatedLinks = [
  { label: 'Erode (home market)', href: routePaths.erode },
  { label: 'India-wide delivery', href: routePaths.india },
  { label: 'Industry solutions', href: routePaths.solutions },
] as const

export const tamilNaduHubSeo = {
  documentTitle: 'MUCO LABS Tamil Nadu | Web, Software & AI',
  description:
    'MUCO LABS delivers websites, custom software, mobile apps, AI and growth programs for Tamil Nadu businesses—remote-first with Erode headquarters.',
  path: '/tamil-nadu',
}

export const tamilNaduContactBlurb = `Questions about a Tamil Nadu project? ${contact.email} · ${contact.phoneDisplay}`
