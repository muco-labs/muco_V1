import type { ProjectFulfillmentStatus } from './project-fulfillment.js'

export function canTransitionProjectStatus(from: string, to: ProjectFulfillmentStatus): boolean {
  if (from === to) return true
  const map: Record<string, ProjectFulfillmentStatus[]> = {
    draft: ['active', 'cancelled'],
    active: ['on_hold', 'completed', 'cancelled'],
    on_hold: ['active', 'cancelled'],
    completed: [],
    cancelled: [],
  }
  return map[from]?.includes(to) ?? false
}

export function canStartProjectDelivery(status: string): boolean {
  return status === 'draft'
}

export function canResumeProjectDelivery(status: string): boolean {
  return status === 'on_hold'
}

export const CUSTOMER_VISIBLE_PROJECT_AUDIT_ACTIONS = new Set([
  'project.started',
  'project.status_changed',
  'project.completed',
  'milestone.started',
  'milestone.completed',
])
