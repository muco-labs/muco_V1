import { describe, expect, it } from 'vitest'
import { AppError } from '../errors.js'
import { assertCustomerPaymentReadyForRazorpayVerify } from './payment-verify-eligibility.js'

describe('assertCustomerPaymentReadyForRazorpayVerify', () => {
  it('allows idempotent verify when already succeeded', () => {
    expect(() =>
      assertCustomerPaymentReadyForRazorpayVerify(
        { status: 'succeeded', gatewayReference: 'order_old' },
        'order_other',
      ),
    ).not.toThrow()
  })

  it('rejects processing payment without gateway order binding', () => {
    expect(() =>
      assertCustomerPaymentReadyForRazorpayVerify(
        { status: 'processing', gatewayReference: null },
        'order_abc',
      ),
    ).toThrow(AppError)
  })

  it('rejects processing payment when order id does not match', () => {
    expect(() =>
      assertCustomerPaymentReadyForRazorpayVerify(
        { status: 'processing', gatewayReference: 'order_expected' },
        'order_other',
      ),
    ).toThrow(AppError)
  })

  it('allows processing payment when order id matches', () => {
    expect(() =>
      assertCustomerPaymentReadyForRazorpayVerify(
        { status: 'processing', gatewayReference: 'order_expected' },
        'order_expected',
      ),
    ).not.toThrow()
  })

  it('rejects pending payment verification', () => {
    expect(() =>
      assertCustomerPaymentReadyForRazorpayVerify(
        { status: 'pending', gatewayReference: null },
        'order_abc',
      ),
    ).toThrow(AppError)
  })
})
