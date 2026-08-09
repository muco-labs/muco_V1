import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  employeeProfiles,
  notifications,
  projectMembers,
  projects,
  roles,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import {
  assertProjectsPermission,
} from './project-delivery.service.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import {
  normalizeProjectMemberRole,
  presentProjectMemberRoleLabel,
} from '../lib/projects/project-member-roles.js'
import { computeMemberTaskWorkload, userCanJoinProjectTeam } from '../lib/projects/project-team.js'

const ELIGIBLE_USER_STATUSES = new Set(['active', 'invited'])
const ELIGIBLE_EMPLOYMENT_STATES = new Set(['active', 'onboarding'])

function assertProjectsAssignPermission(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'projects.assign')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to manage project team members.', 403)
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

async function loadProjectTaskRows(projectId: string) {
  const db = getDb()
  if (!db) return []
  return db
    .select({
      assignedEmployeeId: tasks.assignedEmployeeId,
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

export async function assertEmployeeEligibleForProjectTeam(employeeId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      employeeId: employeeProfiles.id,
      userId: users.id,
      userStatus: users.status,
      employmentState: employeeProfiles.employmentState,
      fullName: users.fullName,
    })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(eq(employeeProfiles.id, employeeId))
    .limit(1)

  if (!row) {
    throw new AppError('VALIDATION_ERROR', 'Employee not found.', 400)
  }

  if (!ELIGIBLE_USER_STATUSES.has(row.userStatus)) {
    throw new AppError('VALIDATION_ERROR', 'Employee account is not active.', 400)
  }

  if (!ELIGIBLE_EMPLOYMENT_STATES.has(row.employmentState)) {
    throw new AppError('VALIDATION_ERROR', 'Employee is not eligible for project assignment.', 400)
  }

  const roleNames = await getUserRoleNames(row.userId)
  if (!userCanJoinProjectTeam(roleNames)) {
    throw new AppError('VALIDATION_ERROR', 'Only internal team members can be added to a project.', 400)
  }

  return row
}

function serializeMember(
  row: {
    employeeId: string
    role: string
    displayName: string
    employmentState: string
    userStatus: string
  },
  workload: { activeTaskCount: number; overdueTaskCount: number },
) {
  return {
    employeeId: row.employeeId,
    role: row.role,
    roleLabel: presentProjectMemberRoleLabel(row.role),
    displayName: row.displayName,
    employmentState: row.employmentState,
    userStatus: row.userStatus,
    activeTaskCount: workload.activeTaskCount,
    overdueTaskCount: workload.overdueTaskCount,
    canRemove: workload.activeTaskCount === 0,
  }
}

export async function listProjectMembersDetailedAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select({
      employeeId: employeeProfiles.id,
      role: projectMembers.role,
      fullName: users.fullName,
      jobTitle: employeeProfiles.jobTitle,
      employmentState: employeeProfiles.employmentState,
      userStatus: users.status,
    })
    .from(projectMembers)
    .innerJoin(employeeProfiles, eq(projectMembers.employeeId, employeeProfiles.id))
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  const taskRows = await loadProjectTaskRows(projectId)

  return rows.map((r) =>
    serializeMember(
      {
        employeeId: r.employeeId,
        role: r.role,
        displayName: r.fullName ?? r.jobTitle ?? 'Team member',
        employmentState: r.employmentState,
        userStatus: r.userStatus,
      },
      computeMemberTaskWorkload(taskRows, r.employeeId),
    ),
  )
}

export async function listProjectMemberCandidatesAdmin(auth: AuthContext, projectId: string) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const existing = await db
    .select({ employeeId: projectMembers.employeeId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId))

  const excludeIds = existing.map((e) => e.employeeId)

  const employeeRows = await db
    .select({
      employeeId: employeeProfiles.id,
      userId: users.id,
      fullName: users.fullName,
      jobTitle: employeeProfiles.jobTitle,
      employmentState: employeeProfiles.employmentState,
      userStatus: users.status,
    })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(
      and(
        inArray(employeeProfiles.employmentState, ['active', 'onboarding']),
        inArray(users.status, ['active', 'invited']),
        ...(excludeIds.length ? [notInArray(employeeProfiles.id, excludeIds)] : []),
      ),
    )

  const candidates = []
  for (const row of employeeRows) {
    const roleNames = await getUserRoleNames(row.userId)
    if (!userCanJoinProjectTeam(roleNames)) continue
    candidates.push({
      employeeId: row.employeeId,
      displayName: row.fullName ?? row.jobTitle ?? 'Team member',
      employmentState: row.employmentState,
    })
  }

  return candidates
}

