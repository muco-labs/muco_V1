import { describe, expect, it } from 'vitest'
import { isFreelancerEligibleForProjectAssignment } from './freelancer-status.js'
import { computeFreelancerTaskWorkload } from '../projects/project-team.js'
import { serializeAdminProjectTask } from '../projects/task-delivery.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'

const eligibleBase = {
  approvalStatus: 'approved',
  verificationStatus: 'verified',
  userId: 'user-1',
  userStatus: 'active',
  availabilityStatus: 'available',
  openToProjects: true,
} as const

describe('freelancer project assignment eligibility', () => {
  it('accepts verified approved available freelancers', () => {
    expect(isFreelancerEligibleForProjectAssignment(eligibleBase)).toBe(true)
  })

  it('rejects pending approval', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...eligibleBase, approvalStatus: 'under_review' }),
    ).toBe(false)
  })

  it('rejects unlinked user', () => {
    expect(isFreelancerEligibleForProjectAssignment({ ...eligibleBase, userId: null })).toBe(false)
  })

  it('rejects unavailable status', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...eligibleBase, availabilityStatus: 'unavailable' }),
    ).toBe(false)
  })

  it('accepts limited availability', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...eligibleBase, availabilityStatus: 'limited' }),
    ).toBe(true)
  })

  it('rejects when not open to projects', () => {
    expect(isFreelancerEligibleForProjectAssignment({ ...eligibleBase, openToProjects: false })).toBe(
      false,
    )
  })
})

describe('freelancer task workload', () => {
  it('counts only active tasks for freelancer assignee', () => {
    const rows = [
      { assignedFreelancerId: 'fl-1', status: 'todo', dueDate: null },
      { assignedFreelancerId: 'fl-1', status: 'done', dueDate: null },
      { assignedFreelancerId: 'fl-2', status: 'in_progress', dueDate: null },
    ]
    expect(computeFreelancerTaskWorkload(rows, 'fl-1')).toEqual({
      activeTaskCount: 1,
      overdueTaskCount: 0,
      blockedTaskCount: 0,
    })
  })
})

describe('admin task serialization', () => {
  it('exposes freelancer assignee without internal notes', () => {
    const dto = serializeAdminProjectTask(
      {
        id: '00000000-0000-4000-8000-000000000001',
        projectId: '00000000-0000-4000-8000-000000000002',
        milestoneId: null,
        assignedEmployeeId: null,
        assignedFreelancerId: '00000000-0000-4000-8000-000000000003',
        title: 'Task',
        description: null,
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { assigneeName: 'Alex', assigneeType: 'freelancer' },
    )
    expect(dto.assigneeFreelancerId).toBeTruthy()
    expect(dto.assigneeType).toBe('freelancer')
    expect(JSON.stringify(dto)).not.toContain('internal')
  })
})

describe('customer DTO isolation', () => {
  it('customer project summary has no freelancer fields', () => {
    const dto = serializeCustomerProjectSummary({
      id: '00000000-0000-4000-8000-000000000099',
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
    const json = JSON.stringify(dto)
    expect(json).not.toMatch(/freelancer/i)
    expect(json).not.toMatch(/assignee/i)
  })
})

describe('freelancer RBAC scope', () => {
  it('freelancer role has no global project assign permission', () => {
    const fl = new Set(defaultRolePermissions.FREELANCER)
    expect(hasPermission(fl, 'projects.assign')).toBe(false)
    expect(hasPermission(fl, 'tasks.assign')).toBe(false)
    expect(hasPermission(fl, 'tasks.create')).toBe(false)
  })

  it('customer cannot use admin team permissions', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'projects.assign')).toBe(false)
  })
})
