import { MIN_SAMPLE_FOR_AVERAGE_DEAL, MIN_SAMPLE_FOR_CONVERSION_RATE } from './constants.js'

export function conversionRate(won: number, lost: number): number | null {
  const closed = won + lost
  if (closed < MIN_SAMPLE_FOR_CONVERSION_RATE) return null
  return won / closed
}

export function averageDealValue(totalWonRevenue: number, wonDeals: number): number | null {
  if (wonDeals < MIN_SAMPLE_FOR_AVERAGE_DEAL || totalWonRevenue <= 0) return null
  return totalWonRevenue / wonDeals
}

export function sumProposalLineItems(
  items: Array<{ quantity: string; unitAmount: string }>,
  discountAmount?: string | null,
): string {
  let subtotal = 0
  for (const row of items) {
    subtotal += Number(row.quantity) * Number(row.unitAmount)
  }
  const discount = discountAmount ? Number(discountAmount) : 0
  const total = Math.max(0, subtotal - discount)
  return total.toFixed(2)
}