async function notifyEmployeeUser(
  employeeId: string,
  input: { type: string; title: string; message: string },
) {
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

export async function addProjectMemberAdmin(
  auth: AuthContext,
  projectId: string,
  employeeId: string,
  roleInput: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const role = normalizeProjectMemberRole(roleInput)
  if (!role) throw new AppError('VALIDATION_ERROR', 'Invalid project role.', 400)

  await assertEmployeeEligibleForProjectTeam(employeeId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db
    .select({ employeeId: projectMembers.employeeId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))
    .limit(1)

  if (existing) {
    throw new AppError('CONFLICT', 'This employee is already assigned to the project.', 409)
  }

  await db.insert(projectMembers).values({ projectId, employeeId, role })

  const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1)
  const projectRef = formatProjectReference(projectId)

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'project.member_added',
    entity: 'project_members',
    entityId: projectId,
    metadata: JSON.stringify({ employeeId, role }),
  })

  await notifyEmployeeUser(employeeId, {
    type: 'project.member_added',
    title: 'Added to project',
    message: `You were added to project ${projectRef}${project?.name ? `: ${project.name}` : ''}.`,
  })

  const members = await listProjectMembersDetailedAdmin(auth, projectId)
  const added = members.find((m) => m.employeeId === employeeId)
  if (!added) throw new AppError('INTERNAL_ERROR', 'Member could not be loaded.', 500)
  return added
}

export async function updateProjectMemberRoleAdmin(
  auth: AuthContext,
  projectId: string,
  employeeId: string,
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
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))
    .limit(1)

  if (!member) throw new AppError('NOT_FOUND', 'Project member not found.', 404)

  if (member.role === role) {
    const [current] = (await listProjectMembersDetailedAdmin(auth, projectId)).filter(
      (m) => m.employeeId === employeeId,
    )
    return current
  }

  await db
    .update(projectMembers)
    .set({ role })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'project.member_role_changed',
    entity: 'project_members',
    entityId: projectId,
    metadata: JSON.stringify({ employeeId, role }),
  })

  const projectRef = formatProjectReference(projectId)
  await notifyEmployeeUser(employeeId, {
    type: 'project.member_role_changed',
    title: 'Project role updated',
    message: `Your role on ${projectRef} is now ${presentProjectMemberRoleLabel(role)}.`,
  })

  return (await listProjectMembersDetailedAdmin(auth, projectId)).find((m) => m.employeeId === employeeId)
}

export async function removeProjectMemberAdmin(
  auth: AuthContext,
  projectId: string,
  employeeId: string,
) {
  assertProjectsAssignPermission(auth)
  await ensureProjectExists(projectId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [member] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))
    .limit(1)

  if (!member) throw new AppError('NOT_FOUND', 'Project member not found.', 404)

  const taskRows = await loadProjectTaskRows(projectId)
  const workload = computeMemberTaskWorkload(taskRows, employeeId)
  if (workload.activeTaskCount > 0) {
    throw new AppError(
      'CONFLICT',
      'This team member has active tasks. Reassign those tasks before removing them from the project.',
      409,
    )
  }

  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'project.member_removed',
    entity: 'project_members',
    entityId: projectId,
    metadata: JSON.stringify({ employeeId }),
  })

  const projectRef = formatProjectReference(projectId)
  await notifyEmployeeUser(employeeId, {
    type: 'project.member_removed',
    title: 'Removed from project',
    message: `You were removed from project ${projectRef}.`,
  })

  return { ok: true as const }
}
