import { describe, expect, it } from 'vitest'
import { canStartProjectDelivery, canTransitionProjectStatus } from './project-delivery.js'

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
