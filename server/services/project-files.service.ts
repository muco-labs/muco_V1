import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { auditLogs, files, notifications, projects, roles, userRoles } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import {
  buildProjectStorageKey,
  isCustomerVisibleFile,
  isDeliverableFile,
  normalizeProjectFileCategory,
  PROJECT_FILE_VISIBILITIES,
  sanitizeProjectFileName,
  serializeAdminProjectFile,
  serializeCustomerProjectFile,
  SIGNED_DOWNLOAD_TTL_SECONDS,
  validateProjectFileUpload,
  type ProjectFileVisibility,
} from '../lib/files/project-file.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { serverEnv } from '../lib/env.js'
import { getOwnedProject, type CustomerContext } from './customer.service.js'
import { notifyCustomerProjectUpdate } from './project-delivery-notify.js'

async function getProjectRow(projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  return row
}

async function getActiveProjectFile(projectId: string, fileId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.projectId, projectId)))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'File not found.', 404)
  return row
}

async function notifyAdminsProjectFileUploaded(projectId: string, fileName: string) {
  const db = getDb()
  if (!db) return

  const reference = formatProjectReference(projectId)
  const adminUsers = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))

  const unique = [...new Set(adminUsers.map((r) => r.userId))]
  if (unique.length === 0) return

  await db.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: 'project.file_uploaded',
      title: 'New project document uploaded',
      message: `${reference}: ${fileName} was uploaded by a customer.`,
    })),
  )
}

