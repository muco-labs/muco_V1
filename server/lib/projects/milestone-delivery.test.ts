import { describe, expect, it } from 'vitest'
import {
  canTransitionMilestoneStatus,
  computeMilestoneProgressPercent,
  milestoneDueHint,
} from './milestone-delivery.js'

describe('canTransitionMilestoneStatus', () => {
  it('allows planned to in_progress', () => {
    expect(canTransitionMilestoneStatus('planned', 'in_progress')).toBe(true)
  })

  it('rejects completed to planned', () => {
    expect(canTransitionMilestoneStatus('completed', 'planned')).toBe(false)
  })
})

describe('computeMilestoneProgressPercent', () => {
  it('returns null without milestones', () => {
    expect(computeMilestoneProgressPercent([])).toBeNull()
  })

  it('counts completed milestones only', () => {
    expect(
      computeMilestoneProgressPercent([
        { status: 'completed' },
        { status: 'planned' },
        { status: 'in_progress' },
      ]),
    ).toBe(33)
  })
})

describe('milestoneDueHint', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')

  it('returns null for completed milestones', () => {
    expect(milestoneDueHint(new Date('2026-06-01'), 'completed', now)).toBeNull()
  })

  it('marks past due dates as overdue', () => {
    expect(milestoneDueHint(new Date('2026-06-01'), 'planned', now)).toBe('overdue')
  })
})
