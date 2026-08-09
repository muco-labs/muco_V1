import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  files,
  invoiceLineItems,
  invoices,
  messages,
  milestones,
  notifications,
  payments,
  projects,
  proposalApprovals,
  proposalLineItems,
  proposals,
  supportTicketReplies,
  supportTickets,
  roles,
  userRoles,
  tasks,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { isRazorpayConfigured, serverEnv } from '../lib/env.js'
import {
  finalizeSuccessfulPayment,
  syncOverdueInvoices,
  verifyRazorpayCheckoutSignature,
} from './payment.service.js'
import { computeProjectProgressFromTasks } from './workflow.service.js'
import { serializeCustomerProjectSummary } from './project-fulfillment.service.js'

export type CustomerContext = {
  userId: string
  customerId: string
  email: string
  fullName: string | null
}

export async function requireCustomerContext(auth: AuthContext): Promise<CustomerContext> {
  if (!auth.roles.includes('CUSTOMER')) {
    throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
  }

  const db = getDb()
  if (!db) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)
  }

  const [profile] = await db
    .select({
      id: customerProfiles.id,
      userId: customerProfiles.userId,
    })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, auth.userId))
    .limit(1)

  if (!profile) {
    throw new AppError('FORBIDDEN', 'Customer profile is not set up.', 403)
  }

  const [user] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1)

  return {
    userId: auth.userId,
    customerId: profile.id,
    email: user?.email ?? auth.email,
    fullName: user?.fullName ?? null,
  }
}

export async function getOwnedProject(customerId: string, projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1)

  if (!project) {
    throw new AppError('NOT_FOUND', 'Project not found.', 404)
  }

  return project
}

const customerVisibleProposalStatuses = [
  'sent',
  'viewed',
  'accepted',
  'declined',
  'changes_requested',
  'expired',
] as const

const customerVisibleInvoiceStatuses = ['sent', 'paid', 'partial', 'overdue'] as const

export async function getCustomerDashboard(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, ctx.customerId))
    .limit(1)

  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, ctx.customerId))
    .orderBy(desc(projects.updatedAt))
    .limit(5)

  const pendingProposals = await db
    .select({ id: proposals.id, title: proposals.title, status: proposals.status })
    .from(proposals)
    .where(
      and(
        eq(proposals.customerId, ctx.customerId),
        inArray(proposals.status, ['sent', 'viewed', 'changes_requested']),
      ),
    )
    .limit(5)

  const outstandingInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, ctx.customerId),
        inArray(invoices.status, ['sent', 'partial', 'overdue']),
      ),
    )
    .orderBy(desc(invoices.dueDate))
    .limit(5)

  const recentPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, ctx.customerId))
    .orderBy(desc(payments.createdAt))
    .limit(5)

  const recentMessages = await db
    .select()
    .from(messages)
    .where(
      or(eq(messages.senderUserId, ctx.userId), eq(messages.recipientUserId, ctx.userId)),
    )
    .orderBy(desc(messages.createdAt))
    .limit(5)

  const openTickets = await db
    .select()
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.customerId, ctx.customerId),
        inArray(supportTickets.status, ['open', 'in_progress', 'waiting']),
      ),
    )
    .orderBy(desc(supportTickets.updatedAt))
    .limit(5)

  const recentNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, ctx.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(8)

  const unreadCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, ctx.userId), eq(notifications.read, false)))

  return {
    welcomeName: ctx.fullName ?? ctx.email,
    companyName: profile?.companyName ?? null,
    activeProjects: projectRows
      .filter((p) => p.status === 'active')
      .map(serializeCustomerProjectSummary),
    planningProjects: projectRows
      .filter((p) => p.status === 'draft')
      .map(serializeCustomerProjectSummary),
    recentProjects: projectRows.map(serializeCustomerProjectSummary),
    pendingApprovals: pendingProposals,
    outstandingInvoices,
    recentPayments,
    recentMessages,
    openSupportTickets: openTickets,
    recentNotifications,
    unreadNotificationCount: unreadCount[0]?.count ?? 0,
  }
}

