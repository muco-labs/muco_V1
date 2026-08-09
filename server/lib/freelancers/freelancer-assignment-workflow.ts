/** Phase 4.21: UI workflow helpers — persistence stays in Phase 4.17 assignment services. */

export type PendingAssignmentKind = 'project' | 'task'

/** Discovery/select never implies assignment; confirmation is always required in admin UI. */
export const ASSIGNMENT_REQUIRES_CONFIRMATION = true as const

export function taskDiscoveryAllowsFreelancerAssign(input: {
  freelancerOnProject: boolean
  taskAssigneeEmployeeId: string | null
  taskAssigneeFreelancerId: string | null
  candidateFreelancerId: string
}): boolean {
  if (!input.freelancerOnProject) return false
  if (input.taskAssigneeEmployeeId) return false
  if (
    input.taskAssigneeFreelancerId &&
    input.taskAssigneeFreelancerId !== input.candidateFreelancerId
  ) {
    return false
  }
  return true
}

export function projectDiscoveryAllowsAssign(input: {
  alreadyOnProject: boolean
}): boolean {
  return !input.alreadyOnProject
}
