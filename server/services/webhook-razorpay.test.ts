import { describe, expect, it } from 'vitest'
import { verifyRazorpayWebhookSignature } from './payment.service.js'

describe('razorpay webhook signature', () => {
  it('rejects when webhook secret is not configured', () => {
    expect(verifyRazorpayWebhookSignature('{}', 'sig')).toBe(false)
  })
})
