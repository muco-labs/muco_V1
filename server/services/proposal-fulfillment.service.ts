import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  leads,
  notifications,
  projects,
  proposalLineItems,
  proposals,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { normalizeProposalCurrency } from '../lib/currency/constants.js'
import { AppError } from '../lib/errors.js'
import { formatProjectRequestReference } from '../lib/intake/project-request-reference.js'
import { hasPermission } from '../lib/auth/permissions.js'
import {
  canCreateProposalForLead,
  isProposalCustomerActionable,
  presentCustomerProposalStatus,
  PROPOSAL_OPEN_STATUSES,
} from '../lib/proposals/proposal-fulfillment.js'
import {
  computeProposalPricing,
  type ProposalLineInput,
} from '../lib/proposals/proposal-pricing.js'
import { formatProposalReference } from '../lib/proposals/proposal-reference.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { assertCanAccessLead } from './crm.service.js'
import { sendProposalAdmin } from './admin.service.js'

type ProposalPermission =
  | 'proposals.view'
  | 'proposals.create'
  | 'proposals.update'
  | 'proposals.send'

function assertProposalPermission(auth: AuthContext, permission: ProposalPermission) {
  if (!hasPermission(auth.permissions, permission)) {
    if (permission === 'proposals.send' && hasPermission(auth.permissions, 'proposals.create')) {
      return
    }
    throw new AppError('FORBIDDEN', 'You do not have permission to manage proposals.', 403)
  }
}

export function buildProposalTotals(
  lineRows: Array<{ description: string; quantity: string; unitAmount: string }>,
  discountAmount?: string | null,
) {
  try {
    return computeProposalPricing(lineRows, discountAmount, 0)
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Invalid proposal pricing.', 400)
  }
}

export function serializeCustomerProposal(
  row: typeof proposals.$inferSelect,
  lineItems: Array<typeof proposalLineItems.$inferSelect>,
  refs?: {
    sourceRequestReference?: string | null
    projectReference?: string | null
  },
) {
  const pricing = buildProposalTotals(lineItems, row.discountAmount)
  const presentation = presentCustomerProposalStatus(row.status, row.validUntil)
  const actionable = isProposalCustomerActionable(row.status, row.validUntil)

  return {
    id: row.id,
    reference: formatProposalReference(row.id),
    title: row.title ?? 'Proposal',
    status: presentation.expired ? 'expired' : row.status,
    statusLabel: presentation.label,
    nextAction: presentation.nextAction,
    expired: presentation.expired,
    canAcceptOrReject: actionable,
    scope: row.scope,
    deliverables: row.deliverables,
    timeline: row.timeline,
    terms: row.terms,
    currency: row.currency,
    subtotal: pricing.subtotal,
    discountAmount: row.discountAmount,
    tax: pricing.tax,
    amount: pricing.total,
    paymentSchedule: row.paymentSchedule,
    version: row.version,
    validUntil: row.validUntil?.toISOString() ?? null,
    sourceRequestReference: refs?.sourceRequestReference ?? null,
    projectReference: refs?.projectReference ?? null,
    customerDecidedAt: row.customerDecidedAt?.toISOString() ?? null,
    lineItems: lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      itemType: item.itemType,
      lineTotal: buildProposalTotals(
        [{ description: item.description, quantity: item.quantity, unitAmount: item.unitAmount }],
        null,
      ).total,
    })),
  }
}

function mapAdminProposal(
  row: typeof proposals.$inferSelect,
  extras?: Record<string, unknown>,
) {
  return {
    ...row,
    reference: formatProposalReference(row.id),
    validUntil: row.validUntil?.toISOString() ?? null,
    customerDecidedAt: row.customerDecidedAt?.toISOString() ?? null,
    approvedForSendAt: row.approvedForSendAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...extras,
  }
}