export async function getCustomerProfile(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1)
  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, ctx.customerId))
    .limit(1)

  return {
    email: user?.email ?? ctx.email,
    fullName: user?.fullName ?? null,
    status: user?.status ?? 'active',
    companyName: profile?.companyName ?? null,
    phone: profile?.phone ?? null,
    jobTitle: profile?.jobTitle ?? null,
    billingAddress: profile?.billingAddress ?? null,
    hasAvatar: Boolean(profile?.avatarStorageKey),
  }
}

export type UpdateProfileInput = {
  fullName?: string
  companyName?: string
  phone?: string
  jobTitle?: string
  billingAddress?: string
}

export async function updateCustomerProfile(ctx: CustomerContext, input: UpdateProfileInput) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (input.fullName !== undefined) {
    await db
      .update(users)
      .set({ fullName: input.fullName.trim(), updatedAt: new Date() })
      .where(eq(users.id, ctx.userId))
  }

  await db
    .update(customerProfiles)
    .set({
      companyName: input.companyName?.trim() ?? undefined,
      phone: input.phone?.trim() ?? undefined,
      jobTitle: input.jobTitle?.trim() ?? undefined,
      billingAddress: input.billingAddress?.trim() ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(customerProfiles.id, ctx.customerId))

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'customer.profile_updated',
    entity: 'customer_profiles',
    entityId: ctx.customerId,
  })

  return getCustomerProfile(ctx)
}

export async function listCustomerProjects(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, ctx.customerId))
    .orderBy(desc(projects.updatedAt))

  const withProgress = await Promise.all(
    rows.map(async (project) => {
      const ms = await db
        .select({ status: milestones.status })
        .from(milestones)
        .where(eq(milestones.projectId, project.id))
      const ts = await db
        .select({ status: tasks.status })
        .from(tasks)
        .where(eq(tasks.projectId, project.id))
      return {
        ...serializeCustomerProjectSummary(project),
        progressPercent: computeProjectProgressFromTasks(ts, ms),
      }
    }),
  )

  return withProgress
}

export async function getCustomerProjectDetail(ctx: CustomerContext, projectId: string) {
  const project = await getOwnedProject(ctx.customerId, projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const milestoneRows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(milestones.dueDate)

  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      milestoneId: tasks.milestoneId,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.updatedAt))

  return {
    project: serializeCustomerProjectSummary(project),
    milestones: milestoneRows.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      status: m.status,
      dueDate: m.dueDate?.toISOString() ?? null,
    })),
    tasks: [],
    progressPercent: computeProjectProgressFromTasks(taskRows, milestoneRows),
  }
}

function sanitizeFile(row: typeof files.$inferSelect) {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    category: row.category,
    projectId: row.projectId,
    createdAt: row.createdAt,
  }
}

export async function listCustomerProposals(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      amount: proposals.amount,
      validUntil: proposals.validUntil,
      projectId: proposals.projectId,
      updatedAt: proposals.updatedAt,
    })
    .from(proposals)
    .where(
      and(
        eq(proposals.customerId, ctx.customerId),
        inArray(proposals.status, [...customerVisibleProposalStatuses]),
      ),
    )
    .orderBy(desc(proposals.updatedAt))
}

export async function getCustomerProposal(ctx: CustomerContext, proposalId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, ctx.customerId)))
    .limit(1)

  if (!row || row.status === 'draft') {
    throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
  }

  if (row.status === 'sent') {
    await db
      .update(proposals)
      .set({ status: 'viewed', updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
    row.status = 'viewed'
  }

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(asc(proposalLineItems.sortOrder))

  return {
    id: row.id,
    title: row.title ?? 'Proposal',
    status: row.status,
    scope: row.scope,
    deliverables: row.deliverables,
    timeline: row.timeline,
    terms: row.terms,
    amount: row.amount,
    discountAmount: row.discountAmount,
    paymentSchedule: row.paymentSchedule,
    version: row.version,
    validUntil: row.validUntil,
    projectId: row.projectId,
    customerDecidedAt: row.customerDecidedAt,
    customerDecisionNote: row.customerDecisionNote,
    lineItems: lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      itemType: item.itemType,
    })),
  }
}

