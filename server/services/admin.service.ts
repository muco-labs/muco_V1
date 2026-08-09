import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { normalizeProposalCurrency } from '../lib/currency/constants.js'
import {
  auditLogs,
  customerProfiles,
  employeeProfiles,
  files,
  invoiceLineItems,
  invoices,
  leads,
  messages,
  notifications,
  payments,
  projectMembers,
  projects,
  proposals,
  proposalLineItems,
  roles,
  supportTickets,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission, roleCanAccessPortal } from '../lib/auth/permissions.js'
import { isDatabaseConfigured, isRazorpayConfigured, isRazorpayWebhookConfigured, isSupabaseConfigured, serverEnv } from '../lib/env.js'
import { sumProposalLineItems } from '../lib/sales/metrics.js'
import { emailConfigurationStatus, sendTransactionalEmail } from '../lib/email/send.js'

export function requireAdminPortal(auth: AuthContext) {
  if (!roleCanAccessPortal(auth.roles, 'admin')) {
    throw new AppError('FORBIDDEN', 'You do not have access to this area.', 403)
  }
}

export async function assertCanChangeUserStatus(actor: AuthContext, targetUserId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const targetRoles = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, targetUserId))

  const isFounderTarget = targetRoles.some((r) => r.name === 'FOUNDER')
  if (!isFounderTarget) return

  const actorIsFounder = actor.roles.includes('FOUNDER')
  if (!actorIsFounder) {
    throw new AppError('FORBIDDEN', 'Founder accounts cannot be modified by this user.', 403)
  }
}

export async function getAdminDashboard() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [leadCount] = await db.select({ c: count() }).from(leads).where(eq(leads.status, 'new'))
  const [qualifiedLeads] = await db
    .select({ c: count() })
    .from(leads)
    .where(eq(leads.status, 'qualified'))
  const [activeProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'active'))
  const [planningProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'draft'))
  const [onHoldProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'on_hold'))
  const [customerCount] = await db.select({ c: count() }).from(customerProfiles)
  const [employeeCount] = await db.select({ c: count() }).from(employeeProfiles)
  const [openSupport] = await db
    .select({ c: count() })
    .from(supportTickets)
    .where(inArray(supportTickets.status, ['open', 'in_progress', 'waiting']))
  const [outstanding] = await db
    .select({ total: sum(invoices.amount) })
    .from(invoices)
    .where(inArray(invoices.status, ['sent', 'partial', 'overdue']))
  const [paidTotal] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, 'succeeded'))
  const [pendingProposals] = await db
    .select({ c: count() })
    .from(proposals)
    .where(inArray(proposals.status, ['sent', 'viewed', 'changes_requested']))

  const [openTasks] = await db
    .select({ c: count() })
    .from(tasks)
    .where(inArray(tasks.status, ['todo', 'in_progress', 'blocked']))

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const [tasksDueSoon] = await db
    .select({ c: count() })
    .from(tasks)
    .where(
      and(
        inArray(tasks.status, ['todo', 'in_progress']),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, weekAhead),
      ),
    )

  const [overdueInvoices] = await db
    .select({ c: count() })
    .from(invoices)
    .where(eq(invoices.status, 'overdue'))

  const recentActivity = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(12)

  return {
    leadsNew: leadCount?.c ?? 0,
    qualifiedLeads: qualifiedLeads?.c ?? 0,
    activeProjects: activeProjects?.c ?? 0,
    planningProjects: planningProjects?.c ?? 0,
    onHoldProjects: onHoldProjects?.c ?? 0,
    customers: customerCount?.c ?? 0,
    employees: employeeCount?.c ?? 0,
    openSupportTickets: openSupport?.c ?? 0,
    outstandingInvoicesTotal: outstanding?.total ?? '0',
    revenueSucceeded: paidTotal?.total ?? '0',
    pendingProposals: pendingProposals?.c ?? 0,
    openTasks: openTasks?.c ?? 0,
    tasksDueSoon: tasksDueSoon?.c ?? 0,
    overdueInvoices: overdueInvoices?.c ?? 0,
    recentActivity,
  }
}

