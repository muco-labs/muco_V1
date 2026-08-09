import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  employeeProfiles,
  freelancerProfiles,
  milestones,
  notifications,
  projectMembers,
  tasks,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import {
  assertProjectsPermission,
  loadProjectDeliveryContext,
} from './project-delivery.service.js'
import { isTerminalProjectStatus } from '../lib/projects/project-delivery.js'
import {
  canTransitionTaskStatus,
  computeMilestoneTaskProgressPercent,
  isTaskOverdue,
  serializeAdminProjectTask,
  TASK_PRIORITIES,
} from '../lib/projects/task-delivery.js'
import { computeMilestoneProgressPercent } from '../lib/projects/milestone-delivery.js'
import {
  assertFreelancerOnProject,
  notifyFreelancerTaskAssigned,
} from './project-freelancer-assignment.service.js'

function assertSingleTaskAssignee(employeeId?: string | null, freelancerId?: string | null) {
  if (employeeId && freelancerId) {
    throw new AppError('VALIDATION_ERROR', 'A task can only be assigned to one person.', 400)
  }
}

function assertTasksPermission(auth: AuthContext, permission: 'tasks.view' | 'tasks.create' | 'tasks.update') {
  if (!hasPermission(auth.permissions, permission)) {
    throw new AppError('FORBIDDEN', 'You cannot manage tasks for this project.', 403)
  }
}

function assertProjectAllowsTaskMutation(projectStatus: string) {
  if (isTerminalProjectStatus(projectStatus)) {
    throw new AppError('CONFLICT', 'Tasks cannot be changed on a completed or cancelled project.', 409)
  }
}

async function assertMilestoneOnProject(projectId: string, milestoneId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({ id: milestones.id })
    .from(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
    .limit(1)

  if (!row) throw new AppError('VALIDATION_ERROR', 'Milestone does not belong to this project.', 400)
}

async function assertAssigneeIsMember(projectId: string, employeeId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({ employeeId: projectMembers.employeeId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))
    .limit(1)

  if (!row) {
    throw new AppError('VALIDATION_ERROR', 'Assignee must be a member of this project.', 400)
  }
}

async function getTaskOnProject(projectId: string, taskId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Task not found.', 404)
  return row
}

async function loadTaskEnrichment(rows: Array<typeof tasks.$inferSelect>) {
  const db = getDb()
  if (!db) return rows.map((row) => serializeAdminProjectTask(row, { overdue: isTaskOverdue(row) }))

  const milestoneIds = [...new Set(rows.map((r) => r.milestoneId).filter(Boolean))] as string[]
  const employeeIds = [...new Set(rows.map((r) => r.assignedEmployeeId).filter(Boolean))] as string[]
  const freelancerIds = [...new Set(rows.map((r) => r.assignedFreelancerId).filter(Boolean))] as string[]

  const milestoneMap = new Map<string, string>()
  if (milestoneIds.length) {
    const ms = await db
      .select({ id: milestones.id, name: milestones.name })
      .from(milestones)
      .where(inArray(milestones.id, milestoneIds))
    for (const m of ms) milestoneMap.set(m.id, m.name)
  }

  const assigneeMap = new Map<string, string>()
  if (employeeIds.length) {
    const emps = await db
      .select({ id: employeeProfiles.id, fullName: users.fullName })
      .from(employeeProfiles)
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(inArray(employeeProfiles.id, employeeIds))
    for (const e of emps) assigneeMap.set(`e:${e.id}`, e.fullName ?? 'Team member')
  }

  if (freelancerIds.length) {
    const fls = await db
      .select({ id: freelancerProfiles.id, fullName: freelancerProfiles.fullName })
      .from(freelancerProfiles)
      .where(inArray(freelancerProfiles.id, freelancerIds))
    for (const f of fls) assigneeMap.set(`f:${f.id}`, f.fullName)
  }

  return rows.map((row) =>
    serializeAdminProjectTask(row, {
      milestoneName: row.milestoneId ? milestoneMap.get(row.milestoneId) ?? null : null,
      assigneeName: row.assignedEmployeeId
        ? assigneeMap.get(`e:${row.assignedEmployeeId}`) ?? null
        : row.assignedFreelancerId
          ? assigneeMap.get(`f:${row.assignedFreelancerId}`) ?? null
          : null,
      assigneeType: row.assignedEmployeeId
        ? 'employee'
        : row.assignedFreelancerId
          ? 'freelancer'
          : null,
      overdue: isTaskOverdue(row),
    }),
  )
}

async function notifyEmployeeTaskEvent(
  employeeId: string | null,
  input: { type: string; title: string; message: string },
) {
  if (!employeeId) return
  const db = getDb()
  if (!db) return

  const [profile] = await db
    .select({ userId: employeeProfiles.userId })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.id, employeeId))
    .limit(1)

  if (!profile?.userId) return

  await db.insert(notifications).values({
    userId: profile.userId,
    type: input.type,
    title: input.title,
    message: input.message,
  })
}

