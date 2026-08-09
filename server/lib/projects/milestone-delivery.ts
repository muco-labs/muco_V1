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

export type MilestoneLike = {
  status: string
  sortOrder: number
  dueDate?: Date | null
  name?: string
}

export function sortMilestonesForDelivery<T extends MilestoneLike>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0),
  )
}

export function pickCurrentMilestone<T extends MilestoneLike>(rows: T[]): T | null {
  const sorted = sortMilestonesForDelivery(rows)
  return (
    sorted.find((m) => m.status === 'in_progress') ??
    sorted.find((m) => m.status === 'planned') ??
    null
  )
}

export function pickNextMilestone<T extends MilestoneLike>(rows: T[], current: T | null): T | null {
  if (!current) return null
  const sorted = sortMilestonesForDelivery(rows)
  const idx = sorted.indexOf(current)
  if (idx < 0) return null
  for (let i = idx + 1; i < sorted.length; i++) {
    const m = sorted[i]
    if (m.status === 'planned' || m.status === 'in_progress') return m
  }
  return null
}

export function countOverdueMilestones(rows: Array<{ status: string; dueDate?: Date | null }>, now = new Date()): number {
  return rows.filter((m) => milestoneDueHint(m.dueDate ?? null, m.status, now) === 'overdue').length
}

export function customerOverdueWording(hint: MilestoneDueHint | null): string | null {
  if (hint !== 'overdue') return null
  return 'This milestone is past its due date. Your MUCO team is tracking delivery.'
}
