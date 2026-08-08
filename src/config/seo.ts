import type { ServiceSlug } from '@/config/routes'
import { servicePath } from '@/config/routes'
import { site } from '@/config/site'

export const defaultOgImagePath = '/og/og-default.svg'

export type PageSeo = {
  path: string
  documentTitle: string
  description: string
  ogImagePath?: string
  noIndex?: boolean
}

const brand = site.name

export const pageSeo = {
  home: {
    path: '/',
    documentTitle: site.defaultTitle,
    description: site.defaultDescription,
  },
  services: {
    path: '/services',
    documentTitle: `Services | ${brand}`,
    description:
      'Website development, software, mobile apps, AI, automation, UI/UX, SEO and digital marketing—delivered as one technology ecosystem by MUCO LABS.',
  },
  solutions: {
    path: '/solutions',
    documentTitle: `Solutions by industry | ${brand}`,
    description:
      'Industry-focused technology solutions from MUCO LABS—manufacturing, ecommerce, healthcare, education and startups across India.',
  },
  work: {
    path: '/work',
    documentTitle: `Our Work | ${brand}`,
    description:
      'Concept and demo work from MUCO LABS—clearly labelled explorations that show capability without misrepresenting client engagements.',
  },
  about: {
    path: '/about',
    documentTitle: `About ${brand} | Technology & Digital Solutions`,
    description:
      'MUCO LABS is a technology company from Erode, Tamil Nadu—building software, design, automation and growth systems for ambitious teams.',
  },
  insights: {
    path: '/insights',
    documentTitle: `Insights | ${brand}`,
    description:
      'Perspectives on web development, software, AI, automation, SEO and digital marketing from the MUCO LABS team.',
    noIndex: true,
  },
  erode: {
    path: '/erode',
    documentTitle: `MUCO LABS Erode | Web, Software & AI Development`,
    description:
      'MUCO LABS in Erode, Tamil Nadu—website development, custom software, mobile apps, AI, SEO and digital marketing with founder-led delivery.',
  },
  tamilNadu: {
    path: '/tamil-nadu',
    documentTitle: `MUCO LABS Tamil Nadu | Web, Software & AI`,
    description:
      'Technology partner for Tamil Nadu businesses—websites, software, mobile, AI and growth programs with Erode headquarters and remote delivery.',
  },
  india: {
    path: '/india',
    documentTitle: `MUCO LABS India | Software, Web & AI Development`,
    description:
      'India-wide delivery from MUCO LABS—custom software, websites, mobile apps, AI, automation and SEO with transparent proposals.',
  },
  contact: {
    path: '/contact',
    documentTitle: `Start a Project | ${brand}`,
    description:
      'Tell MUCO LABS what you are building. Share your goals for website development, software, mobile, AI or growth—and we will suggest a practical next step.',
  },
  pricing: {
    path: '/pricing',
    documentTitle: `Pricing & Engagement | ${brand}`,
    description:
      'Engagement tiers for technology projects with MUCO LABS—Starter, Growth and Custom/Enterprise scopes with proposal-led pricing.',
  },
  privacy: {
    path: '/privacy-policy',
    documentTitle: `Privacy Policy | ${brand}`,
    description: `How ${brand} collects, uses and protects information when you use our website and services.`,
  },
  terms: {
    path: '/terms',
    documentTitle: `Terms of Service | ${brand}`,
    description: `Terms governing use of the ${brand} website and related services.`,
  },
  cookies: {
    path: '/cookie-policy',
    documentTitle: `Cookie Policy | ${brand}`,
    description: `How ${brand} uses cookies and similar technologies on this website.`,
  },
  notFound: {
    path: '/404',
    documentTitle: `Page Not Found | ${brand}`,
    description: 'The page you requested could not be found. Explore services or start a project with MUCO LABS.',
    noIndex: true,
  },
  authSignIn: {
    path: '/auth/sign-in',
    documentTitle: `Sign In | ${brand}`,
    description: 'Customer portal sign-in for MUCO LABS (coming soon).',
    noIndex: true,
  },
  authSignUp: {
    path: '/auth/sign-up',
    documentTitle: `Sign Up | ${brand}`,
    description: 'Create a MUCO LABS customer account (coming soon).',
    noIndex: true,
  },
} as const satisfies Record<string, PageSeo>