async function findOpenProposalForLead(leadId: string) {
  const db = getDb()
  if (!db) return null
  const [row] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.leadId, leadId),
        inArray(proposals.status, [...PROPOSAL_OPEN_STATUSES]),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function listProposalsFulfillmentAdmin(
  auth: AuthContext,
  query?: { status?: string; q?: string },
) {
  assertProposalPermission(auth, 'proposals.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (query?.status?.trim()) {
    conditions.push(eq(proposals.status, query.status.trim() as typeof proposals.$inferSelect.status))
  }
  if (query?.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(or(ilike(proposals.title, term), ilike(proposals.scope, term))!)
  }

  const rows = await db
    .select({
      proposal: proposals,
      companyName: customerProfiles.companyName,
    })
    .from(proposals)
    .leftJoin(customerProfiles, eq(proposals.customerId, customerProfiles.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(proposals.updatedAt))
    .limit(100)

  return rows.map((r) =>
    mapAdminProposal(r.proposal, {
      companyName: r.companyName,
      sourceRequestReference: r.proposal.leadId
        ? formatProjectRequestReference(r.proposal.leadId)
        : null,
      projectReference: r.proposal.projectId
        ? formatProjectReference(r.proposal.projectId)
        : null,
    }),
  )
}

export async function getProposalFulfillmentAdmin(auth: AuthContext, proposalId: string) {
  assertProposalPermission(auth, 'proposals.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      proposal: proposals,
      companyName: customerProfiles.companyName,
      customerEmail: users.email,
      customerName: users.fullName,
    })
    .from(proposals)
    .leftJoin(customerProfiles, eq(proposals.customerId, customerProfiles.id))
    .leftJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(proposals.id, proposalId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(proposalLineItems.sortOrder)

  const pricing = buildProposalTotals(lineItems, row.proposal.discountAmount)

  let sourceLead = null
  if (row.proposal.leadId) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, row.proposal.leadId)).limit(1)
    if (lead) {
      sourceLead = {
        id: lead.id,
        reference: formatProjectRequestReference(lead.id),
        status: lead.status,
        name: lead.name,
        serviceInterest: lead.serviceInterest,
      }
    }
  }

  let linkedProject = null
  if (row.proposal.projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, row.proposal.projectId))
      .limit(1)
    if (project) {
      linkedProject = {
        id: project.id,
        reference: formatProjectReference(project.id),
        name: project.name,
        status: project.status,
      }
    }
  }

  return {
    proposal: mapAdminProposal(row.proposal, {
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      sourceRequestReference: row.proposal.leadId
        ? formatProjectRequestReference(row.proposal.leadId)
        : null,
      projectReference: row.proposal.projectId
        ? formatProjectReference(row.proposal.projectId)
        : null,
    }),
    customer: row.proposal.customerId
      ? {
          id: row.proposal.customerId,
          companyName: row.companyName,
          contactName: row.customerName,
          email: row.customerEmail,
        }
      : null,
    sourceLead,
    linkedProject,
    lineItems,
    pricing,
  }
}

async function replaceLineItems(
  proposalId: string,
  lineItems: ProposalLineInput[],
  discountAmount: string | null | undefined,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  await db.delete(proposalLineItems).where(eq(proposalLineItems.proposalId, proposalId))

  const filtered = lineItems.filter((i) => i.description?.trim())
  if (filtered.length === 0) {
    return { lineRows: [] as Array<typeof proposalLineItems.$inferSelect>, amount: null as string | null }
  }

  const inserted = await db
    .insert(proposalLineItems)
    .values(
      filtered.map((item, index) => ({
        proposalId,
        description: item.description.trim(),
        quantity: item.quantity ?? '1',
        unitAmount: item.unitAmount,
        itemType: item.itemType ?? 'service',
        sortOrder: item.sortOrder ?? index,
      })),
    )
    .returning()

  const pricing = buildProposalTotals(inserted, discountAmount)
  return { lineRows: inserted, amount: pricing.total }
}

