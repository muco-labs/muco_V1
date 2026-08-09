import { describe, expect, it } from 'vitest'
import { formatPaymentReference } from './payment-reference.js'

describe('formatPaymentReference', () => {
  it('formats stable PAY references', () => {
    expect(formatPaymentReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('PAY-A1B2C3D4')
  })
})
