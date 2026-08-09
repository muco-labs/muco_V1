import { describe, expect, it } from 'vitest'
import {
  ASSIGNMENT_REQUIRES_CONFIRMATION,
  projectDiscoveryAllowsAssign,
  taskDiscoveryAllowsFreelancerAssign,
} from './freelancer-assignment-workflow.js'
import { isFreelancerEligibleForProjectAssignment } from './freelancer-status.js'
import { isFreelancerOpenForNewAssignments } from './freelancer-availability.js'
import { hasPermission } from '../auth/permissions.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { isTerminalProjectStatus } from '../projects/project-delivery.js'
import { TERMINAL_TASK_STATUSES } from '../projects/task-delivery.js'

describe('assignment workflow UI contract', () => {
  it('requires explicit confirmation before persistence', () => {
    expect(ASSIGNMENT_REQUIRES_CONFIRMATION).toBe(true)
  })

  it('blocks project select when already on project', () => {
    expect(projectDiscoveryAllowsAssign({ alreadyOnProject: true })).toBe(false)
    expect(projectDiscoveryAllowsAssign({ alreadyOnProject: false })).toBe(true)
  })

  it('blocks task discovery assign when employee or other freelancer owns task', () => {
    expect(
      taskDiscoveryAllowsFreelancerAssign({
        freelancerOnProject: true,
        taskAssigneeEmployeeId: 'emp-1',
        taskAssigneeFreelancerId: null,
        candidateFreelancerId: 'fl-1',
      }),
    ).toBe(false)
    expect(
      taskDiscoveryAllowsFreelancerAssign({
        freelancerOnProject: true,
        taskAssigneeEmployeeId: null,
        taskAssigneeFreelancerId: 'fl-2',
        candidateFreelancerId: 'fl-1',
      }),
    ).toBe(false)
    expect(
      taskDiscoveryAllowsFreelancerAssign({
        freelancerOnProject: true,
        taskAssigneeEmployeeId: null,
        taskAssigneeFreelancerId: null,
        candidateFreelancerId: 'fl-1',
      }),
    ).toBe(true)
  })
})

describe('server-side eligibility revalidation (Phase 4.17/4.19)', () => {
  const base = {
    approvalStatus: 'approved',
    verificationStatus: 'verified',
    userId: 'u1',
    userStatus: 'active',
    availabilityStatus: 'available',
    openToProjects: true,
  } as const

  it('rejects unavailable at assignment eligibility', () => {
    expect(isFreelancerOpenForNewAssignments('unavailable')).toBe(false)
    expect(
      isFreelancerEligibleForProjectAssignment({ ...base, availabilityStatus: 'unavailable' }),
    ).toBe(false)
  })

  it('accepts limited for new assignment', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...base, availabilityStatus: 'limited' }),
    ).toBe(true)
  })

  it('rejects unapproved freelancer', () => {
    expect(
      isFreelancerEligibleForProjectAssignment({ ...base, approvalStatus: 'under_review' }),
    ).toBe(false)
  })
})

describe('terminal project and task guards', () => {
  it('treats completed/cancelled projects as terminal', () => {
    expect(isTerminalProjectStatus('completed')).toBe(true)
    expect(isTerminalProjectStatus('cancelled')).toBe(true)
  })

  it('treats done/cancelled tasks as terminal', () => {
    expect(TERMINAL_TASK_STATUSES.has('done')).toBe(true)
    expect(TERMINAL_TASK_STATUSES.has('cancelled')).toBe(true)
    expect(TERMINAL_TASK_STATUSES.has('todo')).toBe(false)
  })
})

describe('assignment workflow RBAC', () => {
  it('requires projects.assign and tasks.update for admin assign flows', () => {
    const admin = new Set(defaultRolePermissions.ADMIN)
    expect(hasPermission(admin, 'projects.assign')).toBe(true)
    expect(hasPermission(admin, 'tasks.update')).toBe(true)
    expect(hasPermission(admin, 'freelancers.view')).toBe(true)
  })

  it('denies customer', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'projects.assign')).toBe(false)
    expect(hasPermission(customer, 'tasks.update')).toBe(false)
  })
})
