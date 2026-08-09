import { describe, expect, it } from 'vitest'
import {
  FREELANCER_AVAILABILITY_STATUSES,
  isFreelancerAvailabilityStatus,
  isFreelancerOpenForNewAssignments,
  presentFreelancerAvailabilityLabel,
} from './freelancer-availability.js'
import { isFreelancerEligibleForProjectAssignment } from './freelancer-status.js'
import { computeFreelancerTaskWorkload } from '../projects/project-team.js'
import { freelancerAvailabilitySchema } from '../validation/freelancers.js'

const eligibleBase = {
  approvalStatus: 'approved',
  verificationStatus: 'verified',
  userId: 'user-1',
  userStatus: 'active',
  availabilityStatus: 'available',
  openToProjects: true,
} as const

describe('availability status validation', () => {
  it('accepts known enum values', () => {
    for (const s of FREELANCER_AVAILABILITY_STATUSES) {
      expect(isFreelancerAvailabilityStatus(s)).toBe(true)
    }
    expect(isFreelancerAvailabilityStatus('busy')).toBe(false)
  })

  it('zod schema rejects invalid status', () => {
    const ok = freelancerAvailabilitySchema.safeParse({ availabilityStatus: 'limited' })
    expect(ok.success).toBe(true)
    const bad = freelancerAvailabilitySchema.safeParse({ availabilityStatus: 'vacation' })
    expect(bad.success).toBe(false)
  })
})

describe('assignment eligibility by availability', () => {
  it('treats limited as open for new assignments', () => {
    expect(isFreelancerOpenForNewAssignments('limited')).toBe(true)
    expect(
      isFreelancerEligibleForProjectAssignment({ ...eligibleBase, availabilityStatus: 'limited' }),
    ).toBe(true)
  })

  it('blocks unavailable for new assignments', () => {
    expect(isFreelancerOpenForNewAssignments('unavailable')).toBe(false)
    expect(
      isFreelancerEligibleForProjectAssignment({
        ...eligibleBase,
        availabilityStatus: 'unavailable',
      }),
    ).toBe(false)
  })

  it('labels statuses for UI', () => {
    expect(presentFreelancerAvailabilityLabel('limited')).toBe('Limited capacity')
  })
})

describe('freelancer task workload counts', () => {
  const past = new Date(Date.now() - 86_400_000)

  it('counts active, overdue, and blocked tasks', () => {
    const rows = [
      { assignedFreelancerId: 'fl-1', status: 'todo', dueDate: past },
      { assignedFreelancerId: 'fl-1', status: 'blocked', dueDate: null },
      { assignedFreelancerId: 'fl-1', status: 'done', dueDate: past },
      { assignedFreelancerId: 'fl-1', status: 'cancelled', dueDate: past },
    ]
    expect(computeFreelancerTaskWorkload(rows, 'fl-1')).toEqual({
      activeTaskCount: 2,
      overdueTaskCount: 1,
      blockedTaskCount: 1,
    })
  })

  it('ignores terminal tasks for overdue', () => {
    const rows = [{ assignedFreelancerId: 'fl-1', status: 'done', dueDate: past }]
    expect(computeFreelancerTaskWorkload(rows, 'fl-1').overdueTaskCount).toBe(0)
  })
})
