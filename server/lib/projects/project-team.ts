import { isTaskOverdue, TERMINAL_TASK_STATUSES, type TaskDeliveryStatus } from './task-delivery.js'

export function isActiveProjectTaskStatus(status: string): boolean {
  return !TERMINAL_TASK_STATUSES.has(status as TaskDeliveryStatus)
}

export function computeMemberTaskWorkload(
  taskRows: Array<{ assignedEmployeeId: string | null; status: string; dueDate: Date | null }>,
  employeeId: string,
  now = new Date(),
): { activeTaskCount: number; overdueTaskCount: number } {
  const mine = taskRows.filter((t) => t.assignedEmployeeId === employeeId)
  let activeTaskCount = 0
  let overdueTaskCount = 0
  for (const task of mine) {
    if (!isActiveProjectTaskStatus(task.status)) continue
    activeTaskCount += 1
    if (isTaskOverdue({ status: task.status, dueDate: task.dueDate }, now)) {
      overdueTaskCount += 1
    }
  }
  return { activeTaskCount, overdueTaskCount }
}

export function computeFreelancerTaskWorkload(
  taskRows: Array<{ assignedFreelancerId: string | null; status: string; dueDate: Date | null }>,
  freelancerId: string,
  now = new Date(),
): { activeTaskCount: number; overdueTaskCount: number } {
  const mine = taskRows.filter((t) => t.assignedFreelancerId === freelancerId)
  let activeTaskCount = 0
  let overdueTaskCount = 0
  for (const task of mine) {
    if (!isActiveProjectTaskStatus(task.status)) continue
    activeTaskCount += 1
    if (isTaskOverdue({ status: task.status, dueDate: task.dueDate }, now)) {
      overdueTaskCount += 1
    }
  }
  return { activeTaskCount, overdueTaskCount }
}

export const INTERNAL_TEAM_ROLES = new Set(['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'FOUNDER'])

export function userCanJoinProjectTeam(roleNames: string[]): boolean {
  return roleNames.some((r) => INTERNAL_TEAM_ROLES.has(r))
}
