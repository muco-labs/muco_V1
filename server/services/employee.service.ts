import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  employeeProfiles,
  files,
  messages,
  milestones,
  notifications,
  projectMembers,
  projects,
  tasks,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { roleCanAccessPortal } from '../lib/auth/permissions.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { serverEnv } from '../lib/env.js'

export type EmployeeContext = {
  userId: string
  employeeId: string
  email: string
  fullName: string | null
}

const employeePortalRoles = new Set(['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'FOUNDER'])

export async function requireEmployeeContext(auth: AuthContext): Promise<EmployeeContext> {
  if (!roleCanAccessPortal(auth.roles, 'employee')) {
    throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
  }

  if (!auth.roles.some((role) => employeePortalRoles.has(role))) {
    throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
  }

  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)
  }

  const [profile] = await db
    .select({ id: employeeProfiles.id, userId: employeeProfiles.userId })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, auth.userId))
    .limit(1)

  if (!profile) {
    throw new AppError('FORBIDDEN', 'Employee profile is not set up. Contact administration.', 403)
  }

  const [user] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1)

  return {
    userId: auth.userId,
    employeeId: profile.id,
    email: user?.email ?? auth.email,
    fullName: user?.fullName ?? null,
  }
}

export async function getAssignedProjectIds(employeeId: string): Promise<string[]> {
  const db = getDb()
  if (!db) return []
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.employeeId, employeeId))
  return rows.map((r) => r.projectId)
}

export async function assertProjectAccess(employeeId: string, projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [member] = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)),
    )
    .limit(1)

  if (!member) {
    throw new AppError('NOT_FOUND', 'Project not found.', 404)
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) {
    throw new AppError('NOT_FOUND', 'Project not found.', 404)
  }

  return project
}

function milestoneProgressPercent(rows: Array<{ status: string }>): number | null {
  if (rows.length === 0) return null
  const completed = rows.filter((m) => m.status === 'completed').length
  return Math.round((completed / rows.length) * 100)
}

export async function getEmployeeDashboard(ctx: EmployeeContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const projectIds = await getAssignedProjectIds(ctx.employeeId)

  const myTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedEmployeeId, ctx.employeeId),
        inArray(tasks.status, ['todo', 'in_progress', 'blocked']),
      ),
    )
    .orderBy(tasks.dueDate)
    .limit(10)

  const assignedProjects =
    projectIds.length === 0
      ? []
      : await db
          .select()
          .from(projects)
          .where(inArray(projects.id, projectIds))
          .orderBy(desc(projects.updatedAt))
          .limit(8)

  const recentNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, ctx.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(8)

  const unread = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, ctx.userId), eq(notifications.read, false)))

  const recentMessages = await db
    .select()
    .from(messages)
    .where(
      or(eq(messages.senderUserId, ctx.userId), eq(messages.recipientUserId, ctx.userId)),
    )
    .orderBy(desc(messages.createdAt))
    .limit(5)

  return {
    welcomeName: ctx.fullName ?? ctx.email,
    myTasks,
    assignedProjects,
    recentNotifications,
    unreadNotificationCount: unread[0]?.count ?? 0,
    recentMessages,
  }
}

export async function getEmployeeProfile(ctx: EmployeeContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1)
  const [profile] = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.id, ctx.employeeId))
    .limit(1)

  return {
    email: user?.email ?? ctx.email,
    fullName: user?.fullName ?? null,
    status: user?.status ?? 'active',
    department: profile?.department ?? null,
    jobTitle: profile?.jobTitle ?? null,
  }
}

export type UpdateEmployeeProfileInput = {
  fullName?: string
  department?: string
  jobTitle?: string
}

export async function updateEmployeeProfile(
  ctx: EmployeeContext,
  _auth: AuthContext,
  input: UpdateEmployeeProfileInput,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (input.fullName !== undefined) {
    await db
      .update(users)
      .set({ fullName: input.fullName.trim(), updatedAt: new Date() })
      .where(eq(users.id, ctx.userId))
  }

  await db
    .update(employeeProfiles)
    .set({
      department: input.department?.trim() ?? undefined,
      jobTitle: input.jobTitle?.trim() ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(employeeProfiles.id, ctx.employeeId))

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'employee.profile_updated',
    entity: 'employee_profiles',
    entityId: ctx.employeeId,
  })

  return getEmployeeProfile(ctx)
}

type TaskListQuery = {
  status?: string
  priority?: string
  search?: string
  limit?: number
  offset?: number
}

export async function listEmployeeTasks(ctx: EmployeeContext, query: TaskListQuery = {}) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const limit = Math.min(query.limit ?? 50, 100)
  const offset = query.offset ?? 0

  const conditions = [eq(tasks.assignedEmployeeId, ctx.employeeId)]

  if (query.status) {
    conditions.push(eq(tasks.status, query.status as 'todo' | 'in_progress' | 'blocked' | 'done'))
  }
  if (query.priority) {
    conditions.push(eq(tasks.priority, query.priority as 'low' | 'medium' | 'high' | 'urgent'))
  }
  if (query.search?.trim()) {
    conditions.push(ilike(tasks.title, `%${query.search.trim()}%`))
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt))
    .limit(limit)
    .offset(offset)
}

