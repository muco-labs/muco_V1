/** Supported proposal/invoice currencies — extend only after payment/legal review. */
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

export function normalizeProposalCurrency(value?: string | null): ProposalCurrency {
  const code = value?.trim().toUpperCase()
  if (code && (SUPPORTED_PROPOSAL_CURRENCIES as readonly string[]).includes(code)) {
    return code as ProposalCurrency
  }
  return 'INR'
}

export function formatCurrencyLabel(code: ProposalCurrency): string {
  return code
}
