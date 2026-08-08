import { contact } from '@/content/contact'
import { routePaths, servicePath, type ServiceSlug } from '@/config/routes'

export const internationalHub = {
  path: '/international',
  h1: 'Remote technology delivery for global teams',
  lead:
    'MUCO LABS is based in Erode, Tamil Nadu, India. We partner with startups and businesses in the United States, United Kingdom, Canada, Australia, the UAE, Singapore and other markets—through clear English communication, milestone delivery and security-conscious engineering.',
  services:
    'Website and product development, custom software and SaaS, mobile apps, AI and automation, UI/UX, SEO and integrations—scoped with written proposals before work begins.',
  delivery: [
    'Async-friendly updates with scheduled video reviews in overlapping time zones (IST core hours with flexibility for US/UK/AU meetings).',
    'Documentation, access control and handover so your team can maintain or extend the product.',
    'We do not operate international offices; collaboration is remote unless travel is explicitly agreed in scope.',
  ],
  trust: [
    'Founder-led technical oversight on engagements.',
    'Concept and demo work is labelled honestly in our portfolio—never presented as unnamed “global clients”.',
    'Payments: INR via Razorpay for many India engagements; international proposals can be quoted in USD, GBP, AUD, CAD, AED or SGD where agreed—final terms on the signed proposal.',
  ],
  privacy:
    'We collect only what you share in inquiries. Cross-border data handling for regulated industries must be agreed in contract—do not assume compliance certifications we have not verified.',
} as const

export const internationalFaqs = [
  {
    question: 'Does MUCO LABS have offices in the US or UK?',
    answer:
      'No. We are headquartered in India and deliver remotely. We do not claim physical presence where we do not operate.',
  },
  {
    question: 'What currencies do you quote in?',
    answer:
      'Public pricing on this site uses INR starting points. International proposals can use USD, GBP, EUR, AUD, CAD, AED or SGD when scope and payment method are agreed in writing.',
  },
  {
    question: 'How do time zones work?',
    answer:
      'Share your time zone in the inquiry form if you like—we schedule meetings in overlapping windows and avoid messaging outside reasonable local hours.',
  },
] as const

export const internationalServiceLinks: Array<{ slug: ServiceSlug; label: string; href: string }> = [
  { slug: 'software-development', label: 'Software development', href: servicePath('software-development') },
  { slug: 'web-development', label: 'Web development', href: servicePath('web-development') },
  { slug: 'ai-solutions', label: 'AI solutions', href: servicePath('ai-solutions') },
  { slug: 'mobile-app-development', label: 'Mobile apps', href: servicePath('mobile-app-development') },
  { slug: 'ecommerce-development', label: 'Ecommerce', href: servicePath('ecommerce-development') },
]

export const internationalRelatedLinks = [
  { label: 'India delivery', href: routePaths.india },
  { label: 'Solutions by industry', href: routePaths.solutions },
  { label: 'Work & demos', href: routePaths.work },
  { label: 'Pricing (INR starting points)', href: routePaths.pricing },
] as const

export const internationalHubSeo = {
  documentTitle: 'MUCO LABS International | Software & AI Development',
  description:
    'Remote software, web, mobile and AI development from MUCO LABS (India)—for US, UK, Canada, Australia, UAE, Singapore and global teams. No fabricated offices.',
  path: '/international',
}

export const internationalContactBlurb = `Global inquiries: ${contact.email} · ${contact.phoneDisplay}`
