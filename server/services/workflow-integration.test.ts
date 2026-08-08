import { describe, expect, it } from 'vitest'
import { computeProjectProgressFromTasks } from './workflow.service.js'
import { verifyRazorpayCheckoutSignature } from './payment.service.js'

describe('project progress calculation', () => {
  it('returns null when no tasks or milestones', () => {
    expect(computeProjectProgressFromTasks([], [])).toBeNull()
  })

  it('combines completed tasks and milestones', () => {
    expect(
      computeProjectProgressFromTasks(
        [{ status: 'done' }, { status: 'todo' }],
        [{ status: 'completed' }, { status: 'planned' }],
      ),
    ).toBe(50)
  })
})

describe('razorpay signature verification', () => {
  it('returns false when Razorpay is not configured', () => {
    expect(verifyRazorpayCheckoutSignature('o', 'p', 'sig')).toBe(false)
  })
})