export async function listProjectTasksAdmin(
  auth: AuthContext,
  projectId: string,
  filters?: {
    status?: string
    priority?: string
    milestoneId?: string
    assigneeEmployeeId?: string
    overdueOnly?: boolean
  },
) {
  assertProjectsPermission(auth, 'projects.view')
  assertTasksPermission(auth, 'tasks.view')
  await loadProjectDeliveryContext(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = [eq(tasks.projectId, projectId)]
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as typeof tasks.status.enumValues[number]))
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as typeof tasks.priority.enumValues[number]))
  }
  if (filters?.milestoneId) conditions.push(eq(tasks.milestoneId, filters.milestoneId))
  if (filters?.assigneeEmployeeId) {
    conditions.push(eq(tasks.assignedEmployeeId, filters.assigneeEmployeeId))
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt))

  let enriched = await loadTaskEnrichment(rows)
  if (filters?.overdueOnly) {
    enriched = enriched.filter((t) => t.overdue)
  }

  return enriched
}

export async function getProjectTaskAdmin(auth: AuthContext, projectId: string, taskId: string) {
  assertProjectsPermission(auth, 'projects.view')
  assertTasksPermission(auth, 'tasks.view')
  const row = await getTaskOnProject(projectId, taskId)
  const [item] = await loadTaskEnrichment([row])
  return item
}

export async function createProjectTaskAdmin(
  auth: AuthContext,
  projectId: string,
  input: {
    title: string
    description?: string
    milestoneId?: string
    assignedEmployeeId?: string
    assignedFreelancerId?: string
    priority?: string
    dueDate?: string
  },
) {
  assertProjectsPermission(auth, 'projects.update')
  assertTasksPermission(auth, 'tasks.create')

  const project = await loadProjectDeliveryContext(projectId)
  assertProjectAllowsTaskMutation(project.status)

  const title = input.title.trim()
  if (title.length < 2) throw new AppError('VALIDATION_ERROR', 'Task title is required.', 400)

  if (input.milestoneId) await assertMilestoneOnProject(projectId, input.milestoneId)
  assertSingleTaskAssignee(input.assignedEmployeeId, input.assignedFreelancerId)
  if (input.assignedEmployeeId) await assertAssigneeIsMember(projectId, input.assignedEmployeeId)
  if (input.assignedFreelancerId) await assertFreelancerOnProject(projectId, input.assignedFreelancerId)

  const priority = input.priority ?? 'medium'
  if (!(TASK_PRIORITIES as readonly string[]).includes(priority)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid priority.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .insert(tasks)
    .values({
      projectId,
      milestoneId: input.milestoneId ?? null,
      assignedEmployeeId: input.assignedEmployeeId ?? null,
      assignedFreelancerId: input.assignedFreelancerId ?? null,
      title,
      description: input.description?.trim() || null,
      priority: priority as typeof tasks.priority.enumValues[number],
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'task.created',
    entity: 'tasks',
    entityId: row.id,
    metadata: JSON.stringify({ projectId }),
  })

  if (input.assignedEmployeeId) {
    await notifyEmployeeTaskEvent(input.assignedEmployeeId, {
      type: 'task.assigned',
      title: 'Task assigned',
      message: `You were assigned: ${title}`,
    })
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'task.assigned',
      entity: 'tasks',
      entityId: row.id,
      metadata: JSON.stringify({ employeeId: input.assignedEmployeeId }),
    })
  }

  if (input.assignedFreelancerId) {
    await notifyFreelancerTaskAssigned(input.assignedFreelancerId, {
      title: 'Task assigned',
      message: `You were assigned: ${title}`,
    })
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.task_assigned',
      entity: 'tasks',
      entityId: row.id,
      metadata: JSON.stringify({ freelancerId: input.assignedFreelancerId }),
    })
  }

  const [item] = await loadTaskEnrichment([row])
  return item
}

