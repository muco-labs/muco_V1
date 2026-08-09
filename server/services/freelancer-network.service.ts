import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  freelancerInternalNotes,
  freelancerProfiles,
  notifications,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { assignRoleToUser } from './auth.service.js'
import { formatFreelancerReference, canFreelancerSetAvailability, canTransitionApproval, canTransitionVerification } from '../lib/freelancers/freelancer-status.js'
import { deserializePortfolioUrls, serializePortfolioUrls } from '../lib/freelancers/portfolio-url.js'
import { labelFreelancerServiceCategory } from '../lib/freelancers/service-categories.js'
import type { FreelancerApplyInput } from '../lib/validation/freelancers.js'
import { normalizeFreelancerApply } from '../lib/validation/freelancers.js'

export type FreelancerContext = {
  userId: string
  freelancerId: string
  email: string
}

function parseCategories(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function serializeFreelancerPortalProfile(row: typeof freelancerProfiles.$inferSelect) {
  const categories = parseCategories(row.serviceCategories)
  return {
    reference: formatFreelancerReference(row.id),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    country: row.country,
    city: row.city,
    professionalRole: row.professionalRole,
    experienceLevel: row.experienceLevel,
    headline: row.headline,
    bio: row.bio,
    skills: row.skills,
    serviceCategories: categories.map((id) => ({
      id,
      label: labelFreelancerServiceCategory(id),
    })),
    portfolioUrls: deserializePortfolioUrls(row.portfolioUrls),
    preferredProjectType: row.preferredProjectType,
    availabilityNote: row.availabilityNote,
    openToProjects: row.openToProjects,
    verificationStatus: row.verificationStatus,
    approvalStatus: row.approvalStatus,
    availabilityStatus: row.availabilityStatus,
    canManageAvailability: canFreelancerSetAvailability(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function serializeFreelancerAdminList(row: typeof freelancerProfiles.$inferSelect) {
  return {
    id: row.id,
    reference: formatFreelancerReference(row.id),
    fullName: row.fullName,
    email: row.email,
    professionalRole: row.professionalRole,
    verificationStatus: row.verificationStatus,
    approvalStatus: row.approvalStatus,
    availabilityStatus: row.availabilityStatus,
    serviceCategories: parseCategories(row.serviceCategories),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function serializeFreelancerAdminDetail(
  row: typeof freelancerProfiles.$inferSelect,
  notes: Array<{ id: string; content: string; authorUserId: string; createdAt: string }>,
) {
  return {
    ...serializeFreelancerPortalProfile(row),
    id: row.id,
    userId: row.userId,
    internalNotes: notes,
  }
}

async function notifyAdminsFreelancerApplication(name: string, role: string) {
  const db = getDb()
  if (!db) return
  const adminUsers = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))
  const unique = [...new Set(adminUsers.map((r) => r.userId))]
  if (!unique.length) return
  await db.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: 'freelancer.application_received',
      title: 'New freelancer application',
      message: `${name} · ${role}. Review in Freelancers.`,
    })),
  )
}

async function notifyFreelancerUserByEmail(
  email: string,
  input: { type: string; title: string; message: string },
) {
  const db = getDb()
  if (!db) return
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
  if (!user) return
  await db.insert(notifications).values({
    userId: user.id,
    type: input.type,
    title: input.title,
    message: input.message,
  })
}

