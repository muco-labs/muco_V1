/** Client-safe proposal currency codes (mirror server/lib/currency/constants). */
export const SUPPORTED_PROPOSAL_CURRENCIES = [
  'INR',
  'USD',
  'GBP',
  'EUR',
  'AUD',
  'CAD',
  'AED',
  'SGD',
] as const

export type ProposalCurrency = (typeof SUPPORTED_PROPOSAL_CURRENCIES)[number]