export async function updateProjectTaskAdmin(
  auth: AuthContext,
  projectId: string,
  taskId: string,
  input: Partial<{
    title: string
    description: string | null
    milestoneId: string | null
    assignedEmployeeId: string | null
    assignedFreelancerId: string | null
    status: string
    priority: string
    dueDate: string | null
  }>,
) {
  assertProjectsPermission(auth, 'projects.update')
  assertTasksPermission(auth, 'tasks.update')

  const project = await loadProjectDeliveryContext(projectId)
  assertProjectAllowsTaskMutation(project.status)

  const existing = await getTaskOnProject(projectId, taskId)

  if (input.status && !canTransitionTaskStatus(existing.status, input.status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid task status transition.', 400)
  }

  if (input.milestoneId) await assertMilestoneOnProject(projectId, input.milestoneId)

  let nextEmployeeId = existing.assignedEmployeeId
  let nextFreelancerId = existing.assignedFreelancerId
  if (input.assignedEmployeeId !== undefined) {
    nextEmployeeId = input.assignedEmployeeId
    if (input.assignedEmployeeId) nextFreelancerId = null
  }
  if (input.assignedFreelancerId !== undefined) {
    nextFreelancerId = input.assignedFreelancerId
    if (input.assignedFreelancerId) nextEmployeeId = null
  }
  assertSingleTaskAssignee(nextEmployeeId, nextFreelancerId)
  if (nextEmployeeId) await assertAssigneeIsMember(projectId, nextEmployeeId)
  if (nextFreelancerId) await assertFreelancerOnProject(projectId, nextFreelancerId)

  if (input.priority && !(TASK_PRIORITIES as readonly string[]).includes(input.priority)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid priority.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const assigneePatch: {
    assignedEmployeeId?: string | null
    assignedFreelancerId?: string | null
  } = {}
  if (input.assignedEmployeeId !== undefined || input.assignedFreelancerId !== undefined) {
    assigneePatch.assignedEmployeeId = nextEmployeeId
    assigneePatch.assignedFreelancerId = nextFreelancerId
  }

  const [updated] = await db
    .update(tasks)
    .set({
      title: input.title?.trim(),
      description: input.description === undefined ? undefined : input.description,
      milestoneId: input.milestoneId === undefined ? undefined : input.milestoneId,
      ...assigneePatch,
      status: input.status as typeof tasks.status.enumValues[number] | undefined,
      priority: input.priority as typeof tasks.priority.enumValues[number] | undefined,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate
            ? new Date(input.dueDate)
            : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: input.status ? 'task.status_changed' : 'task.updated',
    entity: 'tasks',
    entityId: taskId,
    metadata: JSON.stringify({
      projectId,
      status: input.status ?? undefined,
    }),
  })

  if (nextEmployeeId && nextEmployeeId !== existing.assignedEmployeeId) {
    await notifyEmployeeTaskEvent(nextEmployeeId, {
      type: 'task.assigned',
      title: 'Task assigned',
      message: `You were assigned: ${updated.title}`,
    })
  }

  if (nextFreelancerId && nextFreelancerId !== existing.assignedFreelancerId) {
    await notifyFreelancerTaskAssigned(nextFreelancerId, {
      title: 'Task assigned',
      message: `You were assigned: ${updated.title}`,
    })
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.task_assigned',
      entity: 'tasks',
      entityId: taskId,
      metadata: JSON.stringify({ freelancerId: nextFreelancerId }),
    })
  }

  if (input.status === 'blocked' && updated.assignedEmployeeId) {
    await notifyEmployeeTaskEvent(updated.assignedEmployeeId, {
      type: 'task.blocked',
      title: 'Task blocked',
      message: `A task you own is blocked: ${updated.title}`,
    })
  }

  if (input.status === 'done') {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'task.completed',
      entity: 'tasks',
      entityId: taskId,
      metadata: JSON.stringify({ projectId }),
    })
  }

  if (input.status === 'cancelled') {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'task.cancelled',
      entity: 'tasks',
      entityId: taskId,
      metadata: JSON.stringify({ projectId }),
    })
  }

  const [item] = await loadTaskEnrichment([updated])
  return item
}

export async function completeProjectTaskAdmin(auth: AuthContext, projectId: string, taskId: string) {
  return updateProjectTaskAdmin(auth, projectId, taskId, { status: 'done' })
}

export async function cancelProjectTaskAdmin(auth: AuthContext, projectId: string, taskId: string) {
  return updateProjectTaskAdmin(auth, projectId, taskId, { status: 'cancelled' })
}

export async function computeProjectTaskProgressSummary(projectId: string) {
  const db = getDb()
  if (!db) {
    return {
      milestoneTaskProgress: [] as Array<{
        milestoneId: string
        percent: number | null
        taskCount: number
        completedTaskCount: number
      }>,
      projectPercent: null as number | null,
    }
  }

  const taskRows = await db.select().from(tasks).where(eq(tasks.projectId, projectId))
  const milestoneRows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))

  const milestoneTaskProgress = milestoneRows.map((m) => {
    const related = taskRows.filter((t) => t.milestoneId === m.id)
    return {
      milestoneId: m.id,
      percent: computeMilestoneTaskProgressPercent(related),
      taskCount: related.length,
      completedTaskCount: related.filter((t) => t.status === 'done').length,
    }
  })

  const withTasks = milestoneTaskProgress.filter((m) => m.taskCount > 0)
  let projectPercent: number | null = computeMilestoneProgressPercent(milestoneRows)
  if (withTasks.length > 0) {
    const sum = withTasks.reduce((acc, m) => acc + (m.percent ?? 0), 0)
    projectPercent = Math.round(sum / withTasks.length)
  }

  return { milestoneTaskProgress, projectPercent }
}

export async function enrichDeliveryWithTaskProgress(
  projectId: string,
  milestoneRows: Array<Record<string, unknown>>,
  currentProgressPercent: number | null,
) {
  const summary = await computeProjectTaskProgressSummary(projectId)
  const milestonesEnriched = milestoneRows.map((m) => {
    const extra = summary.milestoneTaskProgress.find((x) => x.milestoneId === String(m.id))
    return {
      ...m,
      taskCount: extra?.taskCount ?? 0,
      completedTaskCount: extra?.completedTaskCount ?? 0,
      taskProgressPercent: extra?.percent ?? null,
    }
  })

  return {
    milestones: milestonesEnriched,
    progressPercent: summary.projectPercent ?? currentProgressPercent,
  }
}
