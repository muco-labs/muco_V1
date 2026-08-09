import { and, eq, notInArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  freelancerProfiles,
  notifications,
  projectFreelancers,
  projects,
  roles,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { assertProjectsPermission } from './project-delivery.service.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import {
  normalizeProjectMemberRole,
  presentProjectMemberRoleLabel,
} from '../lib/projects/project-member-roles.js'
import { computeFreelancerTaskWorkload } from '../lib/projects/project-team.js'
import { isFreelancerEligibleForProjectAssignment } from '../lib/freelancers/freelancer-status.js'

function assertProjectsAssignPermission(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'projects.assign')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to manage project freelancers.', 403)
  }
}

async function ensureProjectExists(projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Project not found.', 404)
}

async function loadProjectTaskRowsForFreelancers(projectId: string) {
  const db = getDb()
  if (!db) return []
  return db
    .select({
      assignedFreelancerId: tasks.assignedFreelancerId,
      status: tasks.status,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
}

async function getUserRoleNames(userId: string): Promise<string[]> {
  const db = getDb()
  if (!db) return []
  const rows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))
  return rows.map((r) => r.name)
}

export async function assertFreelancerEligibleForProjectAssignment(freelancerId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      freelancerId: freelancerProfiles.id,
      userId: users.id,
      userStatus: users.status,
      fullName: freelancerProfiles.fullName,
      professionalRole: freelancerProfiles.professionalRole,
      approvalStatus: freelancerProfiles.approvalStatus,
      verificationStatus: freelancerProfiles.verificationStatus,
      availabilityStatus: freelancerProfiles.availabilityStatus,
      openToProjects: freelancerProfiles.openToProjects,
    })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)

  if (!row) {
    throw new AppError('VALIDATION_ERROR', 'Freelancer not found.', 400)
  }

  if (!row.userId) {
    throw new AppError('VALIDATION_ERROR', 'Freelancer must have a linked user account.', 400)
  }

  const roleNames = await getUserRoleNames(row.userId)
  if (!roleNames.includes('FREELANCER')) {
    throw new AppError('VALIDATION_ERROR', 'User does not have the freelancer role.', 400)
  }
  if (roleNames.includes('CUSTOMER')) {
    throw new AppError('VALIDATION_ERROR', 'Customers cannot be assigned to projects.', 400)
  }

  if (
    !isFreelancerEligibleForProjectAssignment({
      approvalStatus: row.approvalStatus,
      verificationStatus: row.verificationStatus,
      userId: row.userId,
      userStatus: row.userStatus ?? 'inactive',
      availabilityStatus: row.availabilityStatus,
      openToProjects: row.openToProjects,
    })
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Freelancer is not eligible for assignment (must be verified, approved, available, and linked).',
      400,
    )
  }

  return row
}

export async function assertFreelancerOnProject(projectId: string, freelancerId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({ freelancerId: projectFreelancers.freelancerId })
    .from(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )
    .limit(1)

  if (!row) {
    throw new AppError('VALIDATION_ERROR', 'Freelancer must be assigned to this project.', 400)
  }
}

function serializeFreelancerMember(
  row: {
    freelancerId: string
    role: string
    displayName: string
    professionalRole: string
  },
  workload: { activeTaskCount: number; overdueTaskCount: number },
) {
  return {
    freelancerId: row.freelancerId,
    role: row.role,
    roleLabel: presentProjectMemberRoleLabel(row.role),
    displayName: row.displayName,
    professionalRole: row.professionalRole,
    activeTaskCount: workload.activeTaskCount,
    overdueTaskCount: workload.overdueTaskCount,
    canRemove: workload.activeTaskCount === 0,
  }
}

export async function listProjectFreelancersDetailedAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select({
      freelancerId: freelancerProfiles.id,
      role: projectFreelancers.role,
      fullName: freelancerProfiles.fullName,
      professionalRole: freelancerProfiles.professionalRole,
    })
    .from(projectFreelancers)
    .innerJoin(freelancerProfiles, eq(projectFreelancers.freelancerId, freelancerProfiles.id))
    .where(eq(projectFreelancers.projectId, projectId))

  const taskRows = await loadProjectTaskRowsForFreelancers(projectId)

  return rows.map((r) =>
    serializeFreelancerMember(
      {
        freelancerId: r.freelancerId,
        role: r.role,
        displayName: r.fullName,
        professionalRole: r.professionalRole,
      },
      computeFreelancerTaskWorkload(taskRows, r.freelancerId),
    ),
  )
}

export async function listProjectFreelancerCandidatesAdmin(
  auth: AuthContext,
  projectId: string,
  search?: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const existing = await db
    .select({ freelancerId: projectFreelancers.freelancerId })
    .from(projectFreelancers)
    .where(eq(projectFreelancers.projectId, projectId))

  const excludeIds = existing.map((e) => e.freelancerId)

  const flRows = await db
    .select({
      freelancerId: freelancerProfiles.id,
      userId: freelancerProfiles.userId,
      fullName: freelancerProfiles.fullName,
      professionalRole: freelancerProfiles.professionalRole,
      approvalStatus: freelancerProfiles.approvalStatus,
      verificationStatus: freelancerProfiles.verificationStatus,
      availabilityStatus: freelancerProfiles.availabilityStatus,
      openToProjects: freelancerProfiles.openToProjects,
      userStatus: users.status,
    })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(
      and(
        eq(freelancerProfiles.approvalStatus, 'approved'),
        eq(freelancerProfiles.verificationStatus, 'verified'),
        ...(excludeIds.length ? [notInArray(freelancerProfiles.id, excludeIds)] : []),
      ),
    )

  const q = search?.trim().toLowerCase()
  const candidates = []

  for (const row of flRows) {
    if (
      !isFreelancerEligibleForProjectAssignment({
        approvalStatus: row.approvalStatus,
        verificationStatus: row.verificationStatus,
        userId: row.userId,
        userStatus: row.userStatus ?? 'inactive',
        availabilityStatus: row.availabilityStatus,
        openToProjects: row.openToProjects,
      })
    ) {
      continue
    }
    if (!row.userId) continue

    const roleNames = await getUserRoleNames(row.userId)
    if (!roleNames.includes('FREELANCER') || roleNames.includes('CUSTOMER')) continue

    if (q) {
      const hay = `${row.fullName} ${row.professionalRole}`.toLowerCase()
      if (!hay.includes(q)) continue
    }

    candidates.push({
      freelancerId: row.freelancerId,
      displayName: row.fullName,
      professionalRole: row.professionalRole,
    })
  }

  return candidates
}

