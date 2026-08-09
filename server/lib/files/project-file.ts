import { randomUUID } from 'node:crypto'

export const PROJECT_FILE_MAX_BYTES = 25 * 1024 * 1024
export const SIGNED_DOWNLOAD_TTL_SECONDS = 120

export const PROJECT_FILE_CATEGORIES = [
  'project_document',
  'customer_upload',
  'deliverable',
  'reference',
  'contract',
  'other',
] as const

export type ProjectFileCategory = (typeof PROJECT_FILE_CATEGORIES)[number]

export const PROJECT_FILE_VISIBILITIES = ['internal', 'customer_visible'] as const
export type ProjectFileVisibility = (typeof PROJECT_FILE_VISIBILITIES)[number]

export const PROJECT_FILE_STATUSES = ['pending', 'active', 'archived'] as const
export type ProjectFileStatus = (typeof PROJECT_FILE_STATUSES)[number]

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
}

export const ALLOWED_PROJECT_FILE_MIME = new Set(Object.values(EXTENSION_TO_MIME))

export function sanitizeProjectFileName(name: string): string {
  const base = name
    .replace(/[/\\]+/g, '_')
    .replace(/\.\.+/g, '_')
    .replace(/[^\w.\-() ]+/g, '_')
    .trim()
  return base.slice(0, 200) || 'file'
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx === name.length - 1) return ''
  return name.slice(idx + 1).toLowerCase()
}

export function validateProjectFileUpload(input: {
  fileName: string
  mimeType: string
  fileSizeBytes: number
}): { ok: true } | { ok: false; reason: string } {
  const safeName = sanitizeProjectFileName(input.fileName)
  if (!safeName) return { ok: false, reason: 'Invalid file name.' }

  const ext = fileExtension(safeName)
  if (!ext) return { ok: false, reason: 'File must have an allowed extension.' }

  const expectedMime = EXTENSION_TO_MIME[ext]
  if (!expectedMime) return { ok: false, reason: 'This file type is not allowed.' }

  if (input.mimeType !== expectedMime && !ALLOWED_PROJECT_FILE_MIME.has(input.mimeType)) {
    return { ok: false, reason: 'This file type is not allowed.' }
  }

  if (!ALLOWED_PROJECT_FILE_MIME.has(input.mimeType)) {
    return { ok: false, reason: 'This file type is not allowed.' }
  }

  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > PROJECT_FILE_MAX_BYTES) {
    return {
      ok: false,
      reason: `File exceeds the size limit (${Math.floor(PROJECT_FILE_MAX_BYTES / (1024 * 1024))} MB).`,
    }
  }

  return { ok: true }
}

export function buildProjectStorageKey(projectId: string, fileName: string): string {
  const safe = sanitizeProjectFileName(fileName)
  if (safe.includes('..') || safe.startsWith('/')) {
    throw new Error('Invalid file name')
  }
  return `projects/${projectId}/${randomUUID()}-${safe}`
}

export function isCustomerVisibleFile(row: {
  visibility: string | null
  status: string | null
}): boolean {
  if ((row.status ?? 'active') !== 'active') return false
  return row.visibility === 'customer_visible'
}

export function isDeliverableFile(row: {
  category: string | null
  visibility: string | null
  status: string | null
}): boolean {
  return row.category === 'deliverable' && isCustomerVisibleFile(row)
}

export function normalizeProjectFileCategory(value?: string | null): ProjectFileCategory {
  if (value && (PROJECT_FILE_CATEGORIES as readonly string[]).includes(value)) {
    return value as ProjectFileCategory
  }
  return 'other'
}

export function serializeCustomerProjectFile(row: {
  id: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  category: string | null
  createdAt: Date
}) {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.fileSizeBytes,
    category: row.category ?? 'other',
    uploadedAt: row.createdAt.toISOString(),
    isDeliverable: row.category === 'deliverable',
  }
}

export function serializeAdminProjectFile(row: {
  id: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  category: string | null
  visibility: string
  status: string
  storageKey: string
  uploadedByUserId: string | null
  customerId: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.fileSizeBytes,
    category: row.category ?? 'other',
    visibility: row.visibility,
    status: row.status,
    storageKey: row.storageKey,
    uploadedByUserId: row.uploadedByUserId,
    uploadedByCustomer: Boolean(row.customerId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