export async function getAdminAnalytics() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const leadByStatus = await db
    .select({ status: leads.status, c: count() })
    .from(leads)
    .groupBy(leads.status)

  const projectByStatus = await db
    .select({ status: projects.status, c: count() })
    .from(projects)
    .groupBy(projects.status)

  const invoiceByStatus = await db
    .select({ status: invoices.status, c: count() })
    .from(invoices)
    .groupBy(invoices.status)

  return { leadByStatus, projectByStatus, invoiceByStatus }
}

export function getIntegrationStatus() {
  return {
    supabase: { configured: isSupabaseConfigured() },
    database: { configured: isDatabaseConfigured() },
    razorpay: {
      configured: isRazorpayConfigured(),
      webhookConfigured: isRazorpayWebhookConfigured(),
    },
    email: emailConfigurationStatus(),
    cors: {
      configured: serverEnv.corsOrigins.length > 0,
      originCount: serverEnv.corsOrigins.length,
      note:
        'When empty, browsers use same-origin /api only (recommended for single-domain mucolabs.com). Set CORS_ORIGINS only for additional allowed origins.',
    },
    note: 'Secrets are stored server-side only and are never returned to the browser.',
  }
}

export async function listLeadsAdmin(query: { status?: string; q?: string; limit?: number; offset?: number }) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const limit = Math.min(query.limit ?? 50, 100)
  const offset = query.offset ?? 0
  const conditions = []
  if (query.status) conditions.push(eq(leads.status, query.status as typeof leads.status.enumValues[number]))
  if (query.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(or(ilike(leads.name, term), ilike(leads.email, term), ilike(leads.company, term))!)
  }
  return db
    .select()
    .from(leads)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.updatedAt))
    .limit(limit)
    .offset(offset)
}

export async function getLeadAdmin(id: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Lead not found.', 404)
  return row
}

export async function createLeadAdmin(
  actorUserId: string,
  input: {
    name: string
    email: string
    phone?: string
    company?: string
    serviceInterest?: string
    projectDescription: string
    source?: string
    budget?: string
    timeline?: string
    notes?: string
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .insert(leads)
    .values({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      serviceInterest: input.serviceInterest?.trim() || null,
      projectDescription: input.projectDescription.trim(),
      source: input.source?.trim() || 'admin',
      budget: input.budget?.trim() || null,
      timeline: input.timeline?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .returning()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'lead.created',
    entity: 'leads',
    entityId: row.id,
  })
  return row
}

export async function updateLeadAdmin(
  actorUserId: string,
  id: string,
  input: Partial<{
    status: string
    notes: string
    assignedEmployeeId: string | null
    followUpAt: string | null
  }>,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [updated] = await db
    .update(leads)
    .set({
      status: input.status as typeof leads.status.enumValues[number] | undefined,
      notes: input.notes,
      assignedEmployeeId: input.assignedEmployeeId,
      followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning()
  if (!updated) throw new AppError('NOT_FOUND', 'Lead not found.', 404)
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'lead.updated',
    entity: 'leads',
    entityId: id,
  })
  return updated
}

export async function listCustomersAdmin(q?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const rows = await db
    .select({
      profile: customerProfiles,
      user: users,
    })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(100)

  if (!q?.trim()) return rows
  const term = q.trim().toLowerCase()
  return rows.filter(
    (r) =>
      r.user.email.toLowerCase().includes(term) ||
      (r.user.fullName?.toLowerCase().includes(term) ?? false) ||
      (r.profile.companyName?.toLowerCase().includes(term) ?? false),
  )
}

export async function getCustomerAdmin(customerProfileId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .select({ profile: customerProfiles, user: users })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.id, customerProfileId))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Customer not found.', 404)

  const customerProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, customerProfileId))
  const customerInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.customerId, customerProfileId))
    .orderBy(desc(invoices.createdAt))
    .limit(20)

  return { ...row, projects: customerProjects, invoices: customerInvoices }
}

export async function listEmployeesAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db
    .select({
      profile: employeeProfiles,
      user: users,
    })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .orderBy(desc(users.createdAt))
}

export async function listProjectsAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db
    .select({
      project: projects,
      companyName: customerProfiles.companyName,
    })
    .from(projects)
    .innerJoin(customerProfiles, eq(projects.customerId, customerProfiles.id))
    .orderBy(desc(projects.updatedAt))
    .limit(100)
}

