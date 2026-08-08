export type PricingTierId = 'starter' | 'growth' | 'enterprise'

export type PricingTier = {
  id: PricingTierId
  name: string
  priceLabel: string
  description: string
  highlights: string[]
  cta: string
  featured?: boolean
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: 'Custom quote',
    description: 'Focused engagements for a single product surface, MVP or marketing site.',
    highlights: [
      'Discovery workshop',
      'Scoped delivery plan',
      'Design + build sprint',
      'Launch support',
    ],
    cta: 'Discuss a starter project',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: 'Starting from scoped roadmap',
    description: 'Multi-phase delivery for teams scaling product, automation or growth systems.',
    highlights: [
      'Product & technical roadmap',
      'Cross-functional squad',
      'Iterative releases',
      'Analytics & optimization hooks',
    ],
    cta: 'Plan a growth engagement',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Custom / Enterprise',
    priceLabel: 'Tailored engagement',
    description: 'Complex platforms, integrations, security requirements and long-term partnership.',
    highlights: [
      'Architecture & governance',
      'Dedicated delivery lead',
      'SLA-aligned operations',
      'Security & compliance alignment',
    ],
    cta: 'Talk to MUCO LABS',
  },
]

export const pricingNote =
  'Commercial figures are confirmed per proposal. Tiers describe engagement shape—not fixed public price lists.'
