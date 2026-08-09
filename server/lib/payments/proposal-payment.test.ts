import { describe, expect, it } from 'vitest'
import { assertProposalPayable, canTransitionPaymentStatus, resolveProposalPayableTotal } from './proposal-payment.js'

describe('resolveProposalPayableTotal', () => {
  it('derives total from line items server-side', () => {
    const result = resolveProposalPayableTotal(
      { amount: null, discountAmount: null, currency: 'INR' },
      [{ description: 'Build', quantity: '1', unitAmount: '5000' }],
    )
    expect(result?.amount).toBe('5000.00')
    expect(result?.currency).toBe('INR')
  })

  it('returns null for zero payable', () => {
    expect(
      resolveProposalPayableTotal(
        { amount: '0', discountAmount: null, currency: 'INR' },
        [],
      ),
    ).toBeNull()
  })
})

describe('assertProposalPayable', () => {
  it('requires accepted status and matching customer', () => {
    expect(
      assertProposalPayable(
        { status: 'accepted', customerId: 'c1', validUntil: null },
        'c1',
      ).ok,
    ).toBe(true)
    expect(
      assertProposalPayable(
        { status: 'sent', customerId: 'c1', validUntil: null },
        'c1',
      ).ok,
    ).toBe(false)
  })

  it('rejects wrong customer', () => {
    expect(
      assertProposalPayable(
        { status: 'accepted', customerId: 'c1', validUntil: null },
        'c2',
      ).ok,
    ).toBe(false)
  })
})

describe('canTransitionPaymentStatus', () => {
  it('allows processing to succeeded', () => {
    expect(canTransitionPaymentStatus('processing', 'succeeded')).toBe(true)
  })

  it('rejects succeeded to pending', () => {
    expect(canTransitionPaymentStatus('succeeded', 'pending')).toBe(false)
  })
})
