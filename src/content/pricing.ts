/**
 * Public starting prices verified from mucolabs.com service catalog (Aug 2026).
 * Final quotes depend on scope—always confirmed in writing.
 */
import type { ServiceSlug } from '@/config/routes'

export type ServiceStartingPrice = {
  id: string
  title: string
  category: string
  from: string
  summary: string
  relatedSlug?: ServiceSlug
}

export const serviceStartingPrices: ServiceStartingPrice[] = [
  {
    id: 'web-dev',
    title: 'Website Development',
    category: 'Build',
    from: '₹9,999',
    summary: 'Business websites and marketing surfaces—React/Next.js, SEO-ready.',
    relatedSlug: 'web-development',
  },
  {
    id: 'mobile-dev',
    title: 'Mobile App Development',
    category: 'Build',
    from: '₹49,999',
    summary: 'Cross-platform apps with store publishing support.',
    relatedSlug: 'mobile-app-development',
  },
  {
    id: 'custom-software',
    title: 'Custom Software & SaaS',
    category: 'Build',
    from: '₹79,999',
    summary: 'CRM, ERP, internal tools and multi-tenant SaaS foundations.',
    relatedSlug: 'software-development',
  },
  {
    id: 'ai-solutions',
    title: 'AI Chatbots & Automation',
    category: 'AI',
    from: '₹29,999',
    summary: 'RAG chatbots, workflow automation and AI assist surfaces.',
    relatedSlug: 'ai-solutions',
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing & Ads',
    category: 'Grow',
    from: '₹10,000/mo',
    summary: 'SEO, Google Ads, Meta Ads and performance reporting.',
    relatedSlug: 'digital-marketing',
  },
  {
    id: 'autocad-design',
    title: 'AutoCAD & CAD Drafting',
    category: 'Engineering',
    from: '₹3,999',
    summary: '2D/3D CAD drafting, architectural plans and mechanical modeling.',
  },
  {
    id: 'creative-branding',
    title: 'Branding & Creative',
    category: 'Design',
    from: '₹2,999',
    summary: 'Logo, brand kit and conversion-focused creative assets.',
    relatedSlug: 'ui-ux-design',
  },
]

export type PricingTierId = 'starter' | 'growth' | 'enterprise'

export type PricingTier = {
  id: PricingTierId
  name: string
  priceLabel: string
  bestFor: string
  description: string
  highlights: string[]
  limitations?: string
  cta: string
  featured?: boolean
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: 'From public packages',
    bestFor: 'Single website, MVP or focused product surface',
    description:
      'Ideal when you need one clear outcome—launch a site, ship an MVP or automate a single workflow.',
    highlights: [
      'Discovery & written scope',
      'Design + build sprint',
      'Launch checklist',
      'Post-launch support window',
    ],
    limitations: 'Scope fixed at kickoff; change requests quoted separately.',
    cta: 'Discuss a starter project',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: 'Roadmap-based quote',
    bestFor: 'Teams scaling product, automation or marketing systems',
    description:
      'Multi-phase delivery with iterative releases—product, integrations and growth loops.',
    highlights: [
      'Product & technical roadmap',
      'Milestone billing',
      'Analytics & optimization hooks',
      'Dedicated delivery lead',
    ],
    featured: true,
    cta: 'Plan a growth engagement',
  },
  {
    id: 'enterprise',
    name: 'Custom / Enterprise',
    priceLabel: 'Tailored engagement',
    bestFor: 'Complex platforms, compliance and long-term partnership',
    description:
      'Architecture, security, integrations and SLA-aligned operations for demanding environments.',
    highlights: [
      'Architecture & governance review',
      'Role-based access & audit-friendly delivery',
      'Ongoing maintenance & AMC options',
      'Founder escalation path',
    ],
    cta: 'Talk to MUCO LABS',
  },
]

export const pricingNote =
  'Figures marked “from” are public starting points on mucolabs.com. Your proposal confirms exact scope, timeline and payment terms before work begins.'

export const maintenanceNote =
  'Website and product maintenance (AMC) is scoped monthly based on uptime, updates and support needs—ask for a care plan quote.'
