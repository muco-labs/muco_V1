export const MILESTONE_DELIVERY_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const

export type MilestoneDeliveryStatus = (typeof MILESTONE_DELIVERY_STATUSES)[number]

export function canTransitionMilestoneStatus(from: string, to: string): boolean {
  if (from === to) return true
  const map: Record<string, string[]> = {
    planned: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'planned', 'cancelled'],
    completed: [],
    cancelled: [],
  }
  return map[from]?.includes(to) ?? false
}

export function presentCustomerMilestoneStatus(status: string): string {
  switch (status) {
    case 'planned':
      return 'Pending'
    case 'in_progress':
      return 'In progress'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.replace(/_/g, ' ')
  }
}

export function computeMilestoneProgressPercent(
  milestoneRows: Array<{ status: string }>,
): number | null {
  if (milestoneRows.length === 0) return null
  const done = milestoneRows.filter((m) => m.status === 'completed').length
  return Math.round((done / milestoneRows.length) * 100)
}

export type MilestoneDueHint = 'overdue' | 'due_today' | 'upcoming'

export function milestoneDueHint(
  dueDate: Date | null | undefined,
  status: string,
  now = new Date(),
): MilestoneDueHint | null {
  if (!dueDate || status === 'completed' || status === 'cancelled') return null
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)
  if (dueDate < startOfToday) return 'overdue'
  if (dueDate < endOfToday) return 'due_today'
  return 'upcoming'
}
