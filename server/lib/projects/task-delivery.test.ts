import { describe, expect, it } from 'vitest'
import {
  canTransitionTaskStatus,
  computeMilestoneTaskProgressPercent,
  formatTaskReference,
  isTaskOverdue,
  serializeAdminProjectTask,
  TASK_PRIORITIES,
} from './task-delivery.js'
import { isTerminalProjectStatus } from './project-delivery.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'

describe('task status transitions', () => {
  it('allows todo to in_progress and done', () => {
    expect(canTransitionTaskStatus('todo', 'in_progress')).toBe(true)
    expect(canTransitionTaskStatus('todo', 'done')).toBe(true)
  })

  it('blocks completed to in_progress', () => {
    expect(canTransitionTaskStatus('done', 'in_progress')).toBe(false)
    expect(canTransitionTaskStatus('cancelled', 'done')).toBe(false)
  })

  it('allows blocked to remain incomplete paths', () => {
    expect(canTransitionTaskStatus('blocked', 'in_progress')).toBe(true)
    expect(canTransitionTaskStatus('blocked', 'done')).toBe(true)
  })
})

describe('task priority', () => {
  it('includes preferred values', () => {
    expect(TASK_PRIORITIES).toEqual(['low', 'medium', 'high', 'urgent'])
  })
})

describe('isTaskOverdue', () => {
  const now = new Date('2026-08-09T12:00:00.000Z')

  it('marks open tasks past due date', () => {
    expect(
      isTaskOverdue({ status: 'todo', dueDate: new Date('2026-08-01') }, now),
    ).toBe(true)
  })

  it('ignores completed and cancelled', () => {
    expect(
      isTaskOverdue({ status: 'done', dueDate: new Date('2026-01-01') }, now),
    ).toBe(false)
    expect(
      isTaskOverdue({ status: 'cancelled', dueDate: new Date('2026-01-01') }, now),
    ).toBe(false)
  })

  it('ignores tasks without due date', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: null }, now)).toBe(false)
  })
})

describe('milestone task progress', () => {
  it('computes completed ratio', () => {
    expect(
      computeMilestoneTaskProgressPercent([
        { status: 'done' },
        { status: 'todo' },
        { status: 'done' },
      ]),
    ).toBe(67)
  })

  it('returns null for zero tasks', () => {
    expect(computeMilestoneTaskProgressPercent([])).toBeNull()
  })
})

describe('terminal project protection', () => {
  it('treats completed and cancelled as terminal', () => {
    expect(isTerminalProjectStatus('completed')).toBe(true)
    expect(isTerminalProjectStatus('cancelled')).toBe(true)
    expect(isTerminalProjectStatus('active')).toBe(false)
  })
})

describe('task reference', () => {
  it('formats TASK prefix', () => {
    const ref = formatTaskReference('11111111-1111-1111-1111-111111111111')
    expect(ref.startsWith('TASK-')).toBe(true)
  })
})

describe('admin task DTO', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')

  it('includes operational fields for team', () => {
    const dto = serializeAdminProjectTask(
      {
        id: '11111111-1111-1111-1111-111111111111',
        projectId: '22222222-2222-2222-2222-222222222222',
        milestoneId: null,
        assignedEmployeeId: null,
        title: 'Wireframes',
        description: null,
        status: 'todo',
        priority: 'high',
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      },
      { overdue: false },
    )
    expect(dto.reference).toMatch(/^TASK-/)
    expect(dto.priority).toBe('high')
    expect(dto).not.toHaveProperty('payment')
  })
})

describe('customer DTO security', () => {
  it('customer project summary omits task fields', () => {
    const dto = serializeCustomerProjectSummary({
      id: '11111111-1111-1111-1111-111111111111',
      customerId: 'c1',
      leadId: null,
      proposalId: null,
      name: 'Website',
      description: null,
      service: 'web',
      status: 'active',
      startDate: null,
      expectedCompletion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    expect(dto).not.toHaveProperty('tasks')
    expect(dto).not.toHaveProperty('assigneeName')
    expect(dto).not.toHaveProperty('taskCount')
  })
})

describe('task RBAC', () => {
  it('grants task permissions to founder role', () => {
    const perms = new Set(defaultRolePermissions.FOUNDER)
    expect(hasPermission(perms, 'tasks.view')).toBe(true)
    expect(hasPermission(perms, 'tasks.create')).toBe(true)
    expect(hasPermission(perms, 'tasks.update')).toBe(true)
  })

  it('customer role has no task management', () => {
    const perms = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(perms, 'tasks.create')).toBe(false)
    expect(hasPermission(perms, 'tasks.view')).toBe(false)
  })
})
