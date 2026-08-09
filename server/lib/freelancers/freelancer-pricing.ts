import { SUPPORTED_PROPOSAL_CURRENCIES, type ProposalCurrency } from '../currency/constants.js'

export const FREELANCER_PRICING_TYPES = [
  'fixed',
  'starting_from',
  'hourly',
  'per_project',
  'custom_quote',
] as const

export type FreelancerPricingType = (typeof FREELANCER_PRICING_TYPES)[number]

export function isFreelancerPricingType(value: string): value is FreelancerPricingType {
  return (FREELANCER_PRICING_TYPES as readonly string[]).includes(value)
}

export function parseFreelancerPrice(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (Number.isNaN(n) || n < 0) {
    throw new Error('INVALID_PRICE')
  }
  return n.toFixed(2)
}

export function validateFreelancerPricingFields(input: {
  pricingType: FreelancerPricingType
  basePrice: string | null
  minimumPrice: string | null
  currency: string
}) {
  const code = input.currency?.trim().toUpperCase()
  if (!code || !(SUPPORTED_PROPOSAL_CURRENCIES as readonly string[]).includes(code)) {
    throw new Error('INVALID_CURRENCY')
  }
  const currency = code as ProposalCurrency

  if (input.pricingType === 'custom_quote') {
    return { currency, basePrice: input.basePrice, minimumPrice: input.minimumPrice }
  }

  if (!input.basePrice) {
    throw new Error('BASE_PRICE_REQUIRED')
  }

  if (input.minimumPrice) {
    const base = Number.parseFloat(input.basePrice)
    const min = Number.parseFloat(input.minimumPrice)
    if (min > base) {
      throw new Error('MIN_PRICE_EXCEEDS_BASE')
    }
  }

  return { currency, basePrice: input.basePrice, minimumPrice: input.minimumPrice }
}

export function presentFreelancerPricingTypeLabel(type: string): string {
  switch (type) {
    case 'fixed':
      return 'Fixed'
    case 'starting_from':
      return 'Starting from'
    case 'hourly':
      return 'Hourly'
    case 'per_project':
      return 'Per project'
    case 'custom_quote':
      return 'Custom quote'
    default:
      return type.replace(/_/g, ' ')
  }
}

/** Internal freelancer base price — not MUCO customer price. */
export type FreelancerBasePriceFields = {
  pricingType: FreelancerPricingType
  basePrice: string | null
  minimumPrice: string | null
  currency: string
}
