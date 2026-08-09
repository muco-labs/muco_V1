import { describe, expect, it } from 'vitest'
import {
  computeProposalPricing,
  parseMoney,
  validateProposalDiscount,
} from './proposal-pricing.js'

describe('computeProposalPricing', () => {
  it('sums line totals and applies discount server-side', () => {
    const result = computeProposalPricing(
      [
        { description: 'Design', quantity: '2', unitAmount: '1000' },
        { description: 'Build', quantity: '1', unitAmount: '5000' },
      ],
      '500',
    )
    expect(result.subtotal).toBe('7000.00')
    expect(result.discount).toBe('500.00')
    expect(result.tax).toBe('0.00')
    expect(result.total).toBe('6500.00')
  })

  it('rejects negative unit amounts', () => {
    expect(() =>
      computeProposalPricing([{ description: 'X', quantity: '1', unitAmount: '-1' }]),
    ).toThrow()
  })

  it('rejects discount greater than subtotal', () => {
    expect(() => validateProposalDiscount(100, '150')).toThrow()
  })
})

describe('parseMoney', () => {
  it('rejects invalid values', () => {
    expect(() => parseMoney('abc', 'amount')).toThrow()
  })
})
