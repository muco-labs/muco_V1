export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'] as const
export type TaskDeliveryStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export const TERMINAL_TASK_STATUSES = new Set<TaskDeliveryStatus>(['done', 'cancelled'])

export function canTransitionTaskStatus(from: string, to: string): boolean {
  if (from === to) return true
  if (from === 'done' || from === 'cancelled') return false
  const map: Record<string, string[]> = {
    todo: ['in_progress', 'blocked', 'done', 'cancelled'],
    in_progress: ['todo', 'blocked', 'done', 'cancelled'],
    blocked: ['todo', 'in_progress', 'done', 'cancelled'],
  }
  return map[from]?.includes(to) ?? false
}

export function isTaskOverdue(
  task: { status: string; dueDate: Date | null | undefined },
  now = new Date(),
): boolean {
  if (TERMINAL_TASK_STATUSES.has(task.status as TaskDeliveryStatus)) return false
  if (!task.dueDate) return false
  return task.dueDate.getTime() < now.getTime()
}

export function computeMilestoneTaskProgressPercent(
  taskRows: Array<{ status: string }>,
): number | null {
  if (taskRows.length === 0) return null
  const done = taskRows.filter((t) => t.status === 'done').length
  return Math.round((done / taskRows.length) * 100)
}

export function formatTaskReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `TASK-${normalized}` : `TASK-${id.slice(0, 12)}`
}

export function presentTaskStatusLabel(status: string): string {
  switch (status) {
    case 'todo':
      return 'To do'
    case 'in_progress':
      return 'In progress'
    case 'blocked':
      return 'Blocked'
    case 'done':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.replace(/_/g, ' ')
  }
}

export function serializeAdminProjectTask(row: {
  id: string
  projectId: string
  milestoneId: string | null
  assignedEmployeeId: string | null
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}, extras?: {
  milestoneName?: string | null
  assigneeName?: string | null
  overdue?: boolean
}) {
  return {
    reference: formatTaskReference(row.id),
    id: row.id,
    projectId: row.projectId,
    milestoneId: row.milestoneId,
    milestoneName: extras?.milestoneName ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    statusLabel: presentTaskStatusLabel(row.status),
    priority: row.priority,
    assigneeEmployeeId: row.assignedEmployeeId,
    assigneeName: extras?.assigneeName ?? null,
    dueDate: row.dueDate?.toISOString() ?? null,
    overdue: extras?.overdue ?? false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
