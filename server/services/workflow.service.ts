import { and, count, desc, eq, gte, inArray, lt, lte, sum } from 'drizzle-orm'
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
import { WORKFLOW_AUDIT_ACTIONS } from '../lib/workflow/business-rules.js'
import { recordAutomationEvent } from '../lib/workflow/automation-log.js'
import {
  getProjectTemplate,
  isProjectTemplateId,
  type ProjectTemplateId,
} from '../lib/workflow/project-templates.js'
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
      await sendTransactionalEmail('project_started', customerUser.email, { title: project.name })
    }
  }

  await recordAutomationEvent({
    actorUserId,
    action: WORKFLOW_AUDIT_ACTIONS.projectFromProposal,
    entity: 'projects',
    entityId: project.id,
    result: 'success',
    metadata: { proposalId, created: true },
  })

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

  const [customerUser] = await db
    .select({ userId: customerProfiles.userId })
    .from(customerProfiles)
    .where(eq(customerProfiles.id, updated.customerId))
    .limit(1)
  if (customerUser?.userId) {
    await db.insert(notifications).values({
      userId: customerUser.userId,
      type: 'project.completed',
      title: 'Project completed',
      message: `Your project "${updated.name}" has been marked complete.`,
    })
  }

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

export async function applyProjectTemplate(
  actorUserId: string,
  projectId: string,
  templateId: string,
) {
  if (!isProjectTemplateId(templateId)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown project template.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  const [existing] = await db
    .select({ c: count() })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
  if ((existing?.c ?? 0) > 0) {
    throw new AppError(
      'CONFLICT',
      'This project already has milestones. Templates apply only to empty project plans.',
      409,
    )
  }

  const template = getProjectTemplate(templateId as ProjectTemplateId)
  let milestoneCount = 0
  let taskCount = 0

  await db.transaction(async (tx) => {
    let sortOrder = 0
    for (const step of template.milestones) {
      const [milestone] = await tx
        .insert(milestones)
        .values({
          projectId,
          name: step.name,
          description: step.description ?? null,
          status: 'planned',
          sortOrder,
        })
        .returning({ id: milestones.id })
      sortOrder += 1
      milestoneCount += 1

      if (step.tasks?.length) {
        for (const title of step.tasks) {
          await tx.insert(tasks).values({
            projectId,
            milestoneId: milestone.id,
            title,
            status: 'todo',
            priority: 'medium',
          })
          taskCount += 1
        }
      }
    }

    await tx
      .update(projects)
      .set({ updatedAt: new Date(), operationalPhase: 'planning' })
      .where(eq(projects.id, projectId))
  })

  await db.insert(auditLogs).values({
    actorUserId,
    action: WORKFLOW_AUDIT_ACTIONS.projectTemplateApplied,
    entity: 'projects',
    entityId: projectId,
    metadata: JSON.stringify({ templateId, milestoneCount, taskCount }),
  })

  await recordAutomationEvent({
    actorUserId,
    action: WORKFLOW_AUDIT_ACTIONS.projectTemplateApplied,
    entity: 'projects',
    entityId: projectId,
    result: 'success',
    metadata: { templateId, milestoneCount, taskCount },
  })

  return { templateId, milestoneCount, taskCount }
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

  const [qualifiedLeads] = await db
    .select({ c: count() })
    .from(leads)
    .where(eq(leads.status, 'qualified'))

  const [pendingProposals] = await db
    .select({ c: count() })
    .from(proposals)
    .where(inArray(proposals.status, ['sent', 'viewed', 'changes_requested']))

  const atRiskProjects = await db
    .selectDistinct({ projectId: tasks.projectId })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.status, 'active'),
        inArray(tasks.status, ['todo', 'in_progress', 'blocked']),
        lt(tasks.dueDate, now),
      ),
    )

  return {
    openLeads: openLeads?.c ?? 0,
    qualifiedLeads: qualifiedLeads?.c ?? 0,
    pendingProposals: pendingProposals?.c ?? 0,
    activeProjects: activeProjects?.c ?? 0,
    completedProjects: completedProjects?.c ?? 0,
    projectsAtRisk: atRiskProjects.length,
    outstandingInvoicesTotal: outstanding?.total ?? '0',
    overdueInvoices: overdueCount?.c ?? 0,
    revenueSucceeded: revenue?.total ?? '0',
    openSupportTickets: openSupport?.c ?? 0,
    openTasks: openTasks?.c ?? 0,
    tasksDueSoon: tasksDueSoon?.c ?? 0,
  }
}