async function notifyFreelancerUser(
  freelancerId: string,
  input: { type: string; title: string; message: string },
) {
  const db = getDb()
  if (!db) return

  const [profile] = await db
    .select({ userId: freelancerProfiles.userId })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)

  if (!profile?.userId) return

  await db.insert(notifications).values({
    userId: profile.userId,
    type: input.type,
    title: input.title,
    message: input.message,
  })
}

export async function addProjectFreelancerAdmin(
  auth: AuthContext,
  projectId: string,
  freelancerId: string,
  roleInput: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const role = normalizeProjectMemberRole(roleInput)
  if (!role) throw new AppError('VALIDATION_ERROR', 'Invalid project role.', 400)

  await assertFreelancerEligibleForProjectAssignment(freelancerId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db
    .select({ freelancerId: projectFreelancers.freelancerId })
    .from(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )
    .limit(1)

  if (existing) {
    throw new AppError('CONFLICT', 'This freelancer is already assigned to the project.', 409)
  }

  await db.insert(projectFreelancers).values({ projectId, freelancerId, role })

  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
  const projectRef = formatProjectReference(projectId)

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.project_assigned',
    entity: 'project_freelancers',
    entityId: projectId,
    metadata: JSON.stringify({ freelancerId, role }),
  })

  await notifyFreelancerUser(freelancerId, {
    type: 'freelancer.project_assigned',
    title: 'Project assignment',
    message: `You were assigned to project ${projectRef}${project?.name ? `: ${project.name}` : ''}.`,
  })

  const members = await listProjectFreelancersDetailedAdmin(auth, projectId)
  const added = members.find((m) => m.freelancerId === freelancerId)
  if (!added) throw new AppError('INTERNAL_ERROR', 'Freelancer could not be loaded.', 500)
  return added
}

export async function updateProjectFreelancerRoleAdmin(
  auth: AuthContext,
  projectId: string,
  freelancerId: string,
  roleInput: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const role = normalizeProjectMemberRole(roleInput)
  if (!role) throw new AppError('VALIDATION_ERROR', 'Invalid project role.', 400)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [member] = await db
    .select()
    .from(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )
    .limit(1)

  if (!member) throw new AppError('NOT_FOUND', 'Project freelancer not found.', 404)

  if (member.role === role) {
    return (await listProjectFreelancersDetailedAdmin(auth, projectId)).find(
      (m) => m.freelancerId === freelancerId,
    )
  }

  await db
    .update(projectFreelancers)
    .set({ role })
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.project_role_changed',
    entity: 'project_freelancers',
    entityId: projectId,
    metadata: JSON.stringify({ freelancerId, role }),
  })

  const projectRef = formatProjectReference(projectId)
  await notifyFreelancerUser(freelancerId, {
    type: 'freelancer.project_role_changed',
    title: 'Project role updated',
    message: `Your role on ${projectRef} is now ${presentProjectMemberRoleLabel(role)}.`,
  })

  return (await listProjectFreelancersDetailedAdmin(auth, projectId)).find(
    (m) => m.freelancerId === freelancerId,
  )
}

export async function removeProjectFreelancerAdmin(
  auth: AuthContext,
  projectId: string,
  freelancerId: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [member] = await db
    .select()
    .from(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )
    .limit(1)

  if (!member) throw new AppError('NOT_FOUND', 'Project freelancer not found.', 404)

  const taskRows = await loadProjectTaskRowsForFreelancers(projectId)
  const workload = computeFreelancerTaskWorkload(taskRows, freelancerId)
  if (workload.activeTaskCount > 0) {
    throw new AppError(
      'CONFLICT',
      'This freelancer has active tasks. Reassign those tasks before removing them from the project.',
      409,
    )
  }

  await db
    .delete(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.project_removed',
    entity: 'project_freelancers',
    entityId: projectId,
    metadata: JSON.stringify({ freelancerId }),
  })

  const projectRef = formatProjectReference(projectId)
  await notifyFreelancerUser(freelancerId, {
    type: 'freelancer.project_removed',
    title: 'Removed from project',
    message: `You were removed from project ${projectRef}.`,
  })

  return { ok: true as const }
}

export async function isFreelancerAssignedToProject(projectId: string, freelancerId: string) {
  const db = getDb()
  if (!db) return false
  const [row] = await db
    .select({ freelancerId: projectFreelancers.freelancerId })
    .from(projectFreelancers)
    .where(
      and(eq(projectFreelancers.projectId, projectId), eq(projectFreelancers.freelancerId, freelancerId)),
    )
    .limit(1)
  return Boolean(row)
}

export async function notifyFreelancerTaskAssigned(
  freelancerId: string,
  input: { title: string; message: string },
) {
  await notifyFreelancerUser(freelancerId, {
    type: 'freelancer.task_assigned',
    title: input.title,
    message: input.message,
  })
}
