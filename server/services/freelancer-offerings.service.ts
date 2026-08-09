import { and, eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { auditLogs, freelancerProfiles, freelancerServices, freelancerSkills } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import {
  requireFreelancerContext,
  type FreelancerContext,
} from './freelancer-network.service.js'
import { canFreelancerPublishActiveOfferings } from '../lib/freelancers/freelancer-status.js'
import {
  isMucoServiceSlug,
  labelMucoService,
  listMucoServiceCatalog,
  resolveSkillSlug,
  resolveSubService,
} from '../lib/freelancers/muco-service-catalog.js'
import {
  FREELANCER_PRICING_TYPES,
  isFreelancerPricingType,
  parseFreelancerPrice,
  presentFreelancerPricingTypeLabel,
  validateFreelancerPricingFields,
} from '../lib/freelancers/freelancer-pricing.js'

function pricingErrorToAppError(err: unknown): never {
  const code = err instanceof Error ? err.message : 'VALIDATION_ERROR'
  const messages: Record<string, string> = {
    INVALID_PRICE: 'Price must be zero or greater.',
    INVALID_CURRENCY: 'Currency is not supported.',
    BASE_PRICE_REQUIRED: 'Base price is required for this pricing type.',
    MIN_PRICE_EXCEEDS_BASE: 'Minimum price cannot exceed base price.',
  }
  throw new AppError('VALIDATION_ERROR', messages[code] ?? 'Invalid pricing.', 400)
}

async function loadFreelancerProfile(freelancerId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, freelancerId))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Freelancer not found.', 404)
  return row
}

function assertActiveOfferingAllowed(approvalStatus: string, isActive: boolean) {
  if (isActive && !canFreelancerPublishActiveOfferings(approvalStatus)) {
    throw new AppError(
      'FORBIDDEN',
      'Only approved freelancers can publish active service offerings.',
      403,
    )
  }
}

function effectiveServiceActive(
  row: { isActive: boolean },
  approvalStatus: string,
): boolean {
  return row.isActive && canFreelancerPublishActiveOfferings(approvalStatus)
}