export async function listCustomerProjectFiles(ctx: CustomerContext, projectId: string) {
  await getOwnedProject(ctx.customerId, projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select()
    .from(files)
    .where(eq(files.projectId, projectId))
    .orderBy(desc(files.createdAt))

  const visible = rows.filter((row) => isCustomerVisibleFile(row))
  const documents = visible.map(serializeCustomerProjectFile)
  const deliverables = visible.filter(isDeliverableFile).map(serializeCustomerProjectFile)

  return { documents, deliverables }
}

export async function prepareCustomerProjectFileUpload(
  ctx: CustomerContext,
  auth: AuthContext,
  projectId: string,
  input: { fileName: string; mimeType: string; fileSizeBytes: number; category?: string },
) {
  if (!hasPermission(auth.permissions, 'files.upload')) {
    throw new AppError('FORBIDDEN', 'You cannot upload files.', 403)
  }

  await getOwnedProject(ctx.customerId, projectId)
  const validated = validateProjectFileUpload(input)
  if (!validated.ok) throw new AppError('VALIDATION_ERROR', validated.reason, 400)

  const safeName = sanitizeProjectFileName(input.fileName)
  const storageKey = buildProjectStorageKey(projectId, safeName)
  const category = normalizeProjectFileCategory(input.category ?? 'customer_upload')

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(files)
    .values({
      customerId: ctx.customerId,
      projectId,
      uploadedByUserId: ctx.userId,
      storageKey,
      fileName: safeName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      category,
      visibility: 'internal',
      status: 'pending',
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'file.uploaded',
    entity: 'files',
    entityId: row.id,
    metadata: JSON.stringify({ projectId, uploader: 'customer' }),
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      file: serializeCustomerProjectFile(row),
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
    file: { id: row.id, fileName: row.fileName },
    upload: {
      configured: true as const,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    },
  }
}

export async function finalizeCustomerProjectFile(
  ctx: CustomerContext,
  projectId: string,
  fileId: string,
) {
  await getOwnedProject(ctx.customerId, projectId)
  const row = await getActiveProjectFile(projectId, fileId)

  if (row.status === 'active') {
    return serializeCustomerProjectFile(row)
  }

  if (row.status === 'archived') {
    throw new AppError('CONFLICT', 'This file is no longer available.', 409)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [updated] = await db
    .update(files)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(files.id, fileId))
    .returning()

  await notifyAdminsProjectFileUploaded(projectId, updated.fileName)
  return serializeCustomerProjectFile(updated)
}

export async function getCustomerProjectFileDownload(
  ctx: CustomerContext,
  projectId: string,
  fileId: string,
) {
  await getOwnedProject(ctx.customerId, projectId)
  const row = await getActiveProjectFile(projectId, fileId)

  if (!isCustomerVisibleFile(row)) {
    throw new AppError('NOT_FOUND', 'File not found.', 404)
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { configured: false as const, message: 'Storage is not configured.' }
  }

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUrl(row.storageKey, SIGNED_DOWNLOAD_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new AppError('NOT_FOUND', 'File is not available.', 404)
  }

  return {
    configured: true as const,
    url: data.signedUrl,
    fileName: row.fileName,
    expiresInSeconds: SIGNED_DOWNLOAD_TTL_SECONDS,
  }
}

export async function listAdminProjectFiles(auth: AuthContext, projectId: string) {
  if (!hasPermission(auth.permissions, 'files.view')) {
    throw new AppError('FORBIDDEN', 'You cannot view project files.', 403)
  }

  await getProjectRow(projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select()
    .from(files)
    .where(eq(files.projectId, projectId))
    .orderBy(desc(files.createdAt))

  return rows.map(serializeAdminProjectFile)
}

export async function prepareAdminProjectFileUpload(
  auth: AuthContext,
  projectId: string,
  input: {
    fileName: string
    mimeType: string
    fileSizeBytes: number
    category?: string
    visibility?: ProjectFileVisibility
  },
) {
  if (!hasPermission(auth.permissions, 'files.upload')) {
    throw new AppError('FORBIDDEN', 'You cannot upload files.', 403)
  }

  const project = await getProjectRow(projectId)
  const validated = validateProjectFileUpload(input)
  if (!validated.ok) throw new AppError('VALIDATION_ERROR', validated.reason, 400)

  const visibility = input.visibility ?? 'internal'
  if (!(PROJECT_FILE_VISIBILITIES as readonly string[]).includes(visibility)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid visibility.', 400)
  }

  const safeName = sanitizeProjectFileName(input.fileName)
  const storageKey = buildProjectStorageKey(projectId, safeName)
  const category = normalizeProjectFileCategory(input.category ?? 'project_document')

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(files)
    .values({
      customerId: project.customerId,
      projectId,
      uploadedByUserId: auth.userId,
      storageKey,
      fileName: safeName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      category,
      visibility,
      status: 'pending',
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'file.uploaded',
    entity: 'files',
    entityId: row.id,
    metadata: JSON.stringify({ projectId, uploader: 'team' }),
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      file: serializeAdminProjectFile(row),
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
    file: serializeAdminProjectFile(row),
    upload: {
      configured: true as const,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    },
  }
}

export async function finalizeAdminProjectFile(auth: AuthContext, projectId: string, fileId: string) {
  if (!hasPermission(auth.permissions, 'files.upload')) {
    throw new AppError('FORBIDDEN', 'You cannot upload files.', 403)
  }

  await getProjectRow(projectId)
  const row = await getActiveProjectFile(projectId, fileId)

  if (row.status === 'active') {
    return serializeAdminProjectFile(row)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [updated] = await db
    .update(files)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(files.id, fileId))
    .returning()

  if (updated.visibility === 'customer_visible' && updated.customerId) {
    await notifyCustomerProjectUpdate(updated.customerId, {
      type: 'project.file_available',
      title: 'New project document available',
      message: 'A new project document is available in your portal.',
    })
  }

  return serializeAdminProjectFile(updated)
}

export async function updateAdminProjectFile(
  auth: AuthContext,
  projectId: string,
  fileId: string,
  input: {
    visibility?: ProjectFileVisibility
    category?: string
    status?: 'active' | 'archived'
  },
) {
  if (!hasPermission(auth.permissions, 'files.delete')) {
    throw new AppError('FORBIDDEN', 'You cannot manage project files.', 403)
  }

  await getProjectRow(projectId)
  const existing = await getActiveProjectFile(projectId, fileId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const nextVisibility = input.visibility ?? existing.visibility
  const becameCustomerVisible =
    existing.visibility !== 'customer_visible' && nextVisibility === 'customer_visible'

  const [updated] = await db
    .update(files)
    .set({
      visibility: nextVisibility,
      category: input.category ? normalizeProjectFileCategory(input.category) : existing.category,
      status: input.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(files.id, fileId))
    .returning()

  if (input.visibility) {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'file.visibility_changed',
      entity: 'files',
      entityId: fileId,
      metadata: JSON.stringify({ visibility: input.visibility }),
    })
  }

  if (input.status === 'archived') {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'file.archived',
      entity: 'files',
      entityId: fileId,
      metadata: JSON.stringify({ projectId }),
    })
  }

  if (becameCustomerVisible && updated.customerId) {
    await notifyCustomerProjectUpdate(updated.customerId, {
      type: 'project.file_available',
      title: 'New project document available',
      message: 'A new project document is available in your portal.',
    })
  }

  return serializeAdminProjectFile(updated)
}

export async function getAdminProjectFileDownload(
  auth: AuthContext,
  projectId: string,
  fileId: string,
) {
  if (!hasPermission(auth.permissions, 'files.view')) {
    throw new AppError('FORBIDDEN', 'You cannot download files.', 403)
  }

  await getProjectRow(projectId)
  const row = await getActiveProjectFile(projectId, fileId)
  if (row.status === 'archived') {
    throw new AppError('NOT_FOUND', 'File not found.', 404)
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { configured: false as const, message: 'Storage is not configured.' }
  }

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUrl(row.storageKey, SIGNED_DOWNLOAD_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new AppError('NOT_FOUND', 'File is not available.', 404)
  }

  return {
    configured: true as const,
    url: data.signedUrl,
    fileName: row.fileName,
    expiresInSeconds: SIGNED_DOWNLOAD_TTL_SECONDS,
  }
}
