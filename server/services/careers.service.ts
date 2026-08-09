import { and, count, desc, eq, gte, ilike, inArray, lte, ne, or } from 'drizzle-orm'
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
import { isJobOpeningAcceptingApplications } from '../lib/careers/job-opening-rules.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { serverEnv, isSupabaseStorageConfigured } from '../lib/env.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type {
  CreateCareerApplicationInput,
  CreateCareerJobOpeningInput,
  UpdateCareerJobOpeningInput,
} from '../lib/validation/careers.js'
import {
  careerApplicationStatuses,
  careerApplicationTypes,
  careerJobStatuses,
} from '../lib/validation/careers.js'

const CAREER_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function parseOptionalIsoDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Invalid date value.', 400)
  }
  return d
}

function mapJobAdmin(row: typeof careerJobOpenings.$inferSelect) {
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
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    closesAt: row.closesAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function assertJobSlugAvailable(db: NonNullable<ReturnType<typeof getDb>>, slug: string, excludeId?: string) {
  const [existing] = await db
    .select({ id: careerJobOpenings.id })
    .from(careerJobOpenings)
    .where(
      excludeId
        ? and(eq(careerJobOpenings.slug, slug), ne(careerJobOpenings.id, excludeId))
        : eq(careerJobOpenings.slug, slug),
    )
    .limit(1)
  if (existing) {
    throw new AppError('VALIDATION_ERROR', 'This job URL slug is already in use.', 409)
  }
}

export async function getCareerJobApplyContextPublic(slug: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(careerJobOpenings)
    .where(eq(careerJobOpenings.slug, slug.trim()))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Job opening not found.', 404)

  const accepting = isJobOpeningAcceptingApplications({
    status: row.status,
    closesAt: row.closesAt,
  })

  return {
    slug: row.slug,
    title: row.title,
    acceptingApplications: accepting,
    status: row.status,
    message: accepting
      ? null
      : row.status === 'closed'
        ? 'This position is no longer accepting applications.'
        : row.status === 'draft'
          ? 'This position is not available.'
          : 'This position is no longer accepting applications.',
  }
}

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
  if (input.jobOpeningId) {
    const db = getDb()
    if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
    const [row] = await db
      .select()
      .from(careerJobOpenings)
      .where(eq(careerJobOpenings.id, input.jobOpeningId))
      .limit(1)
    if (!row || !isJobOpeningAcceptingApplications({ status: row.status, closesAt: row.closesAt })) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This position is no longer accepting applications.',
        400,
      )
    }
    return row.id
  }
  if (!input.jobOpeningSlug?.trim()) return null

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select()
    .from(careerJobOpenings)
    .where(eq(careerJobOpenings.slug, input.jobOpeningSlug.trim()))
    .limit(1)

  if (!row) {
    throw new AppError('VALIDATION_ERROR', 'Selected job opening is not available.', 400)
  }
  if (!isJobOpeningAcceptingApplications({ status: row.status, closesAt: row.closesAt })) {
    throw new AppError(
      'VALIDATION_ERROR',
      'This position is no longer accepting applications.',
      400,
    )
  }
  return row.id
}

