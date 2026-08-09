/** Slugs aligned with `src/config/routes.ts` service catalog. */
export const INTAKE_SERVICE_SLUGS = [
  'web-development',
  'software-development',
  'mobile-app-development',
  'ecommerce-development',
  'ai-solutions',
  'ui-ux-design',
  'seo',
  'digital-marketing',
  'automation',
  'technology-consulting',
  'other',
] as const

export type IntakeServiceSlug = (typeof INTAKE_SERVICE_SLUGS)[number]

export const INTAKE_SERVICE_TITLES: Record<IntakeServiceSlug, string> = {
  'web-development': 'Website Development',
  'software-development': 'Custom Software & SaaS',
  'mobile-app-development': 'Mobile App Development',
  'ecommerce-development': 'E-commerce Development',
  'ai-solutions': 'AI Chatbots & Automation',
  'ui-ux-design': 'UI/UX Design',
  seo: 'SEO',
  'digital-marketing': 'Digital Marketing',
  automation: 'Business Automation',
  'technology-consulting': 'Technology Consulting',
  other: 'Other',
}

export function intakeServiceTitle(slug: string, custom?: string | null): string {
  if (slug === 'other' && custom?.trim()) return custom.trim()
  return INTAKE_SERVICE_TITLES[slug as IntakeServiceSlug] ?? slug
}