export async function createFreelancerApplication(input: FreelancerApplyInput) {
  if (input.website?.trim()) {
    return { id: 'accepted', reference: 'FL-ACCEPTED' }
  }

  let normalized
  try {
    normalized = normalizeFreelancerApply(input)
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Invalid service categories.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db
    .select({ id: freelancerProfiles.id, approvalStatus: freelancerProfiles.approvalStatus })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.email, normalized.email))
    .limit(1)

  if (existing && existing.approvalStatus !== 'rejected') {
    throw new AppError(
      'CONFLICT',
      'An application with this email is already on file.',
      409,
    )
  }

  const [row] = await db
    .insert(freelancerProfiles)
    .values({
      email: normalized.email,
      fullName: normalized.fullName,
      phone: normalized.phone?.trim() || null,
      country: normalized.country?.trim() || null,
      city: normalized.city?.trim() || null,
      professionalRole: normalized.professionalRole.trim(),
      experienceLevel: normalized.experienceLevel?.trim() || null,
      headline: normalized.headline?.trim() || null,
      bio: normalized.bio.trim(),
      skills: normalized.skills.trim(),
      serviceCategories: JSON.stringify(normalized.serviceCategories),
      portfolioUrls: serializePortfolioUrls(normalized.portfolioUrls),
      preferredProjectType: normalized.preferredProjectType?.trim() || null,
      availabilityNote: normalized.availabilityNote?.trim() || null,
      openToProjects: normalized.openToProjects ?? true,
      verificationStatus: 'pending',
      approvalStatus: 'under_review',
      availabilityStatus: 'unavailable',
    })
    .returning()

  await db.insert(auditLogs).values({
    action: 'freelancer.application_created',
    entity: 'freelancer_profiles',
    entityId: row.id,
    metadata: JSON.stringify({ email: normalized.email }),
  })

  await notifyAdminsFreelancerApplication(normalized.fullName, normalized.professionalRole)
  await notifyFreelancerUserByEmail(normalized.email, {
    type: 'freelancer.application_received',
    title: 'Application received',
    message: 'MUCO Labs received your freelancer network application. We will review it and follow up.',
  })

  return {
    id: row.id,
    reference: formatFreelancerReference(row.id),
  }
}

export async function linkFreelancerProfileToUser(userId: string, email: string) {
  const db = getDb()
  if (!db) return null
  const normalized = email.trim().toLowerCase()
  const [profile] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.email, normalized))
    .limit(1)
  if (!profile || profile.userId) return profile ?? null
  if (profile.approvalStatus !== 'approved') return profile

  const [updated] = await db
    .update(freelancerProfiles)
    .set({ userId, updatedAt: new Date() })
    .where(eq(freelancerProfiles.id, profile.id))
    .returning()

  await assignRoleToUser(userId, 'FREELANCER')
  return updated
}

export async function requireFreelancerContext(auth: AuthContext): Promise<FreelancerContext> {
  if (!auth.roles.includes('FREELANCER')) {
    await linkFreelancerProfileToUser(auth.userId, auth.email)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let [profile] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, auth.userId))
    .limit(1)

  if (!profile) {
    const linked = await linkFreelancerProfileToUser(auth.userId, auth.email)
    if (linked?.userId) profile = linked
    else {
      const [byUser] = await db
        .select()
        .from(freelancerProfiles)
        .where(eq(freelancerProfiles.userId, auth.userId))
        .limit(1)
      profile = byUser
    }
  }

  if (!profile) {
    throw new AppError('NOT_FOUND', 'Freelancer profile not found.', 404)
  }

  if (profile.approvalStatus !== 'approved') {
    throw new AppError(
      'FORBIDDEN',
      'Your freelancer application is still under review or is not approved.',
      403,
    )
  }

  if (!auth.roles.includes('FREELANCER')) {
    throw new AppError('FORBIDDEN', 'You do not have access to the freelancer portal.', 403)
  }

  return {
    userId: auth.userId,
    freelancerId: profile.id,
    email: profile.email,
  }
}

async function getOwnedFreelancerProfile(ctx: FreelancerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select()
    .from(freelancerProfiles)
    .where(and(eq(freelancerProfiles.id, ctx.freelancerId), eq(freelancerProfiles.userId, ctx.userId)))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Freelancer profile not found.', 404)
  return row
}

export async function getFreelancerPortalProfile(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const row = await getOwnedFreelancerProfile(ctx)
  return serializeFreelancerPortalProfile(row)
}

export async function updateFreelancerPortalProfile(
  auth: AuthContext,
  input: Partial<{
    headline: string
    bio: string
    skills: string
    serviceCategories: string[]
    portfolioUrls: string[]
    professionalRole: string
    country: string
    city: string
    phone: string
    preferredProjectType: string
    availabilityNote: string
    openToProjects: boolean
  }>,
) {
  const ctx = await requireFreelancerContext(auth)
  const existing = await getOwnedFreelancerProfile(ctx)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(freelancerProfiles)
    .set({
      headline: input.headline?.trim(),
      bio: input.bio?.trim(),
      skills: input.skills?.trim(),
      serviceCategories: input.serviceCategories
        ? JSON.stringify(input.serviceCategories)
        : undefined,
      portfolioUrls:
        input.portfolioUrls === undefined
          ? undefined
          : serializePortfolioUrls(input.portfolioUrls),
      professionalRole: input.professionalRole?.trim(),
      country: input.country?.trim(),
      city: input.city?.trim(),
      phone: input.phone?.trim(),
      preferredProjectType: input.preferredProjectType?.trim(),
      availabilityNote: input.availabilityNote?.trim(),
      openToProjects: input.openToProjects,
      updatedAt: new Date(),
    })
    .where(eq(freelancerProfiles.id, existing.id))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.profile_updated',
    entity: 'freelancer_profiles',
    entityId: updated.id,
  })

  return serializeFreelancerPortalProfile(updated)
}

