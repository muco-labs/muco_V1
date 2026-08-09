export const FREELANCER_AVAILABILITY_STATUSES = ['available', 'limited', 'unavailable'] as const

export type FreelancerAvailabilityStatus = (typeof FREELANCER_AVAILABILITY_STATUSES)[number]

export function isFreelancerAvailabilityStatus(value: string): value is FreelancerAvailabilityStatus {
  return (FREELANCER_AVAILABILITY_STATUSES as readonly string[]).includes(value)
}

export function presentFreelancerAvailabilityLabel(status: string): string {
  switch (status) {
    case 'available':
      return 'Available'
    case 'limited':
      return 'Limited capacity'
    case 'unavailable':
      return 'Unavailable'
    default:
      return status.replace(/_/g, ' ')
  }
}

/** Eligible for new project/task assignment (existing assignments unchanged). */
export function isFreelancerOpenForNewAssignments(availabilityStatus: string): boolean {
  return availabilityStatus === 'available' || availabilityStatus === 'limited'
}

export function assertFreelancerOpenForNewAssignments(availabilityStatus: string): void {
  if (!isFreelancerOpenForNewAssignments(availabilityStatus)) {
    throw new Error('FREELANCER_UNAVAILABLE')
  }
}
