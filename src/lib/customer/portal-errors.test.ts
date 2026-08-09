import { describe, expect, it } from 'vitest'
import { friendlyCustomerPortalError, paymentStatusTone } from '@/lib/customer/portal-errors'

describe('friendlyCustomerPortalError', () => {
  it('maps auth errors', () => {
    expect(friendlyCustomerPortalError('Unauthorized')).toMatch(/sign in/i)
  })

  it('falls back for empty messages', () => {
    expect(friendlyCustomerPortalError('')).toMatch(/something went wrong/i)
  })
})

describe('paymentStatusTone', () => {
  it('classifies paid and failed', () => {
    expect(paymentStatusTone('paid')).toBe('success')
    expect(paymentStatusTone('failed')).toBe('danger')
    expect(paymentStatusTone('pending')).toBe('warning')
  })
})
