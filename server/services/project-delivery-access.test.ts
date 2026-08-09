import { describe, expect, it } from 'vitest'
import { canTransitionProjectStatus } from '../lib/projects/project-delivery.js'
import { canTransitionMilestoneStatus, computeMilestoneProgressPercent } from '../lib/projects/milestone-delivery.js'
import { serializeCustomerMilestone } from './project-delivery.service.js'

describe('project delivery RBAC concepts', () => {
  it('enforces milestone status transitions', () => {
    expect(canTransitionMilestoneStatus('planned', 'in_progress')).toBe(true)
    expect(canTransitionMilestoneStatus('completed', 'in_progress')).toBe(false)
  })

  it('enforces project status transitions', () => {
    expect(canTransitionProjectStatus('draft', 'active')).toBe(true)
    expect(canTransitionProjectStatus('completed', 'active')).toBe(false)
  })
})

describe('serializeCustomerMilestone', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')

  it('omits internal milestone id from customer payload', () => {
    const dto = serializeCustomerMilestone({
      id: '11111111-1111-1111-1111-111111111111',
      projectId: '22222222-2222-2222-2222-222222222222',
      name: 'Discovery',
      description: null,
      status: 'planned',
      sortOrder: 0,
      dueDate: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    expect(dto).not.toHaveProperty('id')
    expect(dto.statusLabel).toBe('Pending')
    expect(computeMilestoneProgressPercent([{ status: 'completed' }, { status: 'planned' }])).toBe(50)
  })
})
