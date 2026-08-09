import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  lt,
  notInArray,
  or,
  sql,
  sum,
} from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  customerProfiles,
  employeeProfiles,
  leadActivities,
  leadInteractions,
  leadNotes,
  leads,
  notifications,
  proposals,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission, roleCanAccessPortal } from '../lib/auth/permissions.js'
import {
  CRM_PIPELINE_STATUSES,
  CLOSED_LEAD_STATUSES,
  normalizeLeadSource,
  storageSourceValue,
} from '../lib/crm/constants.js'
import {
  erodeLeadCondition,
  indiaLeadCondition,
  internationalLeadCondition,
  tamilNaduLeadCondition,
  tier1MarketLeadCondition,
} from '../lib/market/conditions.js'
import type { Tier1MarketId } from '../lib/market/constants.js'
import { inviteCustomerFromLead } from './auth.service.js'
import type { LeadEntryChannel } from '../lib/intake/lead-channel.js'
import {
  leadChannelFilterCondition,
  leadEntryChannel,
  leadEntryChannelLabel,
} from '../lib/intake/lead-channel.js'
import {
  OPEN_LEAD_STATUSES,
  presentFollowUp,
  parseFollowUpAtInput,
} from '../lib/crm/follow-up-presentation.js'
import {
  followUpListFilterCondition,
  type FollowUpListFilter,
} from '../lib/crm/follow-up-filters.js'
import { parseStartProjectLeadNotes } from '../lib/intake/lead-intake-notes.js'
import { PROJECT_INTAKE_PAGE_SOURCE } from '../lib/intake/project-intake-constants.js'
import { formatProjectRequestReference } from '../lib/intake/project-request-reference.js'

const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'FOUNDER'])

export function isFullCrmAccessor(auth: AuthContext): boolean {
  return (
    roleCanAccessPortal(auth.roles, 'admin') &&
    hasPermission(auth.permissions, 'leads.view') &&
    auth.roles.some((r) => adminRoles.has(r))
  )
}

export async function getEmployeeProfileId(userId: string): Promise<string | null> {
  const db = getDb()
  if (!db) return null
  const [row] = await db
    .select({ id: employeeProfiles.id })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId))
    .limit(1)
  return row?.id ?? null
}

export async function assertCanAccessLead(auth: AuthContext, leadId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  if (!hasPermission(auth.permissions, 'leads.view')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to view leads.', 403)
  }

  if (isFullCrmAccessor(auth)) return

  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this lead.', 403)
  }

  const [lead] = await db
    .select({ assignedEmployeeId: leads.assignedEmployeeId })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1)

  if (!lead || lead.assignedEmployeeId !== employeeId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this lead.', 403)
  }
}

export async function recordLeadActivity(
  leadId: string,
  action: string,
  actorUserId?: string | null,
  metadata?: Record<string, unknown>,
) {
  const db = getDb()
  if (!db) return
  await db.insert(leadActivities).values({
    leadId,
    actorUserId: actorUserId ?? null,
    action,
    metadata: metadata ? JSON.stringify(metadata) : null,
  })
}

export async function findDuplicateHints(input: {
  email: string
  phone?: string | null
  company?: string | null
}) {
  const db = getDb()
  if (!db) return { leadMatchId: null as string | null, customerMatchId: null as string | null }

  const email = input.email.trim().toLowerCase()
  const [leadHit] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.email, email))
    .orderBy(desc(leads.createdAt))
    .limit(1)

  const [customerHit] = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(users.email, email))
    .limit(1)

  return {
    leadMatchId: leadHit?.id ?? null,
    customerMatchId: customerHit?.id ?? null,
  }
}

/** Latest non-closed lead for the same email (re-inquiry target). */
export async function findLatestOpenLeadByEmail(email: string) {
  const db = getDb()
  if (!db) return null

  const normalized = email.trim().toLowerCase()
  const [row] = await db
    .select({ id: leads.id, status: leads.status })
    .from(leads)
    .where(
      and(eq(leads.email, normalized), notInArray(leads.status, [...CLOSED_LEAD_STATUSES])),
    )
    .orderBy(desc(leads.createdAt))
    .limit(1)

  return row ?? null
}