function serializeServiceRow(
  row: typeof freelancerServices.$inferSelect,
  approvalStatus: string,
) {
  const sub = row.subServiceSlug
    ? resolveSubService(row.serviceSlug, row.subServiceSlug)
    : null
  return {
    id: row.id,
    serviceSlug: row.serviceSlug,
    serviceTitle: labelMucoService(row.serviceSlug),
    subServiceSlug: row.subServiceSlug,
    subServiceLabel: sub?.label ?? null,
    description: row.description,
    experienceLevel: row.experienceLevel,
    pricingType: row.pricingType,
    pricingTypeLabel: presentFreelancerPricingTypeLabel(row.pricingType),
    basePrice: row.basePrice,
    minimumPrice: row.minimumPrice,
    currency: row.currency,
    isActive: row.isActive,
    isEffectivelyActive: effectiveServiceActive(row, approvalStatus),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function serializeSkillRow(row: typeof freelancerSkills.$inferSelect, approvalStatus: string) {
  const skill = resolveSkillSlug(row.serviceSlug, row.skillSlug)
  return {
    id: row.id,
    serviceSlug: row.serviceSlug,
    serviceTitle: labelMucoService(row.serviceSlug),
    skillSlug: row.skillSlug,
    skillLabel: skill?.label ?? row.skillSlug,
    isActive: row.isActive && canFreelancerPublishActiveOfferings(approvalStatus),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function getMucoServiceCatalogForPortal() {
  return { items: listMucoServiceCatalog() }
}

export async function listFreelancerServicesPortal(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const profile = await loadFreelancerProfile(ctx.freelancerId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select()
    .from(freelancerServices)
    .where(eq(freelancerServices.freelancerId, ctx.freelancerId))
  return rows.map((r) => serializeServiceRow(r, profile.approvalStatus))
}

export async function listFreelancerSkillsPortal(auth: AuthContext) {
  const ctx = await requireFreelancerContext(auth)
  const profile = await loadFreelancerProfile(ctx.freelancerId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select()
    .from(freelancerSkills)
    .where(eq(freelancerSkills.freelancerId, ctx.freelancerId))
  return rows.map((r) => serializeSkillRow(r, profile.approvalStatus))
}

async function getOwnedService(ctx: FreelancerContext, serviceId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select()
    .from(freelancerServices)
    .where(
      and(eq(freelancerServices.id, serviceId), eq(freelancerServices.freelancerId, ctx.freelancerId)),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Service offering not found.', 404)
  return row
}

async function getOwnedSkill(ctx: FreelancerContext, skillId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select()
    .from(freelancerSkills)
    .where(and(eq(freelancerSkills.id, skillId), eq(freelancerSkills.freelancerId, ctx.freelancerId)))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Skill not found.', 404)
  return row
}

function validateServiceSlugs(serviceSlug: string, subServiceSlug?: string | null) {
  if (!isMucoServiceSlug(serviceSlug)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid MUCO service.', 400)
  }
  if (subServiceSlug) {
    const sub = resolveSubService(serviceSlug, subServiceSlug)
    if (!sub) throw new AppError('VALIDATION_ERROR', 'Invalid sub-service for this service.', 400)
  }
}

export async function createFreelancerServicePortal(
  auth: AuthContext,
  input: {
    serviceSlug: string
    subServiceSlug?: string | null
    description?: string
    experienceLevel?: string
    pricingType: string
    basePrice?: string | number | null
    minimumPrice?: string | number | null
    currency?: string
    isActive?: boolean
  },
) {
  const ctx = await requireFreelancerContext(auth)
  const profile = await loadFreelancerProfile(ctx.freelancerId)
  validateServiceSlugs(input.serviceSlug, input.subServiceSlug ?? null)

  if (!isFreelancerPricingType(input.pricingType)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid pricing type.', 400)
  }

  const isActive = input.isActive ?? false
  assertActiveOfferingAllowed(profile.approvalStatus, isActive)

  let basePrice: string | null = null
  let minimumPrice: string | null = null
  let currency = 'INR'
  try {
    basePrice = input.basePrice === undefined ? null : parseFreelancerPrice(input.basePrice)
    minimumPrice =
      input.minimumPrice === undefined ? null : parseFreelancerPrice(input.minimumPrice)
    const validated = validateFreelancerPricingFields({
      pricingType: input.pricingType,
      basePrice,
      minimumPrice,
      currency: input.currency ?? 'INR',
    })
    currency = validated.currency
    basePrice = validated.basePrice
    minimumPrice = validated.minimumPrice
  } catch (e) {
    pricingErrorToAppError(e)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  try {
    const [row] = await db
      .insert(freelancerServices)
      .values({
        freelancerId: ctx.freelancerId,
        serviceSlug: input.serviceSlug,
        subServiceSlug: input.subServiceSlug?.trim() || null,
        description: input.description?.trim() || null,
        experienceLevel: input.experienceLevel?.trim() || null,
        pricingType: input.pricingType,
        basePrice,
        minimumPrice,
        currency,
        isActive,
      })
      .returning()

    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.service_added',
      entity: 'freelancer_services',
      entityId: row.id,
      metadata: JSON.stringify({
        freelancerId: ctx.freelancerId,
        serviceSlug: input.serviceSlug,
      }),
    })

    return serializeServiceRow(row, profile.approvalStatus)
  } catch {
    throw new AppError('CONFLICT', 'This service offering already exists.', 409)
  }
}

export async function updateFreelancerServicePortal(
  auth: AuthContext,
  serviceId: string,
  input: Partial<{
    description: string | null
    experienceLevel: string | null
    pricingType: string
    basePrice: string | number | null
    minimumPrice: string | number | null
    currency: string
    isActive: boolean
  }>,
) {
  const ctx = await requireFreelancerContext(auth)
  const profile = await loadFreelancerProfile(ctx.freelancerId)
  const existing = await getOwnedService(ctx, serviceId)

  const pricingType = (input.pricingType ?? existing.pricingType) as import('../lib/freelancers/freelancer-pricing.js').FreelancerPricingType
  if (input.pricingType && !isFreelancerPricingType(input.pricingType)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid pricing type.', 400)
  }

  const isActive = input.isActive === undefined ? existing.isActive : input.isActive
  assertActiveOfferingAllowed(profile.approvalStatus, isActive)

  let basePrice =
    input.basePrice === undefined ? existing.basePrice : parseFreelancerPrice(input.basePrice)
  let minimumPrice =
    input.minimumPrice === undefined
      ? existing.minimumPrice
      : parseFreelancerPrice(input.minimumPrice)
  let currency = input.currency ?? existing.currency

  try {
    const validated = validateFreelancerPricingFields({
      pricingType,
      basePrice: basePrice === null ? null : String(basePrice),
      minimumPrice: minimumPrice === null ? null : String(minimumPrice),
      currency,
    })
    currency = validated.currency
    basePrice = validated.basePrice
    minimumPrice = validated.minimumPrice
  } catch (e) {
    pricingErrorToAppError(e)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .update(freelancerServices)
    .set({
      description: input.description === undefined ? undefined : input.description,
      experienceLevel: input.experienceLevel === undefined ? undefined : input.experienceLevel,
      pricingType: input.pricingType as typeof freelancerServices.pricingType.enumValues[number] | undefined,
      basePrice,
      minimumPrice,
      currency,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(freelancerServices.id, serviceId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.service_updated',
    entity: 'freelancer_services',
    entityId: serviceId,
    metadata: JSON.stringify({ freelancerId: ctx.freelancerId }),
  })

  return serializeServiceRow(row, profile.approvalStatus)
}

export async function deleteFreelancerServicePortal(auth: AuthContext, serviceId: string) {
  const ctx = await requireFreelancerContext(auth)
  await getOwnedService(ctx, serviceId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  await db.delete(freelancerServices).where(eq(freelancerServices.id, serviceId))

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.service_removed',
    entity: 'freelancer_services',
    entityId: serviceId,
    metadata: JSON.stringify({ freelancerId: ctx.freelancerId }),
  })

  return { ok: true as const }
}

export async function createFreelancerSkillPortal(
  auth: AuthContext,
  input: { serviceSlug: string; skillSlug: string },
) {
  const ctx = await requireFreelancerContext(auth)
  const profile = await loadFreelancerProfile(ctx.freelancerId)
  if (!canFreelancerPublishActiveOfferings(profile.approvalStatus)) {
    throw new AppError(
      'FORBIDDEN',
      'Only approved freelancers can manage skills.',
      403,
    )
  }

  validateServiceSlugs(input.serviceSlug, null)
  const skill = resolveSkillSlug(input.serviceSlug, input.skillSlug)
  if (!skill) throw new AppError('VALIDATION_ERROR', 'Invalid skill for this service.', 400)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  try {
    const [row] = await db
      .insert(freelancerSkills)
      .values({
        freelancerId: ctx.freelancerId,
        serviceSlug: input.serviceSlug,
        skillSlug: input.skillSlug,
        isActive: true,
      })
      .returning()

    await db.insert(auditLogs).values({
      actorUserId: auth.userId,
      action: 'freelancer.skill_added',
      entity: 'freelancer_skills',
      entityId: row.id,
      metadata: JSON.stringify({
        freelancerId: ctx.freelancerId,
        skillSlug: input.skillSlug,
      }),
    })

    return serializeSkillRow(row, profile.approvalStatus)
  } catch {
    throw new AppError('CONFLICT', 'This skill is already on your profile.', 409)
  }
}

export async function deleteFreelancerSkillPortal(auth: AuthContext, skillId: string) {
  const ctx = await requireFreelancerContext(auth)
  await getOwnedSkill(ctx, skillId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  await db.delete(freelancerSkills).where(eq(freelancerSkills.id, skillId))

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'freelancer.skill_removed',
    entity: 'freelancer_skills',
    entityId: skillId,
    metadata: JSON.stringify({ freelancerId: ctx.freelancerId }),
  })

  return { ok: true as const }
}

function assertFreelancerAdminView(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'freelancers.view')) {
    throw new AppError('FORBIDDEN', 'You cannot view freelancer offerings.', 403)
  }
}

function assertFreelancerAdminManage(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'freelancers.manage')) {
    throw new AppError('FORBIDDEN', 'You cannot manage freelancer offerings.', 403)
  }
}

export async function listFreelancerServicesAdmin(auth: AuthContext, freelancerId: string) {
  assertFreelancerAdminView(auth)
  const profile = await loadFreelancerProfile(freelancerId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select()
    .from(freelancerServices)
    .where(eq(freelancerServices.freelancerId, freelancerId))
  return rows.map((r) => serializeServiceRow(r, profile.approvalStatus))
}

export async function listFreelancerSkillsAdmin(auth: AuthContext, freelancerId: string) {
  assertFreelancerAdminView(auth)
  const profile = await loadFreelancerProfile(freelancerId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select()
    .from(freelancerSkills)
    .where(eq(freelancerSkills.freelancerId, freelancerId))
  return rows.map((r) => serializeSkillRow(r, profile.approvalStatus))
}

export async function patchFreelancerServiceAdmin(
  auth: AuthContext,
  freelancerId: string,
  serviceId: string,
  input: Partial<{
    description: string | null
    experienceLevel: string | null
    pricingType: string
    basePrice: string | number | null
    minimumPrice: string | number | null
    currency: string
    isActive: boolean
  }>,
) {
  assertFreelancerAdminManage(auth)
  const profile = await loadFreelancerProfile(freelancerId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db
    .select()
    .from(freelancerServices)
    .where(
      and(eq(freelancerServices.id, serviceId), eq(freelancerServices.freelancerId, freelancerId)),
    )
    .limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Service offering not found.', 404)

  const isActive = input.isActive === undefined ? existing.isActive : input.isActive
  if (isActive && !canFreelancerPublishActiveOfferings(profile.approvalStatus)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Cannot activate offerings while freelancer is not approved.',
      400,
    )
  }

  const pricingType = (input.pricingType ?? existing.pricingType) as import('../lib/freelancers/freelancer-pricing.js').FreelancerPricingType
  if (input.pricingType && !isFreelancerPricingType(input.pricingType)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid pricing type.', 400)
  }

  let basePrice =
    input.basePrice === undefined ? existing.basePrice : parseFreelancerPrice(input.basePrice)
  let minimumPrice =
    input.minimumPrice === undefined
      ? existing.minimumPrice
      : parseFreelancerPrice(input.minimumPrice)
  let currency = input.currency ?? existing.currency

  try {
    const validated = validateFreelancerPricingFields({
      pricingType,
      basePrice: basePrice === null ? null : String(basePrice),
      minimumPrice: minimumPrice === null ? null : String(minimumPrice),
      currency,
    })
    currency = validated.currency
    basePrice = validated.basePrice
    minimumPrice = validated.minimumPrice
  } catch (e) {
    pricingErrorToAppError(e)
  }

  const [row] = await db
    .update(freelancerServices)
    .set({
      description: input.description === undefined ? undefined : input.description,
      experienceLevel: input.experienceLevel === undefined ? undefined : input.experienceLevel,
      pricingType: input.pricingType as typeof freelancerServices.pricingType.enumValues[number] | undefined,
      basePrice,
      minimumPrice,
      currency,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(freelancerServices.id, serviceId))
    .returning()

  const action = isActive === false && existing.isActive ? 'freelancer.service_disabled' : 'freelancer.service_updated'
  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action,
    entity: 'freelancer_services',
    entityId: serviceId,
    metadata: JSON.stringify({ freelancerId }),
  })

  return serializeServiceRow(row, profile.approvalStatus)
}

export async function deactivateFreelancerServiceOfferings(freelancerId: string, actorUserId: string) {
  const db = getDb()
  if (!db) return
  await db
    .update(freelancerServices)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(freelancerServices.freelancerId, freelancerId), eq(freelancerServices.isActive, true)))

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'freelancer.service_disabled',
    entity: 'freelancer_profiles',
    entityId: freelancerId,
    metadata: JSON.stringify({ reason: 'approval_changed' }),
  })
}

export { FREELANCER_PRICING_TYPES }
