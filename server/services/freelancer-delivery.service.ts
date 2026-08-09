import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { auditLogs, milestones, projectFreelancers, projects, tasks } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { requireFreelancerContext } from './freelancer-network.service.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import { presentProjectMemberRoleLabel } from '../lib/projects/project-member-roles.js'
import {
  canTransitionTaskStatus,
  formatTaskReference,
  isTaskOverdue,
  presentTaskStatusLabel,
  TERMINAL_TASK_STATUSES,
} from '../lib/projects/task-delivery.js'
import { isTerminalProjectStatus } from '../lib/projects/project-delivery.js'
import { presentCustomerProjectStatus } from '../lib/projects/project-fulfillment.js'
import { isFreelancerAssignedToProject } from './project-freelancer-assignment.service.js'

async function assertFreelancerProjectAccess(freelancerId: string, projectId: string) {
  const assigned = await isFreelancerAssignedToProject(projectId, freelancerId)
  if (!assigned) {
    throw new AppError('NOT_FOUND', 'Project not found.', 404)
  }
}

function serializeFreelancerProjectSummary(
  project: { id: string; name: string; status: string },
  assignment: { role: string },
  taskStats: { assignedTaskCount: number; activeTaskCount: number },
) {
  return {
    id: project.id,
    reference: formatProjectReference(project.id),
    name: project.name,
    status: project.status,
    statusLabel: presentCustomerProjectStatus(project.status).label,
    projectRole: assignment.role,
    projectRoleLabel: presentProjectMemberRoleLabel(assignment.role),
    assignedTaskCount: taskStats.assignedTaskCount,
    activeTaskCount: taskStats.activeTaskCount,
  }
}

function serializeFreelancerTask(
  row: typeof tasks.$inferSelect,
  extras?: { milestoneName?: string | null; overdue?: boolean },
) {
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
    dueDate: row.dueDate?.toISOString() ?? null,
    overdue: extras?.overdue ?? false,
    nextAction:
      row.status === 'todo'
        ? 'Start work'
        : row.status === 'in_progress'
          ? 'Continue or mark complete'
          : row.status === 'blocked'
            ? 'Resolve blocker'
            : null,
  }
}

export async function listFreelancerAssignedProjects(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select({
      projectId: projects.id,
      name: projects.name,
      status: projects.status,
      role: projectFreelancers.role,
    })
    .from(projectFreelancers)
    .innerJoin(projects, eq(projectFreelancers.projectId, projects.id))
    .where(eq(projectFreelancers.freelancerId, ctx.freelancerId))
    .orderBy(desc(projects.updatedAt))

  const items = []
  for (const row of rows) {
    const taskRows = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(
        and(eq(tasks.projectId, row.projectId), eq(tasks.assignedFreelancerId, ctx.freelancerId)),
      )

    const assignedTaskCount = taskRows.length
    const activeTaskCount = taskRows.filter((t) => !TERMINAL_TASK_STATUSES.has(t.status)).length

    items.push(
      serializeFreelancerProjectSummary(
        { id: row.projectId, name: row.name, status: row.status },
        { role: row.role },
        { assignedTaskCount, activeTaskCount },
      ),
    )
  }

  return items
}

