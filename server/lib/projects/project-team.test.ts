import { describe, expect, it } from 'vitest'
import {
  normalizeProjectMemberRole,
  presentProjectMemberRoleLabel,
  PROJECT_MEMBER_ROLES,
} from './project-member-roles.js'
import {
  computeMemberTaskWorkload,
  isActiveProjectTaskStatus,
  userCanJoinProjectTeam,
} from './project-team.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { hasPermission } from '../auth/permissions.js'
import { serializeCustomerProjectSummary } from '../../services/project-fulfillment.service.js'

describe('project member roles', () => {
  it('normalizes preferred roles', () => {
    expect(normalizeProjectMemberRole('developer')).toBe('developer')
    expect(normalizeProjectMemberRole('Project Manager')).toBe('project_manager')
    expect(normalizeProjectMemberRole('member')).toBe('other')
  })

  it('rejects unknown roles', () => {
    expect(normalizeProjectMemberRole('freelancer')).toBeNull()
  })

  it('labels roles for display', () => {
    expect(presentProjectMemberRoleLabel('qa')).toBe('QA')
    expect(PROJECT_MEMBER_ROLES).toContain('project_manager')
  })
})

describe('active task safety', () => {
  it('treats done and cancelled as inactive', () => {
    expect(isActiveProjectTaskStatus('todo')).toBe(true)
    expect(isActiveProjectTaskStatus('done')).toBe(false)
    expect(isActiveProjectTaskStatus('cancelled')).toBe(false)
  })

  it('counts active and overdue tasks per member', () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const workload = computeMemberTaskWorkload(
      [
        {
          assignedEmployeeId: 'e1',
          status: 'todo',
          dueDate: new Date('2026-08-01'),
        },
        {
          assignedEmployeeId: 'e1',
          status: 'done',
          dueDate: new Date('2026-08-01'),
        },
        {
          assignedEmployeeId: 'e2',
          status: 'in_progress',
          dueDate: new Date('2026-12-01'),
        },
      ],
      'e1',
      now,
    )
    expect(workload.activeTaskCount).toBe(1)
    expect(workload.overdueTaskCount).toBe(1)
  })
})

describe('internal team eligibility', () => {
  it('allows employees and admins', () => {
    expect(userCanJoinProjectTeam(['EMPLOYEE'])).toBe(true)
    expect(userCanJoinProjectTeam(['ADMIN'])).toBe(true)
  })

  it('rejects customer-only users', () => {
    expect(userCanJoinProjectTeam(['CUSTOMER'])).toBe(false)
  })
})

describe('project team RBAC', () => {
  it('requires projects.assign for team management', () => {
    const admin = new Set(defaultRolePermissions.ADMIN)
    expect(hasPermission(admin, 'projects.assign')).toBe(true)
    const employee = new Set(defaultRolePermissions.EMPLOYEE)
    expect(hasPermission(employee, 'projects.assign')).toBe(false)
  })

  it('customers cannot assign project members', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'projects.assign')).toBe(false)
  })
})

describe('customer DTO isolation', () => {
  it('customer project summary has no team workload fields', () => {
    const dto = serializeCustomerProjectSummary({
      id: '11111111-1111-1111-1111-111111111111',
      customerId: 'c1',
      leadId: null,
      proposalId: null,
      name: 'Site',
      description: null,
      service: 'web',
      status: 'active',
      startDate: null,
      expectedCompletion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    expect(dto).not.toHaveProperty('members')
    expect(dto).not.toHaveProperty('activeTaskCount')
  })
})
