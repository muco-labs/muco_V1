import { describe, expect, it } from 'vitest'
import { averageDealValue, conversionRate, sumProposalLineItems } from './metrics.js'

describe('sales metrics', () => {
  it('returns null conversion when sample too small', () => {
    expect(conversionRate(1, 0)).toBeNull()
  })

  it('computes conversion when enough closed deals', () => {
    expect(conversionRate(2, 1)).toBeCloseTo(2 / 3)
  })

  it('returns null average deal below threshold', () => {
    expect(averageDealValue(10000, 2)).toBeNull()
  })

  it('sums line items minus discount', () => {
    expect(
      sumProposalLineItems(
        [
          { quantity: '2', unitAmount: '1000' },
          { quantity: '1', unitAmount: '500' },
        ],
        '500',
      ),
    ).toBe('2000.00')
  })
})