export async function getEmployeeTask(ctx: EmployeeContext, taskId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task || task.assignedEmployeeId !== ctx.employeeId) {
    throw new AppError('NOT_FOUND', 'Task not found.', 404)
  }

  return task
}

const allowedTaskStatuses = new Set(['todo', 'in_progress', 'blocked', 'done'])

export async function updateEmployeeTask(
  ctx: EmployeeContext,
  auth: AuthContext,
  taskId: string,
  input: { status?: string; description?: string },
) {
  if (!hasPermission(auth.permissions, 'tasks.update')) {
    throw new AppError('FORBIDDEN', 'You cannot update tasks.', 403)
  }

  const task = await getEmployeeTask(ctx, taskId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (input.status && !allowedTaskStatuses.has(input.status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid task status.', 400)
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status: (input.status as typeof task.status) ?? task.status,
      description: input.description?.trim() ?? task.description,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.assignedEmployeeId, ctx.employeeId)))
    .returning()

  if (!updated) {
    throw new AppError('NOT_FOUND', 'Task not found.', 404)
  }

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'task.status_updated',
    entity: 'tasks',
    entityId: taskId,
    metadata: JSON.stringify({ status: updated.status }),
  })

  return updated
}

export async function listEmployeeProjects(ctx: EmployeeContext) {
  const projectIds = await getAssignedProjectIds(ctx.employeeId)
  if (projectIds.length === 0) return []

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select({
      project: projects,
      companyName: customerProfiles.companyName,
    })
    .from(projects)
    .innerJoin(customerProfiles, eq(projects.customerId, customerProfiles.id))
    .where(inArray(projects.id, projectIds))
    .orderBy(desc(projects.updatedAt))

  const withProgress = await Promise.all(
    rows.map(async (row) => {
      const ms = await db
        .select({ status: milestones.status })
        .from(milestones)
        .where(eq(milestones.projectId, row.project.id))
      return {
        ...row.project,
        customerCompany: row.companyName,
        progressPercent: milestoneProgressPercent(ms),
      }
    }),
  )

  return withProgress
}

export async function getEmployeeProjectDetail(ctx: EmployeeContext, projectId: string) {
  const project = await assertProjectAccess(ctx.employeeId, projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [customer] = await db
    .select({ companyName: customerProfiles.companyName })
    .from(customerProfiles)
    .where(eq(customerProfiles.id, project.customerId))
    .limit(1)

  const milestoneRows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(milestones.dueDate)

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.updatedAt))

  const team = await db
    .select({
      role: projectMembers.role,
      employeeId: projectMembers.employeeId,
      fullName: users.fullName,
    })
    .from(projectMembers)
    .innerJoin(employeeProfiles, eq(projectMembers.employeeId, employeeProfiles.id))
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  const fileRows = await db
    .select({
      id: files.id,
      fileName: files.fileName,
      mimeType: files.mimeType,
      fileSizeBytes: files.fileSizeBytes,
      category: files.category,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(eq(files.projectId, projectId))
    .orderBy(desc(files.createdAt))

  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, projectId))
    .orderBy(desc(messages.createdAt))
    .limit(50)

  return {
    project,
    customerCompany: customer?.companyName ?? null,
    milestones: milestoneRows,
    tasks: taskRows,
    team: team.map((m) => ({
      role: m.role,
      displayName: m.fullName ?? 'Team member',
    })),
    files: fileRows,
    messages: messageRows,
    progressPercent: milestoneProgressPercent(milestoneRows),
  }
}

export async function listEmployeeMilestones(ctx: EmployeeContext, projectId: string) {
  await assertProjectAccess(ctx.employeeId, projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(milestones.dueDate)
}

const ALLOWED_UPLOAD_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
  'application/json',
])

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