export async function decideProposal(
  ctx: CustomerContext,
  proposalId: string,
  decision: 'approve' | 'request_changes' | 'reject',
  note?: string,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, ctx.customerId)))
    .limit(1)

  if (!row || !['sent', 'viewed', 'changes_requested'].includes(row.status)) {
    throw new AppError('CONFLICT', 'This proposal cannot be updated.', 409)
  }

  const nextStatus =
    decision === 'approve' ? 'accepted' : decision === 'reject' ? 'declined' : 'changes_requested'

  const [updated] = await db
    .update(proposals)
    .set({
      status: nextStatus,
      customerDecidedAt: new Date(),
      customerDecisionNote: note?.trim() || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(proposals.id, proposalId),
        inArray(proposals.status, ['sent', 'viewed', 'changes_requested']),
      ),
    )
    .returning()

  if (!updated) {
    throw new AppError('CONFLICT', 'This proposal was already decided.', 409)
  }

  await db.insert(proposalApprovals).values({
    proposalId,
    customerId: ctx.customerId,
    decision,
    note: note?.trim() || null,
    proposalStatusAtDecision: row.status,
  })

  await db.insert(auditLogs).values({
    actorUserId: ctx.userId,
    action: 'proposal.customer_decision',
    entity: 'proposals',
    entityId: proposalId,
    metadata: JSON.stringify({ decision }),
  })

  await db.insert(notifications).values({
    userId: ctx.userId,
    type: 'proposal',
    title: 'Proposal decision recorded',
    message: `Your ${decision.replace('_', ' ')} response was saved.`,
  })

  if (decision === 'approve') {
    const adminUsers = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))
    const unique = [...new Set(adminUsers.map((r) => r.userId))]
    if (unique.length > 0) {
      await db.insert(notifications).values(
        unique.map((userId) => ({
          userId,
          type: 'proposal.approved',
          title: 'Proposal approved',
          message: `Customer approved proposal ${updated.title ?? proposalId}.`,
        })),
      )
    }
  }

  return getCustomerProposal(ctx, proposalId)
}

export async function listCustomerInvoices(ctx: CustomerContext) {
  await syncOverdueInvoices()
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, ctx.customerId),
        inArray(invoices.status, [...customerVisibleInvoiceStatuses]),
      ),
    )
    .orderBy(desc(invoices.createdAt))
}

export async function getCustomerInvoice(ctx: CustomerContext, invoiceId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.customerId, ctx.customerId)))
    .limit(1)

  if (!invoice || invoice.status === 'draft' || invoice.status === 'void') {
    throw new AppError('NOT_FOUND', 'Invoice not found.', 404)
  }

  const lines = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.sortOrder)

  return { invoice, lineItems: lines }
}

export async function listCustomerPayments(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select()
    .from(payments)
    .where(eq(payments.customerId, ctx.customerId))
    .orderBy(desc(payments.createdAt))
}

export async function listCustomerFiles(ctx: CustomerContext, projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (projectId) {
    await getOwnedProject(ctx.customerId, projectId)
  }

  const owned = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.customerId, ctx.customerId))
  const projectIds = new Set(owned.map((p) => p.id))

  const rows = await db
    .select()
    .from(files)
    .where(eq(files.customerId, ctx.customerId))
    .orderBy(desc(files.createdAt))

  const projectFiles =
    projectIds.size > 0
      ? await db
          .select()
          .from(files)
          .where(inArray(files.projectId, [...projectIds]))
          .orderBy(desc(files.createdAt))
      : []

  const byId = new Map<string, (typeof rows)[number]>()
  for (const row of [...rows, ...projectFiles]) {
    const visibility = row.visibility ?? 'internal'
    if (visibility !== 'customer_visible' && visibility !== 'deliverable') continue
    byId.set(row.id, row)
  }

  const merged = [...byId.values()]
  if (projectId) {
    return merged.filter((f) => f.projectId === projectId).map(sanitizeFile)
  }

  return merged.map(sanitizeFile)
}

