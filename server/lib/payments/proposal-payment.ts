import { isProposalPastValidity } from '../proposals/proposal-fulfillment.js'
import { computeProposalPricing } from '../proposals/proposal-pricing.js'

export function resolveProposalPayableTotal(
  proposal: { amount: string | null; discountAmount: string | null; currency: string },
  lineItems: Array<{ description: string; quantity: string; unitAmount: string }>,
): { amount: string; currency: string } | null {
  if (lineItems.length > 0) {
    const pricing = computeProposalPricing(lineItems, proposal.discountAmount, 0)
    const total = Number(pricing.total)
    if (!Number.isFinite(total) || total <= 0) return null
    return { amount: pricing.total, currency: proposal.currency || 'INR' }
  }
  if (proposal.amount) {
    const total = Number(proposal.amount)
    if (!Number.isFinite(total) || total <= 0) return null
    return { amount: Number(total).toFixed(2), currency: proposal.currency || 'INR' }
  }
  return null
}

export function assertProposalPayable(
  proposal: {
    status: string
    customerId: string | null
    validUntil: Date | null
  },
  customerId: string,
): { ok: true } | { ok: false; reason: string } {
  if (proposal.customerId !== customerId) {
    return { ok: false, reason: 'Proposal not found.' }
  }
  if (proposal.status !== 'accepted') {
    return { ok: false, reason: 'Payment is only available for accepted proposals.' }
  }
  if (isProposalPastValidity(proposal.validUntil)) {
    return { ok: false, reason: 'This proposal has expired.' }
  }
  return { ok: true }
}

export const PAYMENT_OPEN_STATUSES = ['pending', 'processing'] as const

export function canTransitionPaymentStatus(
  from: string,
  to: string,
): boolean {
  if (from === to) return true
  const map: Record<string, string[]> = {
    pending: ['processing', 'failed', 'succeeded'],
    processing: ['succeeded', 'failed', 'pending'],
    succeeded: ['refunded'],
    failed: ['pending', 'processing'],
    refunded: [],
  }
  return map[from]?.includes(to) ?? false
}
