import { contact } from '@/content/contact'
import { routePaths, servicePath, type ServiceSlug } from '@/config/routes'

export const indiaHub = {
  path: '/india',
  h1: 'Technology partner for India-wide teams',
  lead:
    'MUCO LABS builds websites, custom software, mobile apps, AI systems and growth programs for businesses across India. We are based in Erode, Tamil Nadu, and deliver remotely with founder-led engineering and transparent proposals.',
  coverage: [
    'National clients in manufacturing, retail, ecommerce, education, healthcare ops, professional services and startups.',
    'Security-conscious delivery: access control, documented handover and support paths after launch.',
    'We do not claim a nationwide office network—collaboration is remote-first with travel when agreed in scope.',
  ],
  delivery: [
    'Shared roadmap, milestone billing and direct access to the people building your product.',
    'IST-friendly meetings; async updates for distributed teams.',
    'Integrations with payments (including Razorpay), analytics and existing business tools where required.',
  ],
  industries:
    'See industry solution pages for manufacturing, ecommerce, healthcare, education and startups—each describes problems and approaches without generic keyword filler.',
} as const

export const indiaFaqs = [
  {
    question: 'Do you only work in South India?',
    answer:
      'No. We serve clients across India and international teams. Tamil Nadu is our base; delivery is not limited by geography when remote collaboration fits the project.',
  },
  {
    question: 'How do you price India-wide projects?',
    answer:
      'We publish starting tiers on the pricing page and follow with proposal-led quotes after discovery. No fake discounts or pressure tactics.',
  },
  {
    question: 'Can you sign NDAs and work with enterprise procurement?',
    answer:
      'Yes. Share your process during inquiry—we align documentation, milestones and invoicing to what your team requires.',
  },
] as const

export const indiaServiceLinks: Array<{ slug: ServiceSlug; label: string; href: string }> = [
  { slug: 'web-development', label: 'Website development', href: servicePath('web-development') },
  { slug: 'software-development', label: 'Software development', href: servicePath('software-development') },
  { slug: 'mobile-app-development', label: 'Mobile apps', href: servicePath('mobile-app-development') },
  { slug: 'ecommerce-development', label: 'Ecommerce', href: servicePath('ecommerce-development') },
  { slug: 'ai-solutions', label: 'AI solutions', href: servicePath('ai-solutions') },
  { slug: 'automation', label: 'Automation', href: servicePath('automation') },
]

export const indiaRelatedLinks = [
  { label: 'Tamil Nadu', href: routePaths.tamilNadu },
  { label: 'Erode', href: routePaths.erode },
  { label: 'Solutions by industry', href: routePaths.solutions },
  { label: 'Work & demos', href: routePaths.work },
] as const

export const indiaHubSeo = {
  documentTitle: 'MUCO LABS India | Software, Web & AI Development',
  description:
    'India-wide technology delivery from MUCO LABS—websites, software, mobile, AI, automation and SEO with remote collaboration and Erode, Tamil Nadu headquarters.',
  path: '/india',
}

export const indiaContactBlurb = `Start a national project: ${contact.email} · ${contact.phoneDisplay}`
