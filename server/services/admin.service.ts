import { and, count, desc, eq, ilike, inArray, or, sql, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  employeeProfiles,
  files,
  invoices,
  leads,
  messages,
  payments,
  projectMembers,
  projects,
  proposals,
  roles,
  supportTickets,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission, roleCanAccessPortal } from '../lib/auth/permissions.js'
import { isDatabaseConfigured, isRazorpayConfigured, isSupabaseConfigured } from '../lib/env.js'

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
  const [activeProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'active'))
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

  const recentActivity = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(12)

  return {
    leadsNew: leadCount?.c ?? 0,
    activeProjects: activeProjects?.c ?? 0,
    customers: customerCount?.c ?? 0,
    employees: employeeCount?.c ?? 0,
    openSupportTickets: openSupport?.c ?? 0,
    outstandingInvoicesTotal: outstanding?.total ?? '0',
    revenueSucceeded: paidTotal?.total ?? '0',
    pendingProposals: pendingProposals?.c ?? 0,
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
    razorpay: { configured: isRazorpayConfigured() },
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

export async function createProposalAdmin(
  actorUserId: string,
  input: {
    customerId: string
    title?: string
    amount?: string
    scope?: string
    projectId?: string
  },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const [row] = await db
    .insert(proposals)
    .values({
      customerId: input.customerId,
      projectId: input.projectId ?? null,
      title: input.title?.trim() || 'Proposal',
      amount: input.amount ?? null,
      scope: input.scope?.trim() || null,
      status: 'draft',
    })
    .returning()
  await db.insert(auditLogs).values({
    actorUserId,
    action: 'proposal.created',
    entity: 'proposals',
    entityId: row.id,
  })
  return row
}

export async function sendProposalAdmin(actorUserId: string, proposalId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
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