export async function getFreelancerAssignedProject(auth: AuthContext, projectId: string) {
  const ctx = await requireFreelancerContext(auth)
  await assertFreelancerProjectAccess(ctx.freelancerId, projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      projectId: projects.id,
      name: projects.name,
      status: projects.status,
      role: projectFreelancers.role,
    })
    .from(projectFreelancers)
    .innerJoin(projects, eq(projectFreelancers.projectId, projects.id))
    .where(
      and(eq(projectFreelancers.freelancerId, ctx.freelancerId), eq(projects.id, projectId)),
    )
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  const milestoneRows = await db
    .select({ id: milestones.id, name: milestones.name, status: milestones.status })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.assignedFreelancerId, ctx.freelancerId)))
    .orderBy(desc(tasks.updatedAt))

  const milestoneMap = new Map(milestoneRows.map((m) => [m.id, m.name]))

  const tasksSerialized = taskRows.map((t) =>
    serializeFreelancerTask(t, {
      milestoneName: t.milestoneId ? milestoneMap.get(t.milestoneId) ?? null : null,
      overdue: isTaskOverdue(t),
    }),
  )

  return {
    ...serializeFreelancerProjectSummary(
      { id: row.projectId, name: row.name, status: row.status },
      { role: row.role },
      {
        assignedTaskCount: tasksSerialized.length,
        activeTaskCount: tasksSerialized.filter((t) => !TERMINAL_TASK_STATUSES.has(t.status)).length,
      },
    ),
    milestones: milestoneRows.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
    })),
    tasks: tasksSerialized,
  }
}

export async function listFreelancerAssignedTasks(auth: AuthContext, projectId?: string) {
  const ctx = await requireFreelancerContext(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  if (projectId) {
    await assertFreelancerProjectAccess(ctx.freelancerId, projectId)
  }

  const conditions = [eq(tasks.assignedFreelancerId, ctx.freelancerId)]
  if (projectId) conditions.push(eq(tasks.projectId, projectId))

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt))

  const milestoneIds = [...new Set(taskRows.map((t) => t.milestoneId).filter(Boolean))] as string[]
  const milestoneMap = new Map<string, string>()
  if (milestoneIds.length) {
    const ms = await db
      .select({ id: milestones.id, name: milestones.name })
      .from(milestones)
      .where(inArray(milestones.id, milestoneIds))
    for (const m of ms) milestoneMap.set(m.id, m.name)
  }

  return taskRows.map((t) =>
    serializeFreelancerTask(t, {
      milestoneName: t.milestoneId ? milestoneMap.get(t.milestoneId) ?? null : null,
      overdue: isTaskOverdue(t),
    }),
  )
}

async function getOwnedFreelancerTask(ctx: { freelancerId: string }, taskId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.assignedFreelancerId, ctx.freelancerId)))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Task not found.', 404)

  await assertFreelancerProjectAccess(ctx.freelancerId, row.projectId)
  return row
}

export async function getFreelancerAssignedTask(auth: AuthContext, taskId: string) {
  const ctx = await requireFreelancerContext(auth)
  const row = await getOwnedFreelancerTask(ctx, taskId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let milestoneName: string | null = null
  if (row.milestoneId) {
    const [m] = await db
      .select({ name: milestones.name })
      .from(milestones)
      .where(eq(milestones.id, row.milestoneId))
      .limit(1)
    milestoneName = m?.name ?? null
  }

  return serializeFreelancerTask(row, { milestoneName, overdue: isTaskOverdue(row) })
}

export async function updateFreelancerTaskStatus(
  auth: AuthContext,
  taskId: string,
  status: string,
) {
  const ctx = await requireFreelancerContext(auth)
  const existing = await getOwnedFreelancerTask(ctx, taskId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db
    .select({ status: projects.status })
    .from(projects)
    .where(eq(projects.id, existing.projectId))
    .limit(1)

  if (!project || isTerminalProjectStatus(project.status)) {
    throw new AppError('CONFLICT', 'Tasks cannot be changed on a completed or cancelled project.', 409)
  }

  if (TERMINAL_TASK_STATUSES.has(existing.status)) {
    throw new AppError('CONFLICT', 'This task can no longer be updated.', 409)
  }

  if (!canTransitionTaskStatus(existing.status, status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid task status transition.', 400)
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: status as typeof tasks.status.enumValues[number], updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.task_status_changed',
    entity: 'tasks',
    entityId: taskId,
    metadata: JSON.stringify({ projectId: existing.projectId, status }),
  })

  return getFreelancerAssignedTask(auth, updated.id)
}