const ALLOWED_UPLOAD_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
])

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function registerCustomerFileUpload(
  ctx: CustomerContext,
  auth: AuthContext,
  input: {
    projectId?: string
    fileName: string
    mimeType: string
    fileSizeBytes: number
    category?: string
  },
) {
  if (!hasPermission(auth.permissions, 'files.upload')) {
    throw new AppError('FORBIDDEN', 'You cannot upload files.', 403)
  }

  if (!ALLOWED_UPLOAD_MIME.has(input.mimeType)) {
    throw new AppError('VALIDATION_ERROR', 'This file type is not allowed.', 400)
  }

  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_UPLOAD_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'File exceeds the size limit (10 MB).', 400)
  }

  const safeName = input.fileName.replace(/[^\w.\-() ]+/g, '_').slice(0, 200)
  if (input.projectId) {
    await getOwnedProject(ctx.customerId, input.projectId)
  }

  const storageKey = `customers/${ctx.customerId}/${Date.now()}-${safeName}`

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db
    .insert(files)
    .values({
      customerId: ctx.customerId,
      projectId: input.projectId ?? null,
      uploadedByUserId: ctx.userId,
      storageKey,
      fileName: safeName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      category: input.category ?? 'other',
    })
    .returning()

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      file: sanitizeFile(row),
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
    file: sanitizeFile(row),
    upload: {
      configured: true as const,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    },
  }
}

export async function getCustomerFileDownloadUrl(ctx: CustomerContext, fileId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [row] = await db.select().from(files).where(eq(files.id, fileId)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'File not found.', 404)

  if (row.customerId !== ctx.customerId) {
    if (row.projectId) {
      await getOwnedProject(ctx.customerId, row.projectId)
    } else {
      throw new AppError('NOT_FOUND', 'File not found.', 404)
    }
  }

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

export async function listCustomerMessages(ctx: CustomerContext, projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  if (projectId) {
    await getOwnedProject(ctx.customerId, projectId)
  }

  const conditions = projectId
    ? eq(messages.projectId, projectId)
    : or(eq(messages.senderUserId, ctx.userId), eq(messages.recipientUserId, ctx.userId))

  return db.select().from(messages).where(conditions).orderBy(desc(messages.createdAt)).limit(100)
}

export async function sendCustomerMessage(
  ctx: CustomerContext,
  input: { body: string; projectId?: string },
) {
  const body = input.body.trim()
  if (body.length < 2 || body.length > 8000) {
    throw new AppError('VALIDATION_ERROR', 'Message must be between 2 and 8000 characters.', 400)
  }

  if (input.projectId) {
    await getOwnedProject(ctx.customerId, input.projectId)
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

export async function listSupportTickets(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.customerId, ctx.customerId))
    .orderBy(desc(supportTickets.updatedAt))
}

export async function getSupportTicket(ctx: CustomerContext, ticketId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.customerId, ctx.customerId)))
    .limit(1)

  if (!ticket) throw new AppError('NOT_FOUND', 'Support ticket not found.', 404)

  const replies = await db
    .select({
      id: supportTicketReplies.id,
      body: supportTicketReplies.body,
      isStaff: supportTicketReplies.isStaff,
      createdAt: supportTicketReplies.createdAt,
    })
    .from(supportTicketReplies)
    .where(eq(supportTicketReplies.ticketId, ticketId))
    .orderBy(supportTicketReplies.createdAt)

  return { ticket, replies }
}