export type ServiceSeo = PageSeo & {
  h1: string
}

const serviceSeoEntries: Record<ServiceSlug, Omit<ServiceSeo, 'path'> & { path?: string }> = {
  'web-development': {
    documentTitle: `Web Development Company | ${brand}`,
    description:
      'Website development for brands and product teams—fast, accessible sites engineered for conversion, SEO and long-term growth.',
    h1: 'Website development',
  },
  'software-development': {
    documentTitle: `Software Development Company | ${brand}`,
    description:
      'Custom software development—applications, internal tools and platforms built for real operations and maintainable scale.',
    h1: 'Software development',
  },
  'mobile-app-development': {
    documentTitle: `Mobile App Development | ${brand}`,
    description:
      'Mobile app development for iOS and Android—connected to secure backends, analytics and release discipline.',
    h1: 'Mobile app development',
  },
  'ecommerce-development': {
    documentTitle: `E-commerce Development | ${brand}`,
    description:
      'E-commerce development for retailers and D2C brands—storefronts, payments and merchandising built for conversion.',
    h1: 'E-commerce development',
  },
  'ai-solutions': {
    documentTitle: `AI Solutions & Development | ${brand}`,
    description:
      'Applied AI solutions embedded in products and operations—with evaluation, guardrails and human oversight.',
    h1: 'AI solutions',
  },
  'ui-ux-design': {
    documentTitle: `UI/UX Design | ${brand}`,
    description:
      'UI/UX design for digital products—research, flows, design systems and engineering-ready interfaces.',
    h1: 'UI/UX design',
  },
  seo: {
    documentTitle: `SEO Services | ${brand}`,
    description:
      'SEO services aligned with search intent—technical foundations, content architecture and measurement you can act on.',
    h1: 'SEO services',
  },
  'digital-marketing': {
    documentTitle: `Digital Marketing | ${brand}`,
    description:
      'Digital marketing connected to product and analytics—campaign systems, landing experiences and iteration.',
    h1: 'Digital marketing',
  },
  automation: {
    documentTitle: `Business Automation | ${brand}`,
    description:
      'Business automation between tools and teams—reliable workflows, integrations and visible logging.',
    h1: 'Business automation',
  },
  'technology-consulting': {
    documentTitle: `Technology Consulting | ${brand}`,
    description:
      'Technology consulting for architecture, stack and delivery decisions—before major platform investments.',
    h1: 'Technology consulting',
  },
}

export function getServiceSeo(slug: ServiceSlug): ServiceSeo {
  const entry = serviceSeoEntries[slug]
  return {
    path: servicePath(slug),
    documentTitle: entry.documentTitle,
    description: entry.description,
    h1: entry.h1,
  }
}

export function getWorkProjectSeo(project: {
  id: string
  title: string
  tagline: string
  kind: string
}): PageSeo {
  return {
    path: `/work/${project.id}`,
    documentTitle: `${project.title} | Work | ${brand}`,
    description: `${project.tagline} — ${portfolioKindLabelForSeo(project.kind)} from MUCO LABS.`,
  }
}

function portfolioKindLabelForSeo(kind: string): string {
  const labels: Record<string, string> = {
    client: 'Client project',
    internal: 'Internal project',
    concept: 'Concept project',
    demo: 'Demo',
    case_study: 'Case study',
  }
  return labels[kind] ?? 'Project'
}

export function absoluteOgImageUrl(siteUrl: string, imagePath = defaultOgImagePath): string {
  return `${siteUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`
}