export async function updateFreelancerAvailability(
  auth: AuthContext,
  input: { availabilityStatus: 'available' | 'unavailable'; availabilityNote?: string },
) {
  const ctx = await requireFreelancerContext(auth)
  const existing = await getOwnedFreelancerProfile(ctx)

  if (!canFreelancerSetAvailability(existing)) {
    throw new AppError(
      'CONFLICT',
      'Availability can be changed only after verification and approval.',
      409,
    )
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(freelancerProfiles)
    .set({
      availabilityStatus: input.availabilityStatus,
      availabilityNote:
        input.availabilityNote === undefined
          ? undefined
          : input.availabilityNote.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(freelancerProfiles.id, existing.id))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.availability_changed',
    entity: 'freelancer_profiles',
    entityId: updated.id,
    metadata: JSON.stringify({ availabilityStatus: input.availabilityStatus }),
  })

  return serializeFreelancerPortalProfile(updated)
}

function assertFreelancerAdmin(auth: AuthContext, permission: 'freelancers.view' | 'freelancers.manage' | 'freelancers.notes') {
  if (!hasPermission(auth.permissions, permission)) {
    throw new AppError('FORBIDDEN', 'You cannot manage freelancers.', 403)
  }
}

export async function listFreelancersAdmin(
  auth: AuthContext,
  filters?: {
    q?: string
    approvalStatus?: string
    verificationStatus?: string
    availabilityStatus?: string
    serviceCategory?: string
    professionalRole?: string
  },
) {
  assertFreelancerAdmin(auth, 'freelancers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (filters?.approvalStatus) {
    conditions.push(eq(freelancerProfiles.approvalStatus, filters.approvalStatus as typeof freelancerProfiles.approvalStatus.enumValues[number]))
  }
  if (filters?.verificationStatus) {
    conditions.push(
      eq(
        freelancerProfiles.verificationStatus,
        filters.verificationStatus as typeof freelancerProfiles.verificationStatus.enumValues[number],
      ),
    )
  }
  if (filters?.availabilityStatus) {
    conditions.push(
      eq(
        freelancerProfiles.availabilityStatus,
        filters.availabilityStatus as typeof freelancerProfiles.availabilityStatus.enumValues[number],
      ),
    )
  }
  if (filters?.professionalRole?.trim()) {
    conditions.push(ilike(freelancerProfiles.professionalRole, `%${filters.professionalRole.trim()}%`))
  }
  if (filters?.q?.trim()) {
    const q = `%${filters.q.trim()}%`
    conditions.push(or(ilike(freelancerProfiles.fullName, q), ilike(freelancerProfiles.email, q))!)
  }

  const rows = await db
    .select()
    .from(freelancerProfiles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(freelancerProfiles.updatedAt))
    .limit(200)

  let items = rows.map(serializeFreelancerAdminList)
  if (filters?.serviceCategory) {
    items = items.filter((i) => i.serviceCategories.includes(filters.serviceCategory!))
  }
  return items
}

export async function getFreelancerAdmin(auth: AuthContext, freelancerId: string) {
  assertFreelancerAdmin(auth, 'freelancers.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Freelancer not found.', 404)

  const notes = await db
    .select()
    .from(freelancerInternalNotes)
    .where(eq(freelancerInternalNotes.freelancerId, freelancerId))
    .orderBy(desc(freelancerInternalNotes.createdAt))

  return serializeFreelancerAdminDetail(
    row,
    notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorUserId: n.authorUserId,
      createdAt: n.createdAt.toISOString(),
    })),
  )
}