export async function createProjectAdmin(
  actorUserId: string,
  input: {
    customerId: string
    name: string
    description?: string
    status?: string
    startDate?: string
    expectedCompletion?: string
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .insert(projects)
    .values({
      customerId: input.customerId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: (input.status as 'draft' | 'active') ?? 'active',
      startDate: input.startDate ? new Date(input.startDate) : null,
      expectedCompletion: input.expectedCompletion ? new Date(input.expectedCompletion) : null,
    })
    .returning()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'project.created',
    entity: 'projects',
    entityId: row.id,
  })
  return row
}

export async function assignProjectMemberAdmin(
  actorUserId: string,
  projectId: string,
  employeeId: string,
  role: string,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  await db
    .insert(projectMembers)
    .values({ projectId, employeeId, role: role.trim() || 'member' })
    .onConflictDoNothing()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'project.member_assigned',
    entity: 'project_members',
    entityId: projectId,
    metadata: JSON.stringify({ employeeId, role }),
  })
}

export async function listTasksAdmin(query: { projectId?: string; limit?: number }) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const limit = Math.min(query.limit ?? 100, 200)
  if (query.projectId) {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, query.projectId))
      .orderBy(desc(tasks.updatedAt))
      .limit(limit)
  }
  return db.select().from(tasks).orderBy(desc(tasks.updatedAt)).limit(limit)
}

export async function createTaskAdmin(
  actorUserId: string,
  input: {
    projectId: string
    title: string
    description?: string
    assignedEmployeeId?: string
    priority?: string
    dueDate?: string
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .insert(tasks)
    .values({
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignedEmployeeId: input.assignedEmployeeId ?? null,
      priority: (input.priority as 'medium') ?? 'medium',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'task.created',
    entity: 'tasks',
    entityId: row.id,
  })
  return row
}

export async function updateTaskAdmin(
  actorUserId: string,
  taskId: string,
  input: Partial<{
    status: string
    priority: string
    assignedEmployeeId: string | null
    dueDate: string | null
  }>,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [updated] = await db
    .update(tasks)
    .set({
      status: input.status as typeof tasks.status.enumValues[number] | undefined,
      priority: input.priority as typeof tasks.priority.enumValues[number] | undefined,
      assignedEmployeeId: input.assignedEmployeeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning()
  if (!updated) throw new AppError('NOT_FOUND', 'Task not found.', 404)
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'task.updated',
    entity: 'tasks',
    entityId: taskId,
  })
  return updated
}

export async function listProposalsAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db.select().from(proposals).orderBy(desc(proposals.updatedAt)).limit(100)
}

export function requirePricingAuthority(auth: AuthContext) {
  const allowed = new Set(['FOUNDER', 'ADMIN', 'SUPER_ADMIN'])
  if (!auth.roles.some((r) => allowed.has(r))) {
    throw new AppError('FORBIDDEN', 'Pricing and discount approval requires admin.', 403)
  }
}

export async function createProposalAdmin(
  actorUserId: string,
  input: {
    customerId: string
    title?: string
    amount?: string
    scope?: string
    deliverables?: string
    timeline?: string
    terms?: string
    validUntil?: string
    projectId?: string
    leadId?: string
    paymentSchedule?: string
    currency?: string
    lineItems?: Array<{
      description: string
      quantity?: string
      unitAmount: string
      itemType?: string
    }>
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  let amount = input.amount ?? null
  const lineItems = input.lineItems?.filter((i) => i.description?.trim()) ?? []

  const [row] = await db
    .insert(proposals)
    .values({
      customerId: input.customerId,
      leadId: input.leadId ?? null,
      projectId: input.projectId ?? null,
      title: input.title?.trim() || 'Proposal',
      amount,
      currency: normalizeProposalCurrency(input.currency),
      scope: input.scope?.trim() || null,
      deliverables: input.deliverables?.trim() || null,
      timeline: input.timeline?.trim() || null,
      terms: input.terms?.trim() || null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      paymentSchedule: input.paymentSchedule?.trim() || null,
      status: 'draft',
    })
    .returning()

  if (lineItems.length > 0) {
    const inserted = await db
      .insert(proposalLineItems)
      .values(
        lineItems.map((item, index) => ({
          proposalId: row.id,
          description: item.description.trim(),
          quantity: item.quantity ?? '1',
          unitAmount: item.unitAmount,
          itemType: item.itemType ?? 'service',
          sortOrder: index,
        })),
      )
      .returning()
    amount = sumProposalLineItems(inserted)
    await db.update(proposals).set({ amount, updatedAt: new Date() }).where(eq(proposals.id, row.id))
    row.amount = amount
  }

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'proposal.created',
    entity: 'proposals',
    entityId: row.id,
  })
  return row
}