export async function createSupportTicket(
  ctx: CustomerContext,
  input: {
    subject: string
    description: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    projectId?: string
  },
) {
  const subject = input.subject.trim()
  const description = input.description.trim()
  if (subject.length < 3 || description.length < 10) {
    throw new AppError('VALIDATION_ERROR', 'Please provide a subject and description.', 400)
  }

  if (input.projectId) {
    await getOwnedProject(ctx.customerId, input.projectId)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      customerId: ctx.customerId,
      projectId: input.projectId ?? null,
      subject,
      description,
      priority: input.priority ?? 'medium',
    })
    .returning()

  return ticket
}

export async function replySupportTicket(ctx: CustomerContext, ticketId: string, body: string) {
  const trimmed = body.trim()
  if (trimmed.length < 2) {
    throw new AppError('VALIDATION_ERROR', 'Reply is too short.', 400)
  }

  const { ticket } = await getSupportTicket(ctx, ticketId)
  if (ticket.status === 'closed') {
    throw new AppError('CONFLICT', 'This ticket is closed.', 409)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [reply] = await db
    .insert(supportTicketReplies)
    .values({
      ticketId,
      authorUserId: ctx.userId,
      body: trimmed,
      isStaff: false,
    })
    .returning()

  await db
    .update(supportTickets)
    .set({ updatedAt: new Date(), status: 'waiting' })
    .where(eq(supportTickets.id, ticketId))

  return reply
}

export async function listNotifications(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, ctx.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100)
}

export async function markNotificationRead(ctx: CustomerContext, notificationId: string) {
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

export async function createInvoicePaymentIntent(ctx: CustomerContext, invoiceId: string) {
  const { invoice } = await getCustomerInvoice(ctx, invoiceId)

  if (!['sent', 'partial', 'overdue'].includes(invoice.status)) {
    throw new AppError('CONFLICT', 'This invoice is not payable.', 409)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [payment] = await db
    .insert(payments)
    .values({
      invoiceId: invoice.id,
      customerId: ctx.customerId,
      amount: invoice.amount,
      status: 'pending',
    })
    .returning()

  if (!isRazorpayConfigured()) {
    return {
      paymentId: payment.id,
      razorpay: { configured: false as const, message: 'Online payments are not configured yet.' },
    }
  }

  const amountPaise = Math.round(Number(invoice.amount) * 100)
  const auth = Buffer.from(`${serverEnv.razorpayKeyId}:${serverEnv.razorpayKeySecret}`).toString(
    'base64',
  )

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: payment.id,
      notes: { invoiceId: invoice.id, customerId: ctx.customerId },
    }),
  })

  if (!response.ok) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not start payment. Try again later.', 503)
  }

  const order = (await response.json()) as { id: string }

  await db
    .update(payments)
    .set({ gatewayReference: order.id, status: 'processing', updatedAt: new Date() })
    .where(eq(payments.id, payment.id))

  return {
    paymentId: payment.id,
    razorpay: {
      configured: true as const,
      keyId: serverEnv.razorpayKeyId,
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
    },
  }
}

export async function verifyRazorpayPayment(
  ctx: CustomerContext,
  input: {
    paymentId: string
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  },
) {
  if (!isRazorpayConfigured()) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Payments are not configured.', 503)
  }

  if (!verifyRazorpayCheckoutSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    throw new AppError('FORBIDDEN', 'Payment verification failed.', 403)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', 503)

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, input.paymentId), eq(payments.customerId, ctx.customerId)))
    .limit(1)

  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found.', 404)

  return finalizeSuccessfulPayment({
    paymentId: payment.id,
    razorpayPaymentId: input.razorpayPaymentId,
    actorUserId: ctx.userId,
    source: 'customer_verify',
  })
}

/** Resource ownership check for tests and routes. */
export async function customerOwnsInvoice(customerId: string, invoiceId: string) {
  const db = getDb()
  if (!db) return false
  const [row] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.customerId, customerId)))
    .limit(1)
  return Boolean(row)
}

export async function customerOwnsProject(customerId: string, projectId: string) {
  const db = getDb()
  if (!db) return false
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1)
  return Boolean(row)
}
