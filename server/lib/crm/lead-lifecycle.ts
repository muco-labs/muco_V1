import type { CrmPipelineStatus } from './constants.js'

/** Allowed status moves (forward sales flow + reopen + archive). */
const ALLOWED_TRANSITIONS: Record<CrmPipelineStatus | 'archived', readonly string[]> = {
  new: ['contacted', 'qualified', 'lost', 'archived'],
  contacted: ['qualified', 'discovery', 'lost', 'archived'],
  qualified: ['discovery', 'proposal', 'lost', 'archived'],
  discovery: ['proposal', 'negotiation', 'lost', 'archived'],
  proposal: ['negotiation', 'won', 'lost', 'archived'],
  negotiation: ['proposal', 'won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['contacted', 'archived'],
  archived: [],
}

export const LEAD_CONVERTIBLE_STATUSES = ['proposal', 'negotiation', 'won'] as const

export function canTransitionLeadStatus(from: string, to: string): boolean {
  if (from === to) return true
  const allowed = ALLOWED_TRANSITIONS[from as keyof typeof ALLOWED_TRANSITIONS]
  if (!allowed) return false
  return allowed.includes(to)
}

export function isLeadEligibleForConversion(status: string): boolean {
  return (LEAD_CONVERTIBLE_STATUSES as readonly string[]).includes(status)
}

export function assertLeadStatusTransition(from: string, to: string): void {
  if (!canTransitionLeadStatus(from, to)) {
    throw new Error(`Invalid lead status transition: ${from} → ${to}`)
  }
}