export async function notifyAdminsOfNewLead(
  _leadId: string,
  leadName: string,
  detail?: { variant?: 'default' | 'start_project'; service?: string; reference?: string },
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

  const isStart = detail?.variant === 'start_project'
  const title = isStart ? 'New Start Project request received' : 'New enquiry received'
  const servicePart = detail?.service?.trim() ? ` · ${detail.service.trim()}` : ''
  const refPart = detail?.reference?.trim() ? ` · Ref. ${detail.reference.trim()}` : ''
  const message = isStart
    ? `${leadName}${servicePart}${refPart}. Review in the CRM.`
    : `New lead: ${leadName}. Review in the CRM.`

  await db.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: isStart ? 'crm.start_project_received' : 'crm.lead_created',
      title,
      message,
    })),
  )
}

export async function getCrmMetrics(auth: AuthContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await leadScopeCondition(auth)

  const statusRows = await db
    .select({ status: leads.status, c: count() })
    .from(leads)
    .where(scope ?? sql`true`)
    .groupBy(leads.status)

  const now = new Date()
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const endToday = new Date(now)
  endToday.setHours(23, 59, 59, 999)

  const openScope = and(scope ?? sql`true`, inArray(leads.status, [...OPEN_LEAD_STATUSES]))

  const [overdue] = await db
    .select({ c: count() })
    .from(leads)
    .where(
      and(
        openScope,
        inArray(leads.followUpStatus, ['pending', 'due']),
        lt(leads.followUpAt, startToday),
      ),
    )

  const [todayFollowUps] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scope ?? sql`true`, followUpListFilterCondition('today', now)))

  const [upcomingFollowUps] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scope ?? sql`true`, followUpListFilterCondition('upcoming', now)))

  const [noFollowUp] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scope ?? sql`true`, followUpListFilterCondition('none', now)))

  const [unassigned] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(openScope, isNull(leads.assignedEmployeeId)))

  const won = statusRows.find((r) => r.status === 'won')?.c ?? 0
  const lost = statusRows.find((r) => r.status === 'lost')?.c ?? 0
  const closed = Number(won) + Number(lost)
  const conversionRate = closed >= 3 ? Number(won) / closed : null

  const [proposalValue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(
      and(scope ?? sql`true`, inArray(proposals.status, ['sent', 'viewed', 'changes_requested'])),
    )

  const serviceRows = await db
    .select({ service: leads.serviceInterest, c: count() })
    .from(leads)
    .where(scope ?? sql`true`)
    .groupBy(leads.serviceInterest)
    .orderBy(desc(count()))

  const sourceRows = await db
    .select({ source: leads.source, c: count() })
    .from(leads)
    .where(scope ?? sql`true`)
    .groupBy(leads.source)
    .orderBy(desc(count()))

  return {
    byStatus: statusRows,
    byService: serviceRows
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, count: Number(r.c) })),
    bySource: sourceRows.map((r) => ({
      source: r.source,
      sourceLabel: normalizeLeadSource(r.source),
      count: Number(r.c),
    })),
    overdueFollowUps: overdue?.c ?? 0,
    todayFollowUps: todayFollowUps?.c ?? 0,
    upcomingFollowUps: upcomingFollowUps?.c ?? 0,
    leadsWithoutFollowUp: noFollowUp?.c ?? 0,
    unassignedOpenLeads: unassigned?.c ?? 0,
    conversionRate,
    openProposalValue: proposalValue?.total ?? null,
    pipelineStatuses: CRM_PIPELINE_STATUSES,
  }
}

async function leadScopeCondition(auth: AuthContext) {
  if (isFullCrmAccessor(auth)) return undefined
  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) {
    throw new AppError('FORBIDDEN', 'You do not have CRM access.', 403)
  }
  return eq(leads.assignedEmployeeId, employeeId)
}