export async function updateProposalDraftAdmin(
  auth: AuthContext,
  proposalId: string,
  input: {
    title?: string
    scope?: string
    deliverables?: string
    timeline?: string
    terms?: string
    validUntil?: string | null
    paymentSchedule?: string
    currency?: string
    discountAmount?: string | null
    lineItems?: ProposalLineInput[]
  },
) {
  assertProposalPermission(auth, 'proposals.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
  if (existing.status !== 'draft') {
    throw new AppError('CONFLICT', 'Only draft proposals can be edited.', 409)
  }

  const patch: Partial<typeof proposals.$inferInsert> = { updatedAt: new Date() }
  if (input.title?.trim()) patch.title = input.title.trim()
  if (input.scope !== undefined) patch.scope = input.scope?.trim() || null
  if (input.deliverables !== undefined) patch.deliverables = input.deliverables?.trim() || null
  if (input.timeline !== undefined) patch.timeline = input.timeline?.trim() || null
  if (input.terms !== undefined) patch.terms = input.terms?.trim() || null
  if (input.paymentSchedule !== undefined) {
    patch.paymentSchedule = input.paymentSchedule?.trim() || null
  }
  if (input.currency) patch.currency = normalizeProposalCurrency(input.currency)
  if (input.validUntil !== undefined) {
    patch.validUntil = input.validUntil ? new Date(input.validUntil) : null
  }
  if (input.discountAmount !== undefined) {
    patch.discountAmount = input.discountAmount
  }

  if (input.lineItems) {
    const { amount } = await replaceLineItems(
      proposalId,
      input.lineItems,
      input.discountAmount ?? existing.discountAmount,
    )
    patch.amount = amount
  } else if (input.discountAmount !== undefined) {
    const lines = await db
      .select()
      .from(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, proposalId))
    if (lines.length > 0) {
      patch.amount = buildProposalTotals(lines, input.discountAmount).total
    }
  }

  const [updated] = await db
    .update(proposals)
    .set(patch)
    .where(eq(proposals.id, proposalId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.updated',
    entity: 'proposals',
    entityId: proposalId,
  })

  return getProposalFulfillmentAdmin(auth, updated.id)
}

export async function cancelProposalAdmin(auth: AuthContext, proposalId: string) {
  assertProposalPermission(auth, 'proposals.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(proposals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(proposals.id, proposalId),
        inArray(proposals.status, ['draft', 'sent', 'viewed', 'changes_requested']),
      ),
    )
    .returning()

  if (!updated) {
    throw new AppError('CONFLICT', 'This proposal cannot be cancelled.', 409)
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.cancelled',
    entity: 'proposals',
    entityId: proposalId,
  })

  return mapAdminProposal(updated)
}

export async function createProposalFromLeadCrm(
  auth: AuthContext,
  leadId: string,
  input?: {
    title?: string
    scope?: string
    projectId?: string
    lineItems?: ProposalLineInput[]
    validUntil?: string
  },
) {
  assertProposalPermission(auth, 'proposals.create')
  await assertCanAccessLead(auth, leadId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  if (!lead) throw new AppError('NOT_FOUND', 'Lead not found.', 404)

  const eligibility = canCreateProposalForLead({
    status: lead.status,
    customerId: lead.customerId,
  })
  if (!eligibility.ok) {
    throw new AppError('VALIDATION_ERROR', eligibility.reason, 400)
  }

  const open = await findOpenProposalForLead(leadId)
  if (open) {
    return {
      alreadyExists: true as const,
      proposal: mapAdminProposal(open, {
        sourceRequestReference: formatProjectRequestReference(leadId),
      }),
    }
  }

  let projectId = input?.projectId ?? null
  if (!projectId) {
    const [linked] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.leadId, leadId))
      .limit(1)
    projectId = linked?.id ?? null
  }

  const title =
    input?.title?.trim() ||
    `${lead.company?.trim() || lead.name.trim()} — ${lead.serviceInterest?.trim() || 'Proposal'}`

  const [row] = await db
    .insert(proposals)
    .values({
      customerId: lead.customerId!,
      leadId: lead.id,
      projectId,
      title: title.slice(0, 200),
      scope: input?.scope?.trim() || lead.projectDescription?.trim() || null,
      timeline: lead.timeline?.trim() || null,
      status: 'draft',
      validUntil: input?.validUntil ? new Date(input.validUntil) : null,
    })
    .returning()

  if (input?.lineItems?.length) {
    const { amount } = await replaceLineItems(row.id, input.lineItems, null)
    if (amount) {
      await db.update(proposals).set({ amount, updatedAt: new Date() }).where(eq(proposals.id, row.id))
      row.amount = amount
    }
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.created',
    entity: 'proposals',
    entityId: row.id,
    metadata: JSON.stringify({
      leadId,
      reference: formatProposalReference(row.id),
    }),
  })

  await notifyAdminsProposalEvent('Proposal draft created', formatProposalReference(row.id), title)

  return {
    alreadyExists: false as const,
    proposal: mapAdminProposal(row, {
      sourceRequestReference: formatProjectRequestReference(leadId),
      projectReference: projectId ? formatProjectReference(projectId) : null,
    }),
  }
}

