import { describe, expect, it } from 'vitest'
import { friendlyPaymentError } from './payment-errors'

describe('friendlyPaymentError', () => {
  it('maps verification failures', () => {
    expect(friendlyPaymentError('Payment verification failed')).toContain('verify')
  })

  it('passes through short validation messages', () => {
    expect(friendlyPaymentError('This invoice is not payable.')).toBe('This invoice is not payable.')
  })
})
