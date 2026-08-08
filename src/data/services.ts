import type { ServiceSlug } from '@/config/routes'
import { servicePath } from '@/config/routes'

export type ServiceCategoryId =
  | 'build'
  | 'design'
  | 'ai-automation'
  | 'grow'
  | 'technology'
  | 'creative'

export type ServiceOffering = {
  id: string
  slug?: ServiceSlug
  title: string
  href?: string
}

export type ServiceCategory = {
  id: ServiceCategoryId
  title: string
  offerings: ServiceOffering[]
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'build',
    title: 'Build',
    offerings: [
      {
        id: 'website-development',
        slug: 'web-development',
        title: 'Website Development',
      },
      {
        id: 'software-development',
        slug: 'software-development',
        title: 'Software Development',
      },
      {
        id: 'ecommerce',
        slug: 'ecommerce-development',
        title: 'E-commerce',
      },
      {
        id: 'mobile-applications',
        slug: 'mobile-app-development',
        title: 'Mobile Applications',
      },
      { id: 'saas', title: 'SaaS' },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    offerings: [
      { id: 'ui-ux', slug: 'ui-ux-design', title: 'UI/UX' },
      { id: 'product-design', title: 'Product Design' },
      { id: 'branding', title: 'Branding' },
    ],
  },
  {
    id: 'ai-automation',
    title: 'AI & Automation',
    offerings: [
      { id: 'ai-solutions', slug: 'ai-solutions', title: 'AI Solutions' },
      { id: 'ai-agents', title: 'AI Agents' },
      { id: 'business-automation', slug: 'automation', title: 'Business Automation' },
      { id: 'workflow-automation', title: 'Workflow Automation' },
    ],
  },
  {
    id: 'grow',
    title: 'Growth',
    offerings: [
      { id: 'seo', slug: 'seo', title: 'SEO' },
      {
        id: 'digital-marketing',
        slug: 'digital-marketing',
        title: 'Digital Marketing',
      },
      { id: 'performance-marketing', title: 'Performance Marketing' },
      { id: 'conversion-optimization', title: 'Conversion Optimization' },
    ],
  },
  {
    id: 'technology',
    title: 'Technology',
    offerings: [
      { id: 'cloud', title: 'Cloud' },
      { id: 'devops', title: 'DevOps' },
      { id: 'security', title: 'Cybersecurity' },
      {
        id: 'technology-consulting',
        slug: 'technology-consulting',
        title: 'Technology Consulting',
      },
    ],
  },
  {
    id: 'creative',
    title: 'Creative',
    offerings: [
      { id: 'video', title: 'Video' },
      { id: 'motion', title: 'Motion' },
      { id: 'content', title: 'Content' },
    ],
  },
]

export type ServicePageMeta = {
  slug: ServiceSlug
  title: string
  categoryId: ServiceCategoryId
}

export const servicePages: ServicePageMeta[] = [
  {
    slug: 'web-development',
    title: 'Website Development',
    categoryId: 'build',
  },
  {
    slug: 'software-development',
    title: 'Software Development',
    categoryId: 'build',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile Application Development',
    categoryId: 'build',
  },
  {
    slug: 'ecommerce-development',
    title: 'E-commerce Development',
    categoryId: 'build',
  },
  {
    slug: 'ai-solutions',
    title: 'AI Solutions',
    categoryId: 'ai-automation',
  },
  {
    slug: 'ui-ux-design',
    title: 'UI/UX Design',
    categoryId: 'design',
  },
  { slug: 'seo', title: 'SEO', categoryId: 'grow' },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    categoryId: 'grow',
  },
  {
    slug: 'automation',
    title: 'Automation',
    categoryId: 'ai-automation',
  },
  {
    slug: 'technology-consulting',
    title: 'Technology Consulting',
    categoryId: 'technology',
  },
]

export function getServiceBySlug(slug: string): ServicePageMeta | undefined {
  return servicePages.find((service) => service.slug === slug)
}

export function resolveOfferingHref(offering: ServiceOffering): string | undefined {
  if (offering.href) return offering.href
  if (offering.slug) return servicePath(offering.slug)
  return undefined
}

export const allRoutableOfferings = serviceCategories.flatMap((category) =>
  category.offerings
    .map((offering) => ({
      ...offering,
      categoryId: category.id,
      href: resolveOfferingHref(offering),
    }))
    .filter((o) => o.href),
)
