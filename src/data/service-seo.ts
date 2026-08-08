import type { ServiceSlug } from '@/config/routes'

export type ServiceFaq = {
  question: string
  answer: string
}

export const serviceFaqs: Partial<Record<ServiceSlug, ServiceFaq[]>> = {
  'web-development': [
    {
      question: 'Do you build marketing sites and product sites?',
      answer:
        'Yes. We engineer public marketing surfaces and product-led sites with performance, accessibility and SEO foundations suited for growth.',
    },
    {
      question: 'Can you work with our existing CMS or headless stack?',
      answer:
        'We integrate with common CMS and headless architectures—or recommend a structure that matches your editorial and engineering workflow.',
    },
  ],
  'software-development': [
    {
      question: 'What kinds of software do you build?',
      answer:
        'Internal tools, customer-facing applications, APIs and platforms—scoped to replace fragile spreadsheets, legacy tools or manual workflows.',
    },
    {
      question: 'How do you keep custom software maintainable?',
      answer:
        'We emphasize clear architecture, automated testing, documentation and observability so your team can extend the system safely.',
    },
  ],
  'ai-solutions': [
    {
      question: 'Do you deploy AI without human oversight?',
      answer:
        'No. We design AI features with evaluation, guardrails and explicit human-in-the-loop steps where decisions affect customers or operations.',
    },
    {
      question: 'Can AI integrate with our existing product?',
      answer:
        'Yes. We focus on production integration—APIs, monitoring and documented limitations—not isolated demos.',
    },
  ],
  seo: [
    {
      question: 'Do you handle technical SEO and content structure?',
      answer:
        'Yes. We address crawlability, site architecture, on-page quality and measurement aligned with how people search for your services.',
    },
    {
      question: 'Do you support local visibility in Erode and Tamil Nadu?',
      answer:
        'We build foundations for local intent where it is genuine—without thin location pages or keyword stuffing.',
    },
  ],
}

export const serviceRelatedSlugs: Record<ServiceSlug, ServiceSlug[]> = {
  'web-development': ['ui-ux-design', 'seo', 'ecommerce-development'],
  'software-development': ['technology-consulting', 'automation', 'ai-solutions'],
  'mobile-app-development': ['software-development', 'ui-ux-design', 'ai-solutions'],
  'ecommerce-development': ['web-development', 'digital-marketing', 'seo'],
  'ai-solutions': ['automation', 'software-development', 'technology-consulting'],
  'ui-ux-design': ['web-development', 'mobile-app-development', 'software-development'],
  seo: ['digital-marketing', 'web-development', 'technology-consulting'],
  'digital-marketing': ['seo', 'web-development', 'ecommerce-development'],
  automation: ['ai-solutions', 'software-development', 'technology-consulting'],
  'technology-consulting': ['software-development', 'automation', 'ai-solutions'],
}
