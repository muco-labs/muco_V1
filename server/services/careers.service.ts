import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  careerApplicationNotes,
  careerApplications,
  careerJobOpenings,
  notifications,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { formatCareerApplicationReference } from '../lib/careers/application-reference.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { serverEnv, isSupabaseStorageConfigured } from '../lib/env.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { CreateCareerApplicationInput } from '../lib/validation/careers.js'
import { careerApplicationStatuses } from '../lib/validation/careers.js'

const CAREER_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)
}

export async function listPublishedJobOpenings() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const now = new Date()
  const rows = await db
    .select()
    .from(careerJobOpenings)
    .where(eq(careerJobOpenings.status, 'published'))
    .orderBy(desc(careerJobOpenings.publishedAt))

  return rows
    .filter((row) => !row.closesAt || row.closesAt >= now)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      department: row.department,
      employmentType: row.employmentType,
      experienceLevel: row.experienceLevel,
      locationLabel: row.locationLabel,
      remoteStatus: row.remoteStatus,
      shortDescription: row.shortDescription,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      closesAt: row.closesAt?.toISOString() ?? null,
    }))
}

export async function getPublishedJobOpeningBySlug(slug: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(careerJobOpenings)
    .where(and(eq(careerJobOpenings.slug, slug), eq(careerJobOpenings.status, 'published')))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Job opening not found.', 404)
  if (row.closesAt && row.closesAt < new Date()) {
    throw new AppError('NOT_FOUND', 'Job opening not found.', 404)
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    employmentType: row.employmentType,
    experienceLevel: row.experienceLevel,
    locationLabel: row.locationLabel,
    remoteStatus: row.remoteStatus,
    shortDescription: row.shortDescription,
    responsibilities: row.responsibilities,
    requiredSkills: row.requiredSkills,
    preferredSkills: row.preferredSkills,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    closesAt: row.closesAt?.toISOString() ?? null,
  }
}

async function resolveJobOpeningId(input: CreateCareerApplicationInput): Promise<string | null> {
  if (input.jobOpeningId) return input.jobOpeningId
  if (!input.jobOpeningSlug?.trim()) return null
  const opening = await getPublishedJobOpeningBySlug(input.jobOpeningSlug.trim())
  return opening.id
}

export async function createCareerApplication(input: CreateCareerApplicationInput) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let jobOpeningId: string | null = null
  try {
    jobOpeningId = await resolveJobOpeningId(input)
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Selected job opening is not available.', 400)
  }

  const [row] = await db
    .insert(careerApplications)
    .values({
      jobOpeningId,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      roleInterest: input.roleInterest.trim(),
      applicationType: input.applicationType,
      experienceLevel: input.experienceLevel?.trim() || null,
      skills: input.skills.trim(),
      portfolioUrl: input.portfolioUrl?.trim() || null,
      linkedinUrl: input.linkedinUrl?.trim() || null,
      githubUrl: input.githubUrl?.trim() || null,
      introduction: input.introduction.trim(),
      availability: input.availability.trim(),
      preferredEngagement: input.preferredEngagement?.trim() || null,
      additionalInfo: input.additionalInfo?.trim() || null,
      status: 'new',
    })
    .returning({ id: careerApplications.id })

  await notifyAdminsOfCareerApplication(row.id, input.fullName, input.roleInterest)

  return {
    id: row.id,
    reference: formatCareerApplicationReference(row.id),
    resumeUploadAvailable: isSupabaseStorageConfigured(),
  }
}

async function notifyAdminsOfCareerApplication(
  _applicationId: string,
  name: string,
  role: string,
) {
  const db = getDb()
  if (!db) return

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
      type: 'careers.application_received',
      title: 'New career application received',
      message: `${name} · ${role}. Review in Careers.`,
    })),
  )
}

export async function registerCareerResumeUpload(
  applicationId: string,
  input: { fileName: string; mimeType: string; fileSizeBytes: number },
) {
  if (!isSupabaseStorageConfigured()) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Resume upload is not available right now.', 503)
  }
  if (!CAREER_RESUME_MIME.has(input.mimeType)) {
    throw new AppError('VALIDATION_ERROR', 'Resume must be PDF or Word document.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [app] = await db
    .select({ id: careerApplications.id })
    .from(careerApplications)
    .where(eq(careerApplications.id, applicationId))
    .limit(1)
  if (!app) throw new AppError('NOT_FOUND', 'Application not found.', 404)

  const safeName = sanitizeFileName(input.fileName)
  const storageKey = `careers/applications/${applicationId}/${Date.now()}-${safeName}`

  await db
    .update(careerApplications)
    .set({
      resumeStorageKey: storageKey,
      resumeFileName: safeName,
      resumeMimeType: input.mimeType,
      resumeFileSizeBytes: input.fileSizeBytes,
      updatedAt: new Date(),
    })
    .where(eq(careerApplications.id, applicationId))

  const supabase = getSupabaseAdmin()
  if (!supabase) throw new AppError('SERVICE_UNAVAILABLE', 'Resume upload is not available.', 503)

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUploadUrl(storageKey)

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not prepare resume upload.', 503)
  }

  return { uploadUrl: data.signedUrl, storageKey }
}

