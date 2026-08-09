import { isFreelancerOpenForNewAssignments } from './freelancer-availability.js'

export function formatFreelancerReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `FL-${normalized}` : `FL-${id.slice(0, 12)}`
}

export function canFreelancerSetAvailability(input: {
  verificationStatus: string
  approvalStatus: string
}): boolean {
  return input.verificationStatus === 'verified' && input.approvalStatus === 'approved'
}

const ELIGIBLE_FREELANCER_USER_STATUSES = new Set(['active', 'invited'])

/** Phase 4.18: only approved freelancers may activate service offerings. */
export function canFreelancerPublishActiveOfferings(approvalStatus: string): boolean {
  return approvalStatus === 'approved'
}

export function isFreelancerEligibleForProjectAssignment(input: {
  approvalStatus: string
  verificationStatus: string
  userId: string | null
  userStatus: string
  availabilityStatus: string
  openToProjects: boolean
}): boolean {
  if (!canFreelancerSetAvailability(input)) return false
  if (!input.userId) return false
  if (!ELIGIBLE_FREELANCER_USER_STATUSES.has(input.userStatus)) return false
  if (!input.openToProjects) return false
  if (!isFreelancerOpenForNewAssignments(input.availabilityStatus)) return false
  return true
}

export { isFreelancerOpenForNewAssignments } from './freelancer-availability.js'

export function canTransitionVerification(from: string, to: string): boolean {
  if (from === to) return true
  if (from === 'verified' && to === 'pending') return false
  return ['pending', 'verified', 'failed'].includes(to)
}

export function canTransitionApproval(from: string, to: string): boolean {
  if (from === to) return true
  const allowed: Record<string, string[]> = {
    under_review: ['approved', 'rejected', 'suspended'],
    approved: ['suspended', 'under_review'],
    rejected: ['under_review'],
    suspended: ['approved', 'under_review', 'rejected'],
  }
  return allowed[from]?.includes(to) ?? false
}