export async function listLeadsForCrm(
  auth: AuthContext,
  query: {
    status?: string
    priority?: string
    source?: string
    assignedEmployeeId?: string
    q?: string
    channel?: LeadEntryChannel
    followUp?: FollowUpListFilter
    locality?: 'erode' | 'tamil_nadu' | 'india' | 'international'
    market?: Tier1MarketId
    limit?: number
    offset?: number
    sort?: 'newest' | 'oldest' | 'priority' | 'follow_up' | 'updated'
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const limit = Math.min(query.limit ?? 50, 100)
  const offset = query.offset ?? 0
  const conditions = []

  const scope = await leadScopeCondition(auth)
  if (scope) conditions.push(scope)

  if (query.status) {
    conditions.push(eq(leads.status, query.status as typeof leads.status.enumValues[number]))
  }
  if (query.priority) {
    conditions.push(eq(leads.priority, query.priority as typeof leads.priority.enumValues[number]))
  }
  if (query.source) {
    conditions.push(eq(leads.source, storageSourceValue(normalizeLeadSource(query.source))))
  }
  if (query.assignedEmployeeId && isFullCrmAccessor(auth)) {
    conditions.push(eq(leads.assignedEmployeeId, query.assignedEmployeeId))
  }
  if (query.channel) {
    conditions.push(leadChannelFilterCondition(query.channel))
  }
  if (query.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(
      or(
        ilike(leads.name, term),
        ilike(leads.email, term),
        ilike(leads.company, term),
        ilike(leads.phone, term),
        ilike(leads.serviceInterest, term),
      )!,
    )
  }
  if (query.followUp) {
    conditions.push(followUpListFilterCondition(query.followUp))
  }
  if (query.locality === 'erode') {
    conditions.push(erodeLeadCondition())
  }
  if (query.locality === 'tamil_nadu') {
    conditions.push(tamilNaduLeadCondition())
  }
  if (query.locality === 'india') {
    conditions.push(indiaLeadCondition())
  }
  if (query.locality === 'international') {
    if (query.market) {
      conditions.push(tier1MarketLeadCondition(query.market))
    } else {
      conditions.push(internationalLeadCondition())
    }
  }

  const orderByClause =
    query.sort === 'oldest'
      ? asc(leads.createdAt)
      : query.sort === 'follow_up'
        ? asc(leads.followUpAt)
        : query.sort === 'priority'
          ? desc(leads.priority)
          : query.sort === 'updated'
            ? desc(leads.updatedAt)
            : desc(leads.createdAt)

  const rows = await db
    .select({
      lead: leads,
      assigneeName: users.fullName,
    })
    .from(leads)
    .leftJoin(employeeProfiles, eq(leads.assignedEmployeeId, employeeProfiles.id))
    .leftJoin(users, eq(employeeProfiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  return rows.map((r) => {
    const followUp = presentFollowUp(r.lead.followUpAt, r.lead.followUpStatus)
    return {
      ...r.lead,
      assignedName: r.assigneeName,
      sourceLabel: normalizeLeadSource(r.lead.source),
      entryChannel: leadEntryChannel(r.lead.pageSource),
      entryChannelLabel: leadEntryChannelLabel(leadEntryChannel(r.lead.pageSource)),
      customerRequestReference:
        r.lead.pageSource === PROJECT_INTAKE_PAGE_SOURCE
          ? formatProjectRequestReference(r.lead.id)
          : null,
      followUpLabel: followUp.label,
      followUpBucket: followUp.bucket,
    }
  })
}

export async function getCrmPipeline(auth: AuthContext) {
  const items = await listLeadsForCrm(auth, { limit: 200, sort: 'updated' })
  const columns: Record<string, typeof items> = {}
  for (const status of CRM_PIPELINE_STATUSES) {
    columns[status] = items.filter((l) => l.status === status)
  }
  return { columns, statuses: CRM_PIPELINE_STATUSES }
}

export async function getLeadDetailCrm(auth: AuthContext, leadId: string) {
  await assertCanAccessLead(auth, leadId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [leadRow] = await db
    .select({
      lead: leads,
      assigneeName: users.fullName,
    })
    .from(leads)
    .leftJoin(employeeProfiles, eq(leads.assignedEmployeeId, employeeProfiles.id))
    .leftJoin(users, eq(employeeProfiles.userId, users.id))
    .where(eq(leads.id, leadId))
    .limit(1)

  const lead = leadRow?.lead
  if (!lead) throw new AppError('NOT_FOUND', 'Lead not found.', 404)
  const assigneeName = leadRow.assigneeName

  const notes = await db
    .select({
      note: leadNotes,
      authorName: users.fullName,
    })
    .from(leadNotes)
    .innerJoin(users, eq(leadNotes.authorUserId, users.id))
    .where(eq(leadNotes.leadId, leadId))
    .orderBy(desc(leadNotes.createdAt))
    .limit(100)

  const activities = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt))
    .limit(100)

  const interactions = await db
    .select()
    .from(leadInteractions)
    .where(eq(leadInteractions.leadId, leadId))
    .orderBy(desc(leadInteractions.occurredAt))
    .limit(50)

  const leadProposals = await db
    .select()
    .from(proposals)
    .where(eq(proposals.leadId, leadId))
    .orderBy(desc(proposals.updatedAt))

  const duplicates = await findDuplicateHints({
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
  })

  let relatedCustomer = null
  if (lead.customerId) {
    const [c] = await db
      .select({ profile: customerProfiles, user: users })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(eq(customerProfiles.id, lead.customerId))
      .limit(1)
    relatedCustomer = c ?? null
  }

  const intake = parseStartProjectLeadNotes(lead.notes)
  const isStartProject = lead.pageSource === PROJECT_INTAKE_PAGE_SOURCE
  const followUpPresentation = presentFollowUp(lead.followUpAt, lead.followUpStatus)
  const lastActivityAt =
    activities[0]?.createdAt ??
    interactions[0]?.occurredAt ??
    lead.lastContactedAt ??
    lead.updatedAt

  return {
    lead: {
      ...lead,
      assignedName: assigneeName,
      sourceLabel: normalizeLeadSource(lead.source),
      entryChannel: leadEntryChannel(lead.pageSource),
      entryChannelLabel: leadEntryChannelLabel(leadEntryChannel(lead.pageSource)),
      customerRequestReference: isStartProject ? formatProjectRequestReference(lead.id) : null,
      startProjectIntake: intake,
      followUpLabel: followUpPresentation.label,
      followUpBucket: followUpPresentation.bucket,
      lastActivityAt: lastActivityAt ? new Date(lastActivityAt).toISOString() : null,
    },
    notes: notes.map((n) => ({
      id: n.note.id,
      content: n.note.content,
      createdAt: n.note.createdAt,
      authorName: n.authorName,
    })),
    activities,
    interactions,
    proposals: leadProposals,
    duplicateHints: duplicates,
    relatedCustomer,
  }
}

function assertQualifiedFields(lead: {
  serviceInterest: string | null
  budget: string | null
  timeline: string | null
  qualificationBusinessType: string | null
}) {
  const hasService = Boolean(lead.serviceInterest?.trim())
  const hasQual =
    Boolean(lead.budget?.trim()) ||
    Boolean(lead.timeline?.trim()) ||
    Boolean(lead.qualificationBusinessType?.trim())
  if (!hasService || !hasQual) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Qualified leads need service interest and at least one qualification field (budget, timeline, or business type).',
      400,
    )
  }
}

