import { describe, expect, it } from 'vitest'
import { canStartProjectDelivery, canTransitionProjectStatus, initialProjectStatusFromPaymentReadiness, isTerminalProjectStatus } from './project-delivery.js'

describe('canTransitionProjectStatus', () => {
  it('allows draft to active', () => {
    expect(canTransitionProjectStatus('draft', 'active')).toBe(true)
  })

  it('rejects completed to active', () => {
    expect(canTransitionProjectStatus('completed', 'active')).toBe(false)
  })

  it('allows on_hold to active', () => {
    expect(canTransitionProjectStatus('on_hold', 'active')).toBe(true)
  })
})

describe('canStartProjectDelivery', () => {
  it('only allows draft', () => {
    expect(canStartProjectDelivery('draft')).toBe(true)
    expect(canStartProjectDelivery('active')).toBe(false)
  })
})

describe('initialProjectStatusFromPaymentReadiness', () => {
  it('keeps payment-required projects in planning', () => {
    expect(initialProjectStatusFromPaymentReadiness({ paymentRequired: true, paymentVerified: true })).toBe(
      'draft',
    )
    expect(initialProjectStatusFromPaymentReadiness({ paymentRequired: true, paymentVerified: false })).toBe(
      'draft',
    )
  })

  it('allows active creation when no payment is required', () => {
    expect(initialProjectStatusFromPaymentReadiness({ paymentRequired: false, paymentVerified: true })).toBe(
      'active',
    )
  })
})

describe('isTerminalProjectStatus', () => {
  it('detects completed and cancelled', () => {
    expect(isTerminalProjectStatus('completed')).toBe(true)
    expect(isTerminalProjectStatus('active')).toBe(false)
  })
})