function assertCareersPermission(auth: AuthContext, permission: 'careers.view' | 'careers.manage' | 'careers.notes') {
  if (!hasPermission(auth.permissions, permission)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to access careers.', 403)
  }
}

export async function listCareerApplicationsAdmin(auth: AuthContext, query?: { status?: string; q?: string }) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let rows = await db
    .select({
      application: careerApplications,
      jobTitle: careerJobOpenings.title,
    })
    .from(careerApplications)
    .leftJoin(careerJobOpenings, eq(careerApplications.jobOpeningId, careerJobOpenings.id))
    .orderBy(desc(careerApplications.createdAt))
    .limit(100)

  if (query?.status && careerApplicationStatuses.includes(query.status as (typeof careerApplicationStatuses)[number])) {
    rows = rows.filter((r) => r.application.status === query.status)
  }
  if (query?.q?.trim()) {
    const term = query.q.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.application.fullName.toLowerCase().includes(term) ||
        r.application.email.toLowerCase().includes(term) ||
        r.application.roleInterest.toLowerCase().includes(term),
    )
  }

  return rows.map((r) => ({
    ...r.application,
    jobTitle: r.jobTitle,
    reference: formatCareerApplicationReference(r.application.id),
    createdAt: r.application.createdAt.toISOString(),
    updatedAt: r.application.updatedAt.toISOString(),
  }))
}

export async function getCareerApplicationAdmin(auth: AuthContext, applicationId: string) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      application: careerApplications,
      jobTitle: careerJobOpenings.title,
      jobSlug: careerJobOpenings.slug,
    })
    .from(careerApplications)
    .leftJoin(careerJobOpenings, eq(careerApplications.jobOpeningId, careerJobOpenings.id))
    .where(eq(careerApplications.id, applicationId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Application not found.', 404)

  const notes = await db
    .select({
      note: careerApplicationNotes,
      authorName: users.fullName,
    })
    .from(careerApplicationNotes)
    .innerJoin(users, eq(careerApplicationNotes.authorUserId, users.id))
    .where(eq(careerApplicationNotes.applicationId, applicationId))
    .orderBy(desc(careerApplicationNotes.createdAt))

  return {
    application: {
      ...row.application,
      jobTitle: row.jobTitle,
      jobSlug: row.jobSlug,
      reference: formatCareerApplicationReference(row.application.id),
      createdAt: row.application.createdAt.toISOString(),
      updatedAt: row.application.updatedAt.toISOString(),
      hasResume: Boolean(row.application.resumeStorageKey),
    },
    notes: notes.map((n) => ({
      id: n.note.id,
      content: n.note.content,
      authorName: n.authorName,
      createdAt: n.note.createdAt.toISOString(),
    })),
  }
}

export async function updateCareerApplicationStatusAdmin(
  auth: AuthContext,
  applicationId: string,
  status: (typeof careerApplicationStatuses)[number],
) {
  assertCareersPermission(auth, 'careers.manage')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(careerApplications)
    .set({ status, updatedAt: new Date() })
    .where(eq(careerApplications.id, applicationId))
    .returning()

  if (!updated) throw new AppError('NOT_FOUND', 'Application not found.', 404)
  return updated
}

export async function addCareerApplicationNoteAdmin(
  auth: AuthContext,
  applicationId: string,
  content: string,
) {
  assertCareersPermission(auth, 'careers.notes')
  const trimmed = content.trim()
  if (trimmed.length < 1) throw new AppError('VALIDATION_ERROR', 'Note cannot be empty.', 400)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [app] = await db
    .select({ id: careerApplications.id })
    .from(careerApplications)
    .where(eq(careerApplications.id, applicationId))
    .limit(1)
  if (!app) throw new AppError('NOT_FOUND', 'Application not found.', 404)

  const [note] = await db
    .insert(careerApplicationNotes)
    .values({
      applicationId,
      authorUserId: auth.userId,
      content: trimmed,
    })
    .returning()

  return note
}

export async function getCareerResumeDownloadUrlAdmin(auth: AuthContext, applicationId: string) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(careerApplications)
    .where(eq(careerApplications.id, applicationId))
    .limit(1)

  if (!row?.resumeStorageKey) throw new AppError('NOT_FOUND', 'Resume not available.', 404)

  const supabase = getSupabaseAdmin()
  if (!supabase) throw new AppError('SERVICE_UNAVAILABLE', 'Storage unavailable.', 503)

  const { data, error } = await supabase.storage
    .from(serverEnv.storageBucket)
    .createSignedUrl(row.resumeStorageKey, 120)

  if (error || !data?.signedUrl) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not generate download link.', 503)
  }

  return {
    url: data.signedUrl,
    fileName: row.resumeFileName,
    mimeType: row.resumeMimeType,
  }
}
