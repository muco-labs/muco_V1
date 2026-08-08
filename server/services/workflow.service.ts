import { and, count, desc, eq, inArray, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  invoices,
  leadActivities,
  leads,
  milestones,
  notifications,
  payments,
  projects,
  proposals,
  supportTickets,
  tasks,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { roleCanAccessPortal } from '../lib/auth/permissions.js'
import { PROJECT_OPERATIONAL_PHASES } from '../lib/workflow/constants.js'
import { recordLeadActivity } from './crm.service.js'
import { syncOverdueInvoices } from './payment.service.js'
import { sendTransactionalEmail } from '../lib/email/send.js'

export async function requireAdminOperations(auth: AuthContext) {
  if (!roleCanAccessPortal(auth.roles, 'admin')) {
    throw new AppError('FORBIDDEN', 'Admin access required.', 403)
  }
}

export function computeProjectProgressFromTasks(
  taskRows: Array<{ status: string }>,
  milestoneRows: Array<{ status: string }>,
): number | null {
  const total = taskRows.length + milestoneRows.length
  if (total === 0) return null
  const doneTasks = taskRows.filter((t) => t.status === 'done').length
  const doneMilestones = milestoneRows.filter((m) => m.status === 'completed').length
  return Math.round(((doneTasks + doneMilestones) / total) * 100)
}

export async function getProjectProgress(projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)
  const taskRows = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.projectId, projectId))
  const milestoneRows = await db
    .select({ status: milestones.status })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
  return computeProjectProgressFromTasks(taskRows, milestoneRows)
}

export async function createProjectFromProposal(
  actorUserId: string,
  proposalId: string,
  input?: { name?: string; operationalPhase?: string },
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1)
  if (!proposal) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)
  if (proposal.status !== 'accepted') {
    throw new AppError('CONFLICT', 'Project can only be created from an accepted proposal.', 409)
  }
  if (!proposal.customerId) {
    throw new AppError('VALIDATION_ERROR', 'Proposal has no customer.', 400)
  }

  if (proposal.projectId) {
    const [existing] = await db.select().from(projects).where(eq(projects.id, proposal.projectId)).limit(1)
    if (existing) {
      return { project: existing, created: false as const }
    }
  }

  const phase = input?.operationalPhase ?? 'discovery'
  if (!PROJECT_OPERATIONAL_PHASES.includes(phase as (typeof PROJECT_OPERATIONAL_PHASES)[number])) {
    throw new AppError('VALIDATION_ERROR', 'Invalid project phase.', 400)
  }

  const [project] = await db
    .insert(projects)
    .values({
      customerId: proposal.customerId,
      name: input?.name?.trim() || proposal.title || 'New project',
      description: proposal.scope ?? proposal.deliverables ?? null,
      status: 'active',
      service: proposal.title ?? null,
      operationalPhase: phase,
      leadId: proposal.leadId,
      proposalId: proposal.id,
    })
    .returning()

  await db
    .update(proposals)
    .set({ projectId: project.id, updatedAt: new Date() })
    .where(eq(proposals.id, proposalId))

  if (proposal.leadId) {
    await recordLeadActivity(proposal.leadId, 'project.created_from_proposal', actorUserId, {
      projectId: project.id,
      proposalId,
    })
  }

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'project.created_from_proposal',
    entity: 'projects',
    entityId: project.id,
    metadata: JSON.stringify({ proposalId, leadId: proposal.leadId }),
  })

  const [customerUser] = await db
    .select({ userId: customerProfiles.userId, email: users.email })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.id, proposal.customerId))
    .limit(1)

  if (customerUser?.userId) {
    await db.insert(notifications).values({
      userId: customerUser.userId,
      type: 'project.created',
      title: 'Project started',
      message: `Your project "${project.name}" has been created.`,
    })
    if (customerUser.email) {
      await sendTransactionalEmail('proposal_sent', customerUser.email, { title: project.name })
    }
  }

  return { project, created: true as const }
}

export async function completeProjectWorkflow(actorUserId: string, projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  const openTasks = await db
    .select({ c: count() })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), inArray(tasks.status, ['todo', 'in_progress', 'blocked'])))
  if ((openTasks[0]?.c ?? 0) > 0) {
    throw new AppError('CONFLICT', 'Complete or reassign open tasks before closing the project.', 409)
  }

  const [updated] = await db
    .update(projects)
    .set({
      status: 'completed',
      operationalPhase: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId,
    action: 'project.completed',
    entity: 'projects',
    entityId: projectId,
  })

  return updated
}

export async function getProjectBusinessTimeline(projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const audit = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entity, 'projects'),
        eq(auditLogs.entityId, projectId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(50)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  let leadEvents: Array<typeof leadActivities.$inferSelect> = []
  if (project?.leadId) {
    leadEvents = await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, project.leadId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(30)
  }

  return { audit, leadActivities: leadEvents }
}

export async function getOperationsReport() {
  await syncOverdueInvoices()
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [openLeads] = await db
    .select({ c: count() })
    .from(leads)
    .where(inArray(leads.status, ['new', 'contacted', 'qualified', 'discovery', 'proposal', 'negotiation']))

  const [activeProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'active'))

  const [completedProjects] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.status, 'completed'))

  const [outstanding] = await db
    .select({ total: sum(invoices.amount) })
    .from(invoices)
    .where(inArray(invoices.status, ['sent', 'partial', 'overdue']))

  const [overdueCount] = await db
    .select({ c: count() })
    .from(invoices)
    .where(eq(invoices.status, 'overdue'))

  const [revenue] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, 'succeeded'))

  const [openSupport] = await db
    .select({ c: count() })
    .from(supportTickets)
    .where(inArray(supportTickets.status, ['open', 'in_progress', 'waiting']))

  const [openTasks] = await db
    .select({ c: count() })
    .from(tasks)
    .where(inArray(tasks.status, ['todo', 'in_progress', 'blocked']))

  return {
    openLeads: openLeads?.c ?? 0,
    activeProjects: activeProjects?.c ?? 0,
    completedProjects: completedProjects?.c ?? 0,
    outstandingInvoicesTotal: outstanding?.total ?? '0',
    overdueInvoices: overdueCount?.c ?? 0,
    revenueSucceeded: revenue?.total ?? '0',
    openSupportTickets: openSupport?.c ?? 0,
    openTasks: openTasks?.c ?? 0,
  }
}
