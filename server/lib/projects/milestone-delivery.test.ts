import { describe, expect, it } from 'vitest'
import {
  canTransitionMilestoneStatus,
  computeMilestoneProgressPercent,
  milestoneDueHint,
  pickCurrentMilestone,
  pickNextMilestone,
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

describe('pickCurrentMilestone', () => {
  it('prefers in_progress over planned', () => {
    const current = pickCurrentMilestone([
      { status: 'planned', sortOrder: 0 },
      { status: 'in_progress', sortOrder: 1 },
    ])
    expect(current?.sortOrder).toBe(1)
  })
})

describe('pickNextMilestone', () => {
  it('returns the next open milestone', () => {
    const rows = [
      { status: 'completed', sortOrder: 0 },
      { status: 'in_progress', sortOrder: 1 },
      { status: 'planned', sortOrder: 2 },
    ]
    const current = pickCurrentMilestone(rows)
    const next = pickNextMilestone(rows, current)
    expect(next?.sortOrder).toBe(2)
  })
})
