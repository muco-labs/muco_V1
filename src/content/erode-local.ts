import { contact } from '@/content/contact'

export const erodeLocalPage = {
  path: '/erode',
  h1: 'Technology partner in Erode, Tamil Nadu',
  lead:
    'MUCO LABS is a founder-led technology company based in Erode. We design and build websites, software, mobile apps, AI systems and growth programs for businesses in Tamil Nadu—and teams across India and abroad.',
  coverage: [
    'On-site and remote collaboration with businesses in Erode and nearby districts.',
    'Delivery for Tamil Nadu, national and international clients when async communication fits the project.',
    'Clear proposals, milestone billing and direct founder oversight—no opaque agency layers.',
  ],
  industries:
    'We work with SMEs, startups and established operators in retail, services, manufacturing support, education and professional firms—anywhere dependable software and digital presence matter.',
  contactBlurb: `Reach us at ${contact.email} or ${contact.phoneDisplay}. Office hours Mon–Sat, ${contact.hours.opens}–${contact.hours.closes} IST.`,
} as const

export const erodeLocalFaqs = [
  {
    question: 'Does MUCO LABS only work with clients in Erode?',
    answer:
      'No. We are headquartered in Erode and serve local businesses closely, but we also deliver for clients across Tamil Nadu, India and remote international engagements.',
  },
  {
    question: 'What services does MUCO LABS offer in Erode?',
    answer:
      'Website development, custom software, mobile apps, ecommerce, AI and automation, UI/UX, SEO and digital marketing—scoped to your goals and budget.',
  },
  {
    question: 'How do I get a quote for a project in Erode?',
    answer:
      'Use our contact form or call us. We respond with clarifying questions, then a written scope and quote—public starting prices are listed on the pricing page.',
  },
] as const

export { erodeServiceLinks } from '@/data/erode'