export async function approveProposalForSend(auth: AuthContext, proposalId: string) {
  requirePricingAuthority(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [updated] = await db
    .update(proposals)
    .set({
      approvedForSendAt: new Date(),
      approvedForSendBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, proposalId))
    .returning()
  if (!updated) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.approved_for_send',
    entity: 'proposals',
    entityId: proposalId,
  })
  return updated
}

export async function setProposalDiscount(
  auth: AuthContext,
  proposalId: string,
  input: { discountAmount: string; discountNote?: string },
) {
  requirePricingAuthority(auth)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const discount = Number(input.discountAmount)
  if (Number.isNaN(discount) || discount < 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid discount.', 400)
  }
  const [updated] = await db
    .update(proposals)
    .set({
      discountAmount: input.discountAmount,
      discountNote: input.discountNote?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(proposals.id, proposalId), eq(proposals.status, 'draft')))
    .returning()
  if (!updated) throw new AppError('CONFLICT', 'Discount can only be set on draft proposals.', 409)

  const lines = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
  if (lines.length > 0) {
    const amount = sumProposalLineItems(lines, input.discountAmount)
    await db.update(proposals).set({ amount, updatedAt: new Date() }).where(eq(proposals.id, proposalId))
    updated.amount = amount
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'proposal.discount_applied',
    entity: 'proposals',
    entityId: proposalId,
    metadata: JSON.stringify({ discountAmount: input.discountAmount }),
  })
  return updated
}

export async function sendProposalAdmin(actorUserId: string, proposalId: string, actorRoles: string[]) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)

  const pricingRoles = new Set(['FOUNDER', 'ADMIN', 'SUPER_ADMIN'])
  const canSendWithoutApproval = actorRoles.some((r) => pricingRoles.has(r))
  if (!canSendWithoutApproval && !existing.approvedForSendAt) {
    throw new AppError(
      'FORBIDDEN',
      'This proposal needs admin approval before it can be sent.',
      403,
    )
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: 'sent', updatedAt: new Date() })
    .where(and(eq(proposals.id, proposalId), eq(proposals.status, 'draft')))
    .returning()
  if (!updated) throw new AppError('CONFLICT', 'Proposal cannot be sent.', 409)
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'proposal.sent',
    entity: 'proposals',
    entityId: proposalId,
  })

  if (updated.customerId) {
    const [customerUser] = await db
      .select({ userId: customerProfiles.userId, email: users.email })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(eq(customerProfiles.id, updated.customerId))
      .limit(1)
    if (customerUser?.userId) {
      await db.insert(notifications).values({
        userId: customerUser.userId,
        type: 'proposal.sent',
        title: 'New proposal',
        message: `Proposal "${updated.title ?? 'Proposal'}" is ready for your review.`,
      })
      if (customerUser.email) {
        await sendTransactionalEmail('proposal_sent', customerUser.email, {
          title: updated.title ?? 'Proposal',
        })
      }
    }
  }

  return updated
}

export async function listInvoicesAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(100)
}

export async function createInvoiceAdmin(
  actorUserId: string,
  input: {
    customerId: string
    projectId?: string
    invoiceNumber: string
    amount: string
    dueDate?: string
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .insert(invoices)
    .values({
      customerId: input.customerId,
      projectId: input.projectId ?? null,
      invoiceNumber: input.invoiceNumber.trim(),
      amount: input.amount,
      status: 'draft',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'invoice.created',
    entity: 'invoices',
    entityId: row.id,
  })
  return row
}

export async function createInvoiceWithLineItemsAdmin(
  actorUserId: string,
  input: {
    customerId: string
    projectId?: string
    proposalId?: string
    invoiceNumber: string
    dueDate?: string
    lineItems: Array<{ description: string; quantity: string; unitAmount: string }>
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  if (input.lineItems.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one line item is required.', 400)
  }

  const total = input.lineItems.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unitAmount),
    0,
  )

  const [row] = await db
    .insert(invoices)
    .values({
      customerId: input.customerId,
      projectId: input.projectId ?? null,
      proposalId: input.proposalId ?? null,
      invoiceNumber: input.invoiceNumber.trim(),
      amount: total.toFixed(2),
      status: 'draft',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning()

  await db.insert(invoiceLineItems).values(
    input.lineItems.map((line, index) => ({
      invoiceId: row.id,
      description: line.description.trim(),
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      sortOrder: index,
    })),
  )

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'invoice.created',
    entity: 'invoices',
    entityId: row.id,
    metadata: JSON.stringify({ lineItemCount: input.lineItems.length }),
  })

  return row
}