export async function createProposalFromProjectCrm(
  auth: AuthContext,
  projectId: string,
  input?: { title?: string; scope?: string; lineItems?: ProposalLineInput[] },
) {
  assertProposalPermission(auth, 'proposals.create')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  if (project.leadId) {
    const open = await findOpenProposalForLead(project.leadId)
    if (open) {
      return {
        alreadyExists: true as const,
        proposal: mapAdminProposal(open),
      }
    }
  }

  const title = input?.title?.trim() || `${project.name} — Proposal`

  const [row] = await db
    .insert(proposals)
    .values({
      customerId: project.customerId,
      leadId: project.leadId,
      projectId: project.id,
      title: title.slice(0, 200),
      scope: input?.scope?.trim() || project.description,
      status: 'draft',
    })
    .returning()

  if (input?.lineItems?.length) {
    const { amount } = await replaceLineItems(row.id, input.lineItems, null)
    if (amount) {
      await db.update(proposals).set({ amount, updatedAt: new Date() }).where(eq(proposals.id, row.id))
      row.amount = amount
    }
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.created',
    entity: 'proposals',
    entityId: row.id,
    metadata: JSON.stringify({ projectId }),
  })

  return {
    alreadyExists: false as const,
    proposal: mapAdminProposal(row, {
      projectReference: formatProjectReference(project.id),
      sourceRequestReference: project.leadId
        ? formatProjectRequestReference(project.leadId)
        : null,
    }),
  }
}

export async function sendProposalFulfillmentAdmin(auth: AuthContext, proposalId: string) {
  assertProposalPermission(auth, 'proposals.send')
  const sent = await sendProposalAdmin(auth.userId, proposalId, auth.roles)
  await notifyAdminsProposalEvent('Proposal sent', formatProposalReference(sent.id), sent.title ?? 'Proposal')
  return mapAdminProposal(sent)
}

async function notifyAdminsProposalEvent(title: string, reference: string, subject: string) {
  const db = getDb()
  if (!db) return

  const adminUsers = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(or(eq(roles.name, 'FOUNDER'), eq(roles.name, 'ADMIN'), eq(roles.name, 'SUPER_ADMIN')))

  const unique = [...new Set(adminUsers.map((r) => r.userId))]
  if (unique.length === 0) return

  await db.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: 'proposals.activity',
      title,
      message: `${reference} · ${subject}`,
    })),
  )
}

export async function recordCustomerProposalView(ctx: { customerId: string }, proposalId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, ctx.customerId)))
    .limit(1)

  if (!row || row.status === 'draft') {
    throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
  }

  if (row.status === 'sent') {
    const [updated] = await db
      .update(proposals)
      .set({ status: 'viewed', updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning()
    return updated ?? row
  }

  return row
}