export async function patchFreelancerAdmin(
  auth: AuthContext,
  freelancerId: string,
  input: {
    verificationStatus?: string
    approvalStatus?: string
    availabilityStatus?: string
  },
) {
  assertFreelancerAdmin(auth, 'freelancers.manage')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Freelancer not found.', 404)

  if (
    input.verificationStatus &&
    !canTransitionVerification(existing.verificationStatus, input.verificationStatus)
  ) {
    throw new AppError('VALIDATION_ERROR', 'Invalid verification transition.', 400)
  }
  if (
    input.approvalStatus &&
    !canTransitionApproval(existing.approvalStatus, input.approvalStatus)
  ) {
    throw new AppError('VALIDATION_ERROR', 'Invalid approval transition.', 400)
  }

  const [updated] = await db
    .update(freelancerProfiles)
    .set({
      verificationStatus: input.verificationStatus as typeof freelancerProfiles.verificationStatus.enumValues[number] | undefined,
      approvalStatus: input.approvalStatus as typeof freelancerProfiles.approvalStatus.enumValues[number] | undefined,
      availabilityStatus: input.availabilityStatus as typeof freelancerProfiles.availabilityStatus.enumValues[number] | undefined,
      updatedAt: new Date(),
    })
    .where(eq(freelancerProfiles.id, freelancerId))
    .returning()

  if (input.verificationStatus && input.verificationStatus !== existing.verificationStatus) {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.verification_changed',
      entity: 'freelancer_profiles',
      entityId: freelancerId,
      metadata: JSON.stringify({ verificationStatus: input.verificationStatus }),
    })
  }
  if (input.approvalStatus && input.approvalStatus !== existing.approvalStatus) {
    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.approval_changed',
      entity: 'freelancer_profiles',
      entityId: freelancerId,
      metadata: JSON.stringify({ approvalStatus: input.approvalStatus }),
    })

    const ref = formatFreelancerReference(freelancerId)
    if (
      existing.approvalStatus === 'approved' &&
      input.approvalStatus !== 'approved'
    ) {
      const { deactivateFreelancerServiceOfferings } = await import(
        './freelancer-offerings.service.js'
      )
      await deactivateFreelancerServiceOfferings(freelancerId, auth.userId)
    }

    if (input.approvalStatus === 'approved') {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, updated.email))
        .limit(1)
      if (user) {
        await assignRoleToUser(user.id, 'FREELANCER')
        if (!updated.userId) {
          await db
            .update(freelancerProfiles)
            .set({ userId: user.id })
            .where(eq(freelancerProfiles.id, freelancerId))
        }
      }
      await notifyFreelancerUserByEmail(updated.email, {
        type: 'freelancer.approved',
        title: 'Freelancer network approved',
        message: `Your MUCO Labs freelancer profile ${ref} has been approved.`,
      })
    } else if (input.approvalStatus === 'rejected') {
      await notifyFreelancerUserByEmail(updated.email, {
        type: 'freelancer.rejected',
        title: 'Freelancer application update',
        message: `Your MUCO Labs freelancer application ${ref} was not approved at this time.`,
      })
    } else if (input.approvalStatus === 'suspended') {
      await db.insert(auditLogs).values({
        actorUserId: auth.userId,
        action: 'freelancer.suspended',
        entity: 'freelancer_profiles',
        entityId: freelancerId,
      })
      await notifyFreelancerUserByEmail(updated.email, {
        type: 'freelancer.suspended',
        title: 'Freelancer profile suspended',
        message: `Your MUCO Labs freelancer profile ${ref} has been suspended.`,
      })
    }
  }

  return getFreelancerAdmin(auth, freelancerId)
}

export async function addFreelancerInternalNote(
  auth: AuthContext,
  freelancerId: string,
  content: string,
) {
  assertFreelancerAdmin(auth, 'freelancers.notes')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [profile] = await db
    .select({ id: freelancerProfiles.id })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)
  if (!profile) throw new AppError('NOT_FOUND', 'Freelancer not found.', 404)

  const [note] = await db
    .insert(freelancerInternalNotes)
    .values({
      freelancerId,
      authorUserId: auth.userId,
      content: content.trim(),
    })
    .returning()

  return {
    id: note.id,
    content: note.content,
    authorUserId: note.authorUserId,
    createdAt: note.createdAt.toISOString(),
  }
}

export async function listFreelancerInternalNotesAdmin(auth: AuthContext, freelancerId: string) {
  assertFreelancerAdmin(auth, 'freelancers.notes')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select()
    .from(freelancerInternalNotes)
    .where(eq(freelancerInternalNotes.freelancerId, freelancerId))
    .orderBy(desc(freelancerInternalNotes.createdAt))
  return rows.map((n) => ({
    id: n.id,
    content: n.content,
    authorUserId: n.authorUserId,
    createdAt: n.createdAt.toISOString(),
  }))
}