export async function createCareerApplication(input: CreateCareerApplicationInput) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let jobOpeningId: string | null = null
  try {
    jobOpeningId = await resolveJobOpeningId(input)
  } catch (error) {
    if (error instanceof AppError) throw error
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

export async function listCareerApplicationsAdmin(
  auth: AuthContext,
  query?: {
    status?: string
    q?: string
    jobOpeningId?: string
    applicationType?: string
    from?: string
    to?: string
  },
) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (query?.status && careerApplicationStatuses.includes(query.status as (typeof careerApplicationStatuses)[number])) {
    conditions.push(eq(careerApplications.status, query.status as (typeof careerApplicationStatuses)[number]))
  }
  if (query?.jobOpeningId?.trim()) {
    conditions.push(eq(careerApplications.jobOpeningId, query.jobOpeningId.trim()))
  }
  if (
    query?.applicationType &&
    careerApplicationTypes.includes(query.applicationType as (typeof careerApplicationTypes)[number])
  ) {
    conditions.push(
      eq(careerApplications.applicationType, query.applicationType as (typeof careerApplicationTypes)[number]),
    )
  }
  if (query?.from?.trim()) {
    const from = parseOptionalIsoDate(query.from)
    if (from) conditions.push(gte(careerApplications.createdAt, from))
  }
  if (query?.to?.trim()) {
    const to = parseOptionalIsoDate(query.to)
    if (to) conditions.push(lte(careerApplications.createdAt, to))
  }
  if (query?.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(
      or(
        ilike(careerApplications.fullName, term),
        ilike(careerApplications.email, term),
        ilike(careerApplications.roleInterest, term),
      )!,
    )
  }

  const whereClause = conditions.length ? and(...conditions) : undefined

  const rows = await db
    .select({
      application: careerApplications,
      jobTitle: careerJobOpenings.title,
    })
    .from(careerApplications)
    .leftJoin(careerJobOpenings, eq(careerApplications.jobOpeningId, careerJobOpenings.id))
    .where(whereClause)
    .orderBy(desc(careerApplications.createdAt))
    .limit(100)

  return rows.map((r) => ({
    ...r.application,
    jobTitle: r.jobTitle,
    jobOpeningId: r.application.jobOpeningId,
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

async function applicationStatusCountsForJob(db: NonNullable<ReturnType<typeof getDb>>, jobId: string) {
  const rows = await db
    .select({
      status: careerApplications.status,
      c: count(),
    })
    .from(careerApplications)
    .where(eq(careerApplications.jobOpeningId, jobId))
    .groupBy(careerApplications.status)

  const totals: Record<string, number> = {}
  let total = 0
  for (const row of rows) {
    totals[row.status] = Number(row.c)
    total += Number(row.c)
  }
  return { total, byStatus: totals }
}

export async function listCareerJobOpeningsAdmin(auth: AuthContext, query?: { status?: string; q?: string }) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (query?.status && careerJobStatuses.includes(query.status as (typeof careerJobStatuses)[number])) {
    conditions.push(eq(careerJobOpenings.status, query.status as (typeof careerJobStatuses)[number]))
  }
  if (query?.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(
      or(
        ilike(careerJobOpenings.title, term),
        ilike(careerJobOpenings.slug, term),
        ilike(careerJobOpenings.department, term),
      )!,
    )
  }

  const rows = await db
    .select()
    .from(careerJobOpenings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(careerJobOpenings.updatedAt))
    .limit(100)

  const items = []
  for (const row of rows) {
    const stats = await applicationStatusCountsForJob(db, row.id)
    items.push({
      ...mapJobAdmin(row),
      applicationCount: stats.total,
      applicationStatusCounts: stats.byStatus,
    })
  }
  return items
}

export async function getCareerJobOpeningAdmin(auth: AuthContext, jobId: string) {
  assertCareersPermission(auth, 'careers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db.select().from(careerJobOpenings).where(eq(careerJobOpenings.id, jobId)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Job opening not found.', 404)

  const stats = await applicationStatusCountsForJob(db, row.id)
  return {
    job: mapJobAdmin(row),
    applicationCount: stats.total,
    applicationStatusCounts: stats.byStatus,
  }
}

export async function createCareerJobOpeningAdmin(auth: AuthContext, input: CreateCareerJobOpeningInput) {
  assertCareersPermission(auth, 'careers.manage')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  await assertJobSlugAvailable(db, input.slug)

  const [row] = await db
    .insert(careerJobOpenings)
    .values({
      slug: input.slug,
      title: input.title.trim(),
      department: input.department.trim(),
      employmentType: input.employmentType,
      experienceLevel: input.experienceLevel?.trim() || null,
      locationLabel: input.locationLabel?.trim() || null,
      remoteStatus: input.remoteStatus?.trim() || null,
      shortDescription: input.shortDescription.trim(),
      responsibilities: input.responsibilities.trim(),
      requiredSkills: input.requiredSkills.trim(),
      preferredSkills: input.preferredSkills?.trim() || null,
      status: 'draft',
      publishedAt: null,
      closesAt: parseOptionalIsoDate(input.closesAt ?? undefined),
    })
    .returning()

  return mapJobAdmin(row)
}

export async function updateCareerJobOpeningAdmin(
  auth: AuthContext,
  jobId: string,
  input: UpdateCareerJobOpeningInput,
) {
  assertCareersPermission(auth, 'careers.manage')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(careerJobOpenings).where(eq(careerJobOpenings.id, jobId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Job opening not found.', 404)

  if (input.slug && input.slug !== existing.slug) {
    await assertJobSlugAvailable(db, input.slug, jobId)
  }

  const patch: Partial<typeof careerJobOpenings.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.slug) patch.slug = input.slug
  if (input.title) patch.title = input.title.trim()
  if (input.department) patch.department = input.department.trim()
  if (input.employmentType) patch.employmentType = input.employmentType
  if (input.experienceLevel !== undefined) patch.experienceLevel = input.experienceLevel?.trim() || null
  if (input.locationLabel !== undefined) patch.locationLabel = input.locationLabel?.trim() || null
  if (input.remoteStatus !== undefined) patch.remoteStatus = input.remoteStatus?.trim() || null
  if (input.shortDescription) patch.shortDescription = input.shortDescription.trim()
  if (input.responsibilities) patch.responsibilities = input.responsibilities.trim()
  if (input.requiredSkills) patch.requiredSkills = input.requiredSkills.trim()
  if (input.preferredSkills !== undefined) patch.preferredSkills = input.preferredSkills?.trim() || null
  if (input.closesAt !== undefined) patch.closesAt = parseOptionalIsoDate(input.closesAt ?? undefined)
  if (input.publishedAt !== undefined && existing.status !== 'published') {
    patch.publishedAt = parseOptionalIsoDate(input.publishedAt ?? undefined)
  }

  const [updated] = await db
    .update(careerJobOpenings)
    .set(patch)
    .where(eq(careerJobOpenings.id, jobId))
    .returning()

  return mapJobAdmin(updated)
}

export async function updateCareerJobOpeningStatusAdmin(
  auth: AuthContext,
  jobId: string,
  status: (typeof careerJobStatuses)[number],
) {
  assertCareersPermission(auth, 'careers.manage')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(careerJobOpenings).where(eq(careerJobOpenings.id, jobId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Job opening not found.', 404)

  if (!careerJobStatuses.includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid job status.', 400)
  }

  const patch: Partial<typeof careerJobOpenings.$inferInsert> = {
    status,
    updatedAt: new Date(),
  }

  if (status === 'published') {
    patch.publishedAt = existing.publishedAt ?? new Date()
  }

  const [updated] = await db
    .update(careerJobOpenings)
    .set(patch)
    .where(eq(careerJobOpenings.id, jobId))
    .returning()

  return mapJobAdmin(updated)
}
