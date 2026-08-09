export type ProposalLineInput = {
  description: string
  quantity?: string
  unitAmount: string
  itemType?: string
  sortOrder?: number
}

export type ProposalPricingResult = {
  lineTotals: Array<{ description: string; lineTotal: string }>
  subtotal: string
  discount: string
  tax: string
  total: string
}

const MONEY_SCALE = 2

function roundMoney(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('INVALID_AMOUNT')
  }
  return value.toFixed(MONEY_SCALE)
}

export function parseMoney(value: string, field: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`INVALID_${field.toUpperCase()}`)
  }
  return n
}

export function validateProposalDiscount(subtotal: number, discountAmount: string | null | undefined) {
  if (discountAmount == null || discountAmount === '') return
  const discount = parseMoney(discountAmount, 'discount')
  if (discount > subtotal) {
    throw new Error('DISCOUNT_EXCEEDS_SUBTOTAL')
  }
}

export function computeProposalPricing(
  items: Array<{ description: string; quantity: string; unitAmount: string }>,
  discountAmount?: string | null,
  taxRateBps = 0,
): ProposalPricingResult {
  let subtotal = 0
  const lineTotals: ProposalPricingResult['lineTotals'] = []

  for (const row of items) {
    const qty = parseMoney(row.quantity, 'quantity')
    const unit = parseMoney(row.unitAmount, 'unit_amount')
    const line = qty * unit
    subtotal += line
    lineTotals.push({ description: row.description, lineTotal: roundMoney(line) })
  }

  validateProposalDiscount(subtotal, discountAmount)
  const discount = discountAmount ? parseMoney(discountAmount, 'discount') : 0
  const taxable = Math.max(0, subtotal - discount)
  const tax =
    taxRateBps > 0 ? (taxable * taxRateBps) / 10_000 : 0
  const total = taxable + tax

  return {
    lineTotals,
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    total: roundMoney(total),
  }
}
