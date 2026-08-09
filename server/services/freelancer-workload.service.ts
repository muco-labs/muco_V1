import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { projectFreelancers, projects, tasks, freelancerProfiles } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { requireFreelancerContext } from './freelancer-network.service.js'
import { hasPermission } from '../lib/auth/permissions.js'
import {
  countActiveFreelancerProjects,
  summarizeFreelancerTaskRows,
} from '../lib/projects/project-team.js'
import { presentFreelancerAvailabilityLabel } from '../lib/freelancers/freelancer-availability.js'

export type FreelancerWorkloadSummary = {
  activeProjectCount: number
  activeTaskCount: number
  overdueTaskCount: number
  blockedTaskCount: number
}

export async function computeFreelancerWorkloadSummary(
  freelancerId: string,
): Promise<FreelancerWorkloadSummary> {
  const db = getDb()
  if (!db) {
    return {
      activeProjectCount: 0,
      activeTaskCount: 0,
      overdueTaskCount: 0,
      blockedTaskCount: 0,
    }
  }

  const taskRows = await db
    .select({ status: tasks.status, dueDate: tasks.dueDate })
    .from(tasks)
    .where(eq(tasks.assignedFreelancerId, freelancerId))

  const projectRows = await db
    .select({ status: projects.status })
    .from(projectFreelancers)
    .innerJoin(projects, eq(projectFreelancers.projectId, projects.id))
    .where(eq(projectFreelancers.freelancerId, freelancerId))

  const taskWorkload = summarizeFreelancerTaskRows(taskRows)

  return {
    activeProjectCount: countActiveFreelancerProjects(projectRows),
    activeTaskCount: taskWorkload.activeTaskCount,
    overdueTaskCount: taskWorkload.overdueTaskCount,
    blockedTaskCount: taskWorkload.blockedTaskCount,
  }
}

export async function getFreelancerAvailabilityPortal(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      availabilityStatus: freelancerProfiles.availabilityStatus,
      availabilityNote: freelancerProfiles.availabilityNote,
      availabilityUpdatedAt: freelancerProfiles.availabilityUpdatedAt,
      approvalStatus: freelancerProfiles.approvalStatus,
      verificationStatus: freelancerProfiles.verificationStatus,
    })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, ctx.freelancerId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Freelancer profile not found.', 404)

  return {
    availabilityStatus: row.availabilityStatus,
    availabilityStatusLabel: presentFreelancerAvailabilityLabel(row.availabilityStatus),
    availabilityNote: row.availabilityNote,
    availabilityUpdatedAt: row.availabilityUpdatedAt?.toISOString() ?? null,
    canManageAvailability:
      row.verificationStatus === 'verified' && row.approvalStatus === 'approved',
  }
}

export async function getFreelancerWorkloadPortal(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const summary = await computeFreelancerWorkloadSummary(ctx.freelancerId)
  return { ...summary, freelancerId: ctx.freelancerId }
}

export async function getFreelancerWorkloadAdmin(auth: AuthContext, freelancerId: string) {
  if (!hasPermission(auth.permissions, 'freelancers.view')) {
    throw new AppError('FORBIDDEN', 'You cannot view freelancer workload.', 403)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({ id: freelancerProfiles.id })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Freelancer not found.', 404)

  const summary = await computeFreelancerWorkloadSummary(freelancerId)
  return { ...summary, freelancerId }
}

const emptyWorkload = (): FreelancerWorkloadSummary => ({
  activeProjectCount: 0,
  activeTaskCount: 0,
  overdueTaskCount: 0,
  blockedTaskCount: 0,
})

/** Batch workload for discovery (same rules as computeFreelancerWorkloadSummary). */
export async function computeFreelancerWorkloadSummariesBatch(
  freelancerIds: string[],
): Promise<Map<string, FreelancerWorkloadSummary>> {
  const result = new Map<string, FreelancerWorkloadSummary>()
  if (!freelancerIds.length) return result
  for (const id of freelancerIds) result.set(id, emptyWorkload())

  const db = getDb()
  if (!db) return result

  const taskRows = await db
    .select({
      freelancerId: tasks.assignedFreelancerId,
      status: tasks.status,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(inArray(tasks.assignedFreelancerId, freelancerIds))

  const projectRows = await db
    .select({
      freelancerId: projectFreelancers.freelancerId,
      status: projects.status,
    })
    .from(projectFreelancers)
    .innerJoin(projects, eq(projectFreelancers.projectId, projects.id))
    .where(inArray(projectFreelancers.freelancerId, freelancerIds))

  const tasksByFreelancer = new Map<string, Array<{ status: string; dueDate: Date | null }>>()
  for (const row of taskRows) {
    if (!row.freelancerId) continue
    const list = tasksByFreelancer.get(row.freelancerId) ?? []
    list.push({ status: row.status, dueDate: row.dueDate })
    tasksByFreelancer.set(row.freelancerId, list)
  }

  const projectsByFreelancer = new Map<string, Array<{ status: string }>>()
  for (const row of projectRows) {
    const list = projectsByFreelancer.get(row.freelancerId) ?? []
    list.push({ status: row.status })
    projectsByFreelancer.set(row.freelancerId, list)
  }

  for (const id of freelancerIds) {
    const taskWorkload = summarizeFreelancerTaskRows(tasksByFreelancer.get(id) ?? [])
    result.set(id, {
      activeProjectCount: countActiveFreelancerProjects(projectsByFreelancer.get(id) ?? []),
      activeTaskCount: taskWorkload.activeTaskCount,
      overdueTaskCount: taskWorkload.overdueTaskCount,
      blockedTaskCount: taskWorkload.blockedTaskCount,
    })
  }

  return result
}
