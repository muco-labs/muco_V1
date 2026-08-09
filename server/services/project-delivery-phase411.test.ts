import { describe, expect, it } from 'vitest'
import { deriveAdminNextDeliveryAction } from './project-delivery.service.js'
import { shouldNotifyProjectStartedOnProposalCreate } from '../lib/projects/project-delivery.js'

describe('deriveAdminNextDeliveryAction', () => {
  it('prompts payment when start is blocked', () => {
    const msg = deriveAdminNextDeliveryAction({
      projectStatus: 'draft',
      canStart: true,
      paymentVerified: false,
      paymentRequired: true,
      overdueCount: 0,
      milestoneCount: 0,
    })
    expect(msg).toContain('payment')
  })

  it('surfaces overdue milestones', () => {
    const msg = deriveAdminNextDeliveryAction({
      projectStatus: 'active',
      canStart: false,
      paymentVerified: true,
      paymentRequired: true,
      overdueCount: 2,
      milestoneCount: 4,
    })
    expect(msg).toContain('2')
  })
})

describe('shouldNotifyProjectStartedOnProposalCreate', () => {
  it('skips started email when payment is required', () => {
    expect(
      shouldNotifyProjectStartedOnProposalCreate({ paymentRequired: true, paymentVerified: true }),
    ).toBe(false)
  })

  it('allows started email when payment is not required', () => {
    expect(
      shouldNotifyProjectStartedOnProposalCreate({ paymentRequired: false, paymentVerified: true }),
    ).toBe(true)
  })
})