export async function listEmployeeFiles(ctx: EmployeeContext, projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const projectIds = await getAssignedProjectIds(ctx.employeeId)
  if (projectIds.length === 0) return []

  if (projectId) {
    await assertProjectAccess(ctx.employeeId, projectId)
  }

  const targetIds = projectId ? [projectId] : projectIds

  return db
    .select({
      id: files.id,
      fileName: files.fileName,
      mimeType: files.mimeType,
      fileSizeBytes: files.fileSizeBytes,
      category: files.category,
      projectId: files.projectId,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(inArray(files.projectId, targetIds))
    .orderBy(desc(files.createdAt))
    .limit(100)
}

export async function registerEmployeeFileUpload(
  ctx: EmployeeContext,
  auth: AuthContext,
  input: {
    projectId: string
    fileName: string
    mimeType: string
    fileSizeBytes: number
    category?: string
  },
) {
  if (!hasPermission(auth.permissions, 'files.upload')) {
    throw new AppError('FORBIDDEN', 'You cannot upload files.', 403)
  }

  await assertProjectAccess(ctx.employeeId, input.projectId)

  if (!ALLOWED_UPLOAD_MIME.has(input.mimeType)) {
    throw new AppError('VALIDATION_ERROR', 'This file type is not allowed.', 400)
  }
  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_UPLOAD_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'File exceeds the size limit (15 MB).', 400)
  }

  const safeName = input.fileName.replace(/[^\w.\-() ]+/g, '_').slice(0, 200)
  const storageKey = `projects/${input.projectId}/${Date.now()}-${safeName}`

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(files)
    .values({
      projectId: input.projectId,
      uploadedByUserId: ctx.userId,
      storageKey,
      fileName: safeName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      category: input.category ?? 'internal',
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'file.uploaded',
    entity: 'files',
    entityId: row.id,
    metadata: JSON.stringify({ projectId: input.projectId }),
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      file: row,
      upload: { configured: false as const, message: 'Storage is not configured.' },
    }
  }

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUploadUrl(storageKey)

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not prepare file upload.', 503)
  }

  return {
    file: row,
    upload: {
      configured: true as const,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    },
  }
}

export async function getEmployeeFileDownloadUrl(ctx: EmployeeContext, fileId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db.select().from(files).where(eq(files.id, fileId)).limit(1)
  if (!row?.projectId) throw new AppError('NOT_FOUND', 'File not found.', 404)

  await assertProjectAccess(ctx.employeeId, row.projectId)

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { configured: false as const, message: 'Storage is not configured.' }
  }

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUrl(row.storageKey, 120)

  if (error || !data?.signedUrl) {
    throw new AppError('NOT_FOUND', 'File is not available.', 404)
  }

  return { configured: true as const, url: data.signedUrl, fileName: row.fileName }
}

export async function listEmployeeMessages(ctx: EmployeeContext, projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (projectId) {
    await assertProjectAccess(ctx.employeeId, projectId)
    return db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt))
      .limit(100)
  }

  const projectIds = await getAssignedProjectIds(ctx.employeeId)
  if (projectIds.length === 0) {
    return db
      .select()
      .from(messages)
      .where(
        or(eq(messages.senderUserId, ctx.userId), eq(messages.recipientUserId, ctx.userId)),
      )
      .orderBy(desc(messages.createdAt))
      .limit(100)
  }

  return db
    .select()
    .from(messages)
    .where(
      or(
        eq(messages.senderUserId, ctx.userId),
        eq(messages.recipientUserId, ctx.userId),
        inArray(messages.projectId, projectIds),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(100)
}

export async function sendEmployeeMessage(
  ctx: EmployeeContext,
  auth: AuthContext,
  input: { body: string; projectId?: string },
) {
  if (!hasPermission(auth.permissions, 'messages.send')) {
    throw new AppError('FORBIDDEN', 'You cannot send messages.', 403)
  }

  const body = input.body.trim()
  if (body.length < 2 || body.length > 8000) {
    throw new AppError('VALIDATION_ERROR', 'Message must be between 2 and 8000 characters.', 400)
  }

  if (input.projectId) {
    await assertProjectAccess(ctx.employeeId, input.projectId)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(messages)
    .values({
      senderUserId: ctx.userId,
      projectId: input.projectId ?? null,
      body,
    })
    .returning()

  return row
}

export async function listEmployeeNotifications(ctx: EmployeeContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, ctx.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100)
}

export async function markEmployeeNotificationRead(ctx: EmployeeContext, notificationId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, ctx.userId)))
    .returning()

  if (!row) throw new AppError('NOT_FOUND', 'Notification not found.', 404)
  return row
}

export async function getEmployeeDeadlines(ctx: EmployeeContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const projectIds = await getAssignedProjectIds(ctx.employeeId)

  const taskDeadlines = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      projectId: tasks.projectId,
      kind: sql<string>`'task'`,
    })
    .from(tasks)
    .where(
      and(eq(tasks.assignedEmployeeId, ctx.employeeId), sql`${tasks.dueDate} IS NOT NULL`),
    )
    .orderBy(tasks.dueDate)
    .limit(50)

  const milestoneDeadlines =
    projectIds.length === 0
      ? []
      : await db
          .select({
            id: milestones.id,
            title: milestones.name,
            dueDate: milestones.dueDate,
            projectId: milestones.projectId,
            kind: sql<string>`'milestone'`,
          })
          .from(milestones)
          .where(
            and(inArray(milestones.projectId, projectIds), sql`${milestones.dueDate} IS NOT NULL`),
          )
          .orderBy(milestones.dueDate)
          .limit(50)

  return [...taskDeadlines, ...milestoneDeadlines].sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0
    return ad - bd
  })
}

export async function employeeHasProjectAccess(employeeId: string, projectId: string) {
  const db = getDb()
  if (!db) return false
  const [row] = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)))
    .limit(1)
  return Boolean(row)
}