export async function updateLeadCrm(
  auth: AuthContext,
  leadId: string,
  input: Partial<{
    status: string
    priority: string
    notes: string
    assignedEmployeeId: string | null
    followUpAt: string | null
    followUpStatus: string
    lostReason: string
    serviceInterest: string
    budget: string
    timeline: string
    qualificationBusinessType: string
    qualificationProjectSize: string
    qualificationUrgency: string
    qualificationDecisionMaker: string
    source: string
    estimatedValue: string
    expectedCloseAt: string | null
    salesNextAction: string
    referralSource: string
    businessCity: string
    businessState: string
    businessCountry: string
    contactTimezone: string
  }>,
) {
  await assertCanAccessLead(auth, leadId)
  if (!hasPermission(auth.permissions, 'leads.update')) {
    throw new AppError('FORBIDDEN', 'You cannot update leads.', 403)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Lead not found.', 404)

  const next = { ...existing, ...input }
  if (input.status === 'qualified') {
    assertQualifiedFields(next)
    await recordLeadActivity(leadId, 'sales.opportunity_qualified', auth.userId, {
      estimatedValue: input.estimatedValue ?? existing.estimatedValue,
    })
  }
  if (input.status === 'lost' && !input.lostReason && !existing.lostReason) {
    throw new AppError('VALIDATION_ERROR', 'Select a lost reason.', 400)
  }

  if (input.assignedEmployeeId !== undefined && !hasPermission(auth.permissions, 'leads.assign')) {
    if (!isFullCrmAccessor(auth)) {
      throw new AppError('FORBIDDEN', 'You cannot assign leads.', 403)
    }
  }

  const [updated] = await db
    .update(leads)
    .set({
      status: input.status as typeof leads.status.enumValues[number] | undefined,
      priority: input.priority as typeof leads.priority.enumValues[number] | undefined,
      notes: input.notes,
      assignedEmployeeId: input.assignedEmployeeId,
      followUpAt: input.followUpAt ? new Date(input.followUpAt) : input.followUpAt === null ? null : undefined,
      followUpStatus: input.followUpStatus as typeof leads.followUpStatus.enumValues[number] | undefined,
      lostReason: input.lostReason as typeof leads.lostReason.enumValues[number] | undefined,
      serviceInterest: input.serviceInterest,
      budget: input.budget,
      timeline: input.timeline,
      qualificationBusinessType: input.qualificationBusinessType,
      qualificationProjectSize: input.qualificationProjectSize,
      qualificationUrgency: input.qualificationUrgency,
      qualificationDecisionMaker: input.qualificationDecisionMaker,
      source: input.source ? storageSourceValue(normalizeLeadSource(input.source)) : undefined,
      estimatedValue: input.estimatedValue,
      expectedCloseAt: input.expectedCloseAt
        ? new Date(input.expectedCloseAt)
        : input.expectedCloseAt === null
          ? null
          : undefined,
      salesNextAction: input.salesNextAction,
      referralSource: input.referralSource,
      businessCity: input.businessCity,
      businessState: input.businessState,
      businessCountry: input.businessCountry,
      contactTimezone: input.contactTimezone,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning()

  if (input.status && input.status !== existing.status) {
    await recordLeadActivity(leadId, 'lead.status_changed', auth.userId, {
      from: existing.status,
      to: input.status,
    })
  }
  if (input.priority && input.priority !== existing.priority) {
    await recordLeadActivity(leadId, 'lead.priority_changed', auth.userId, {
      priority: input.priority,
    })
  }

  return updated
}

export async function assignLeadCrm(
  auth: AuthContext,
  leadId: string,
  employeeId: string,
) {
  if (!hasPermission(auth.permissions, 'leads.assign')) {
    throw new AppError('FORBIDDEN', 'You cannot assign leads.', 403)
  }
  await assertCanAccessLead(auth, leadId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(leads)
    .set({ assignedEmployeeId: employeeId, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning()

  await recordLeadActivity(leadId, 'lead.assigned', auth.userId, { employeeId })

  const [emp] = await db
    .select({ userId: employeeProfiles.userId })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.id, employeeId))
    .limit(1)
  if (emp?.userId) {
    await db.insert(notifications).values({
      userId: emp.userId,
      type: 'crm.lead_assigned',
      title: 'Lead assigned to you',
      message: `You have been assigned lead: ${updated.name}.`,
    })
  }

  return updated
}

export async function addLeadNoteCrm(auth: AuthContext, leadId: string, content: string) {
  await assertCanAccessLead(auth, leadId)
  if (!hasPermission(auth.permissions, 'leads.update')) {
    throw new AppError('FORBIDDEN', 'You cannot add notes.', 403)
  }
  const trimmed = content.trim()
  if (trimmed.length < 1) throw new AppError('VALIDATION_ERROR', 'Note cannot be empty.', 400)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [note] = await db
    .insert(leadNotes)
    .values({ leadId, authorUserId: auth.userId, content: trimmed })
    .returning()

  await recordLeadActivity(leadId, 'lead.note_added', auth.userId)
  return note
}

export async function scheduleLeadFollowUpCrm(
  auth: AuthContext,
  leadId: string,
  input: { followUpAt: string; followUpStatus?: string },
) {
  await assertCanAccessLead(auth, leadId)
  if (!hasPermission(auth.permissions, 'leads.update')) {
    throw new AppError('FORBIDDEN', 'You cannot schedule follow-ups.', 403)
  }

  let followUpDate: Date
  try {
    followUpDate = parseFollowUpAtInput(input.followUpAt)
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Invalid follow-up date.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(leads)
    .set({
      followUpAt: followUpDate,
      followUpStatus: (input.followUpStatus as typeof leads.followUpStatus.enumValues[number]) ?? 'pending',
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning()

  await recordLeadActivity(leadId, 'lead.follow_up_scheduled', auth.userId, {
    followUpAt: input.followUpAt,
  })
  return updated
}

export async function logLeadInteractionCrm(
  auth: AuthContext,
  leadId: string,
  input: { interactionType: string; summary: string; occurredAt?: string; nextAction?: string },
) {
  await assertCanAccessLead(auth, leadId)
  if (!hasPermission(auth.permissions, 'leads.update')) {
    throw new AppError('FORBIDDEN', 'You cannot log interactions.', 403)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .insert(leadInteractions)
    .values({
      leadId,
      loggedByUserId: auth.userId,
      interactionType: input.interactionType,
      summary: input.summary.trim(),
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      nextAction: input.nextAction?.trim() || null,
    })
    .returning()

  await db
    .update(leads)
    .set({ lastContactedAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, leadId))

  await recordLeadActivity(leadId, 'lead.interaction_logged', auth.userId, {
    type: input.interactionType,
  })
  return row
}

export async function convertLeadCrm(
  auth: AuthContext,
  leadId: string,
  input: { linkExistingCustomerId?: string; invite?: boolean },
) {
  if (!isFullCrmAccessor(auth)) {
    throw new AppError('FORBIDDEN', 'Only administrators can convert leads.', 403)
  }
  await assertCanAccessLead(auth, leadId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  if (!lead) throw new AppError('NOT_FOUND', 'Lead not found.', 404)
  if (lead.status !== 'won' && lead.status !== 'negotiation' && lead.status !== 'proposal') {
    throw new AppError('CONFLICT', 'Lead should be in a late-stage status before conversion.', 409)
  }

  const hints = await findDuplicateHints({ email: lead.email, company: lead.company })
  if (hints.customerMatchId && !input.linkExistingCustomerId) {
    return {
      requiresConfirmation: true,
      existingCustomerId: hints.customerMatchId,
      message: 'A customer with this email already exists. Link instead of creating a duplicate.',
    }
  }

  let customerId = input.linkExistingCustomerId ?? hints.customerMatchId ?? lead.customerId

  if (!customerId && input.invite !== false) {
    const invited = await inviteCustomerFromLead({
      email: lead.email,
      fullName: lead.name,
      companyName: lead.company ?? undefined,
      phone: lead.phone ?? undefined,
      invitedByUserId: auth.userId,
    })
    customerId = invited.customerProfileId
  }

  if (!customerId) {
    throw new AppError('VALIDATION_ERROR', 'Provide linkExistingCustomerId or enable invite.', 400)
  }

  const [updated] = await db
    .update(leads)
    .set({
      status: 'won',
      customerId,
      convertedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning()

  await recordLeadActivity(leadId, 'lead.converted', auth.userId, { customerId })
  return { lead: updated, customerId }
}

export async function getLeadActivityCrm(auth: AuthContext, leadId: string) {
  await assertCanAccessLead(auth, leadId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt))
    .limit(200)
}