export async function issueInvoiceAdmin(actorUserId: string, invoiceId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [updated] = await db
    .update(invoices)
    .set({ status: 'sent', updatedAt: new Date() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.status, 'draft')))
    .returning()
  if (!updated) throw new AppError('CONFLICT', 'Invoice cannot be issued.', 409)
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'invoice.sent',
    entity: 'invoices',
    entityId: invoiceId,
  })

  const [customerUser] = await db
    .select({ userId: customerProfiles.userId, email: users.email })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.id, updated.customerId))
    .limit(1)

  if (customerUser?.userId) {
    await db.insert(notifications).values({
      userId: customerUser.userId,
      type: 'invoice.issued',
      title: 'Invoice issued',
      message: `Invoice ${updated.invoiceNumber} is ready in your portal.`,
    })
    if (customerUser.email) {
      await sendTransactionalEmail('invoice_issued', customerUser.email, {
        invoiceNumber: updated.invoiceNumber,
      })
    }
  }

  return updated
}

export async function listPaymentsAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100)
}

export async function listSupportAdmin() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt)).limit(100)
}

export async function updateSupportAdmin(
  actorUserId: string,
  ticketId: string,
  input: { status?: string; priority?: string },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [updated] = await db
    .update(supportTickets)
    .set({
      status: input.status as typeof supportTickets.status.enumValues[number] | undefined,
      priority: input.priority as typeof supportTickets.priority.enumValues[number] | undefined,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId))
    .returning()
  if (!updated) throw new AppError('NOT_FOUND', 'Ticket not found.', 404)
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'support.updated',
    entity: 'support_tickets',
    entityId: ticketId,
  })
  return updated
}

export async function listAuditLogsAdmin(limit = 100) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(Math.min(limit, 200))
}

export async function listAutomationAuditLogs(limit = 80) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  return db
    .select()
    .from(auditLogs)
    .where(
      or(
        ilike(auditLogs.action, 'automation.%'),
        ilike(auditLogs.action, 'payment.%'),
        eq(auditLogs.action, 'project.created_from_proposal'),
        eq(auditLogs.action, 'proposal.sent'),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(limit, 150))
}

export async function listFilesAdmin(projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  if (projectId) {
    return db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.createdAt))
      .limit(100)
  }
  return db.select().from(files).orderBy(desc(files.createdAt)).limit(100)
}

export async function listMessagesAdmin(projectId?: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  if (projectId) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt))
      .limit(100)
  }
  return db.select().from(messages).orderBy(desc(messages.createdAt)).limit(100)
}

export async function adminSearch(q: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const term = `%${q.trim()}%`
  if (!q.trim()) return { leads: [], customers: [], projects: [] }

  const leadHits = await db
    .select({ id: leads.id, label: leads.name, type: sql<string>`'lead'` })
    .from(leads)
    .where(or(ilike(leads.name, term), ilike(leads.email, term)))
    .limit(10)

  const projectHits = await db
    .select({ id: projects.id, label: projects.name, type: sql<string>`'project'` })
    .from(projects)
    .where(ilike(projects.name, term))
    .limit(10)

  return { leads: leadHits, projects: projectHits, customers: [] as Array<{ id: string; label: string }> }
}

export function requireFinancialPermission(auth: AuthContext) {
  if (
    !hasPermission(auth.permissions, 'invoices.view') &&
    !hasPermission(auth.permissions, 'payments.view')
  ) {
    throw new AppError('FORBIDDEN', 'Financial access is not permitted.', 403)
  }
}
