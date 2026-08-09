import { and, asc, desc, eq, max } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  employeeProfiles,
  milestones,
  payments,
  projectMembers,
  projects,
  proposalLineItems,
  proposals,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { formatProposalReference } from '../lib/proposals/proposal-reference.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import {
  canResumeProjectDelivery,
  canStartProjectDelivery,
  canTransitionProjectStatus,
  CUSTOMER_VISIBLE_PROJECT_AUDIT_ACTIONS,
  isTerminalProjectStatus,
} from '../lib/projects/project-delivery.js'
import {
  canTransitionMilestoneStatus,
  computeMilestoneProgressPercent,
  countOverdueMilestones,
  customerOverdueWording,
  milestoneDueHint,
  pickCurrentMilestone,
  pickNextMilestone,
  presentCustomerMilestoneStatus,
  sortMilestonesForDelivery,
  type MilestoneDeliveryStatus,
} from '../lib/projects/milestone-delivery.js'
import { PROJECT_FULFILLMENT_STATUSES, presentCustomerProjectStatus, type ProjectFulfillmentStatus } from '../lib/projects/project-fulfillment.js'
import { resolveProposalPayableTotal } from '../lib/payments/proposal-payment.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { recordLeadActivity } from './crm.service.js'
import { notifyCustomerProjectUpdate, notifyProjectDeliveryEvent } from './project-delivery-notify.js'

export async function resolvePaymentReadinessForProposal(proposal: {
  id: string
  customerId: string | null
}) {
  if (!proposal.customerId) {
    return {
      paymentRequired: false,
      paymentVerified: true,
      proposalReference: formatProposalReference(proposal.id),
      blockedReason: null as string | null,
    }
  }
  return resolveProjectPaymentReadiness({
    id: '',
    proposalId: proposal.id,
    customerId: proposal.customerId,
  })
}

function assertProjectAllowsMilestoneMutation(projectStatus: string) {
  if (isTerminalProjectStatus(projectStatus)) {
    throw new AppError('CONFLICT', 'Milestones cannot be changed on a completed or cancelled project.', 409)
  }
}

export async function enrichCustomerProjectListDelivery(
  _project: typeof projects.$inferSelect,
  milestoneRows: Array<typeof milestones.$inferSelect>,
) {
  const sorted = sortMilestonesForDelivery(milestoneRows)
  const current = pickCurrentMilestone(sorted)
  const next = pickNextMilestone(sorted, current)
  const progressPercent = computeMilestoneProgressPercent(sorted)
  const overdueCount = countOverdueMilestones(sorted)

  return {
    progressPercent,
    overdueCount,
    currentMilestone: current
      ? {
          name: current.name,
          statusLabel: presentCustomerMilestoneStatus(current.status),
          dueDate: current.dueDate?.toISOString() ?? null,
          dueHint: milestoneDueHint(current.dueDate, current.status),
          overdueNote: customerOverdueWording(milestoneDueHint(current.dueDate, current.status)),
        }
      : null,
    nextMilestone: next
      ? {
          name: next.name,
          statusLabel: presentCustomerMilestoneStatus(next.status),
          dueDate: next.dueDate?.toISOString() ?? null,
        }
      : null,
    milestonesSummary:
      sorted.length === 0 ? ('none' as const) : progressPercent === 100 ? ('complete' as const) : ('in_progress' as const),
  }
}

export function deriveAdminNextDeliveryAction(input: {
  projectStatus: string
  canStart: boolean
  paymentVerified: boolean
  paymentRequired: boolean
  overdueCount: number
  milestoneCount: number
}): string {
  if (isTerminalProjectStatus(input.projectStatus)) {
    return 'No delivery actions — project is closed.'
  }
  if (input.canStart) {
    return input.paymentRequired && !input.paymentVerified
      ? 'Waiting for verified customer payment before start.'
      : 'Start delivery when the team is ready.'
  }
  if (input.projectStatus === 'on_hold') {
    return 'Resume the project when work can continue.'
  }
  if (input.milestoneCount === 0) {
    return 'Add milestones to plan delivery.'
  }
  if (input.overdueCount > 0) {
    return `${input.overdueCount} milestone(s) overdue — review and update status.`
  }
  return 'Advance milestones and keep the customer updated.'
}

export async function reorderProjectMilestoneAdmin(
  auth: AuthContext,
  projectId: string,
  milestoneId: string,
  direction: 'up' | 'down',
) {
  assertProjectsPermission(auth, 'projects.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  assertProjectAllowsMilestoneMutation(project.status)

  const rows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sortOrder))

  const index = rows.findIndex((m) => m.id === milestoneId)
  if (index < 0) throw new AppError('NOT_FOUND', 'Milestone not found on this project.', 404)

  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= rows.length) {
    return rows.map(serializeMilestoneAdmin)
  }

  const a = rows[index]
  const b = rows[swapIndex]
  await db.transaction(async (tx) => {
    await tx.update(milestones).set({ sortOrder: b.sortOrder, updatedAt: new Date() }).where(eq(milestones.id, a.id))
    await tx.update(milestones).set({ sortOrder: a.sortOrder, updatedAt: new Date() }).where(eq(milestones.id, b.id))
  })

  await recordProjectAudit(auth.userId, projectId, 'milestone.reordered', {
    milestoneId,
    direction,
  })

  const refreshed = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sortOrder))

  return refreshed.map(serializeMilestoneAdmin)
}

export function assertProjectsPermission(auth: AuthContext, permission: 'projects.view' | 'projects.update') {
  if (!hasPermission(auth.permissions, permission)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to manage projects.', 403)
  }
}

export async function resolveProjectPaymentReadiness(project: {
  id: string
  proposalId: string | null
  customerId: string
}) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  if (!project.proposalId) {
    return {
      paymentRequired: false,
      paymentVerified: true,
      proposalReference: null as string | null,
      blockedReason: null as string | null,
    }
  }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, project.proposalId))
    .limit(1)

  if (!proposal) {
    return {
      paymentRequired: false,
      paymentVerified: true,
      proposalReference: null,
      blockedReason: null,
    }
  }

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposal.id))

  const payable = resolveProposalPayableTotal(proposal, lineItems)
  const proposalReference = formatProposalReference(proposal.id)

  if (!payable) {
    return {
      paymentRequired: false,
      paymentVerified: true,
      proposalReference,
      blockedReason: null,
    }
  }

  const [paid] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.proposalId, proposal.id),
        eq(payments.status, 'succeeded'),
      ),
    )
    .limit(1)

  if (paid) {
    return {
      paymentRequired: true,
      paymentVerified: true,
      proposalReference,
      blockedReason: null,
    }
  }

  return {
    paymentRequired: true,
    paymentVerified: false,
    proposalReference,
    blockedReason: 'Verified payment is required before delivery can start for this proposal.',
  }
}

export async function loadProjectDeliveryContext(projectId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  return row
}

export async function listProjectMilestonesAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  await loadProjectDeliveryContext(projectId)
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sortOrder), asc(milestones.dueDate))

  return rows.map((m) => ({
    ...m,
    dueDate: m.dueDate?.toISOString() ?? null,
    completedAt: m.completedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    dueHint: milestoneDueHint(m.dueDate, m.status),
  }))
}

export async function listProjectMembersAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select({
      role: projectMembers.role,
      employeeId: employeeProfiles.id,
      jobTitle: employeeProfiles.jobTitle,
      fullName: users.fullName,
    })
    .from(projectMembers)
    .innerJoin(employeeProfiles, eq(projectMembers.employeeId, employeeProfiles.id))
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  return rows.map((r) => ({
    employeeId: r.employeeId,
    role: r.role,
    displayName: r.fullName ?? r.jobTitle ?? 'Team member',
  }))
}

export async function getProjectDeliveryAdminExtras(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  const project = await loadProjectDeliveryContext(projectId)
  const payment = await resolveProjectPaymentReadiness(project)
  const milestoneRows = await listProjectMilestonesAdmin(auth, projectId)
  const members = await listProjectMembersAdmin(auth, projectId)
  const progressPercent = computeMilestoneProgressPercent(milestoneRows)

  const db = getDb()
  let proposal = null
  if (db && project.proposalId) {
    const [p] = await db.select().from(proposals).where(eq(proposals.id, project.proposalId)).limit(1)
    if (p) {
      proposal = {
        id: p.id,
        reference: formatProposalReference(p.id),
        title: p.title,
        status: p.status,
      }
    }
  }

  const timeline = await listProjectAuditTimeline(projectId, false)
  const overdueCount = countOverdueMilestones(
    milestoneRows.map((m) => ({ status: String(m.status), dueDate: m.dueDate ? new Date(m.dueDate) : null })),
  )
  const current = pickCurrentMilestone(
    milestoneRows.map((m) => ({
      status: String(m.status),
      sortOrder: Number(m.sortOrder),
      dueDate: m.dueDate ? new Date(m.dueDate) : null,
      name: String(m.name),
    })),
  )
  const canStart =
    canStartProjectDelivery(project.status) && (!payment.paymentRequired || payment.paymentVerified)

  const { enrichDeliveryWithTaskProgress } = await import('./project-tasks.service.js')
  const taskEnriched = await enrichDeliveryWithTaskProgress(
    projectId,
    milestoneRows,
    progressPercent,
  )

  return {
    payment,
    proposal,
    milestones: taskEnriched.milestones,
    members,
    progressPercent: taskEnriched.progressPercent,
    overdueCount,
    currentMilestone: current ? { name: current.name, status: current.status } : null,
    nextDeliveryAction: deriveAdminNextDeliveryAction({
      projectStatus: project.status,
      canStart,
      paymentVerified: payment.paymentVerified,
      paymentRequired: payment.paymentRequired,
      overdueCount,
      milestoneCount: milestoneRows.length,
    }),
    canStart,
    canResume: canResumeProjectDelivery(project.status),
    timeline,
  }
}

export async function startProjectDeliveryAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.update')
  const project = await loadProjectDeliveryContext(projectId)

  if (!canStartProjectDelivery(project.status)) {
    throw new AppError('CONFLICT', 'Only planning projects can be started.', 409)
  }

  const payment = await resolveProjectPaymentReadiness(project)
  if (payment.paymentRequired && !payment.paymentVerified) {
    throw new AppError('VALIDATION_ERROR', payment.blockedReason ?? 'Payment required.', 400)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const now = new Date()
  const [updated] = await db
    .update(projects)
    .set({
      status: 'active',
      startDate: project.startDate ?? now,
      updatedAt: now,
    })
    .where(eq(projects.id, projectId))
    .returning()

  await recordProjectAudit(auth.userId, projectId, 'project.started', { from: project.status, to: 'active' })
  if (project.leadId) {
    await recordLeadActivity(project.leadId, 'project.started', auth.userId, {
      projectId,
      reference: formatProjectReference(projectId),
    })
  }

  await notifyCustomerProjectUpdate(project.customerId, {
    title: 'Project started',
    message: `Delivery has started for ${updated.name}.`,
    type: 'project.started',
  })

  return updated
}

export async function updateProjectStatusWithDeliveryRules(
  auth: AuthContext,
  projectId: string,
  status: ProjectFulfillmentStatus,
) {
  assertProjectsPermission(auth, 'projects.update')
  if (!PROJECT_FULFILLMENT_STATUSES.includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid project status.', 400)
  }

  const project = await loadProjectDeliveryContext(projectId)
  if (!canTransitionProjectStatus(project.status, status)) {
    throw new AppError('VALIDATION_ERROR', `Cannot change status from ${project.status} to ${status}.`, 400)
  }

  if (status === 'active' && project.status === 'draft') {
    return startProjectDeliveryAdmin(auth, projectId)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(projects)
    .set({
      status,
      ...(status === 'completed' ? { operationalPhase: 'completed' } : {}),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning()

  await recordProjectAudit(auth.userId, projectId, 'project.status_changed', {
    from: project.status,
    to: status,
  })

  if (project.leadId) {
    await recordLeadActivity(project.leadId, 'project.status_changed', auth.userId, {
      projectId,
      from: project.status,
      to: status,
    })
  }

  const customerMessage =
    status === 'on_hold'
      ? `Your project "${updated.name}" is on hold. Contact us if you have questions.`
      : status === 'active' && project.status === 'on_hold'
        ? `Work has resumed on your project "${updated.name}".`
        : status === 'completed'
          ? `Your project "${updated.name}" has been marked complete.`
          : null

  if (customerMessage) {
    await notifyCustomerProjectUpdate(project.customerId, {
      title: 'Project update',
      message: customerMessage,
      type: `project.${status}`,
    })
  }

  if (status === 'completed') {
    await recordProjectAudit(auth.userId, projectId, 'project.completed', {})
  }

  return updated
}

export async function createProjectMilestoneAdmin(
  auth: AuthContext,
  projectId: string,
  input: { name: string; description?: string; dueDate?: string; sortOrder?: number },
) {
  assertProjectsPermission(auth, 'projects.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  assertProjectAllowsMilestoneMutation(project.status)

  const name = input.name.trim()
  if (name.length < 2) throw new AppError('VALIDATION_ERROR', 'Milestone name is required.', 400)

  let sortOrder = input.sortOrder
  if (sortOrder === undefined) {
    const [row] = await db
      .select({ maxOrder: max(milestones.sortOrder) })
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
    sortOrder = (row?.maxOrder ?? -1) + 1
  }

  const dueDate = input.dueDate ? new Date(input.dueDate) : null
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Invalid due date.', 400)
  }

  const [row] = await db
    .insert(milestones)
    .values({
      projectId,
      name,
      description: input.description?.trim() || null,
      status: 'planned',
      sortOrder,
      dueDate,
    })
    .returning()

  await recordProjectAudit(auth.userId, projectId, 'milestone.created', {
    milestoneId: row.id,
    name: row.name,
  })

  return serializeMilestoneAdmin(row)
}

export async function updateProjectMilestoneAdmin(
  auth: AuthContext,
  milestoneId: string,
  input: {
    name?: string
    description?: string | null
    dueDate?: string | null
    sortOrder?: number
    status?: MilestoneDeliveryStatus
  },
) {
  assertProjectsPermission(auth, 'projects.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(milestones).where(eq(milestones.id, milestoneId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Milestone not found.', 404)

  const [project] = await db.select().from(projects).where(eq(projects.id, existing.projectId)).limit(1)
  if (!project) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  assertProjectAllowsMilestoneMutation(project.status)

  const patch: Partial<typeof milestones.$inferInsert> = { updatedAt: new Date() }
  if (input.name?.trim()) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description?.trim() || null
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder
  if (input.dueDate !== undefined) {
    if (input.dueDate === null) patch.dueDate = null
    else {
      const d = new Date(input.dueDate)
      if (Number.isNaN(d.getTime())) throw new AppError('VALIDATION_ERROR', 'Invalid due date.', 400)
      patch.dueDate = d
    }
  }

  if (input.status) {
    if (!canTransitionMilestoneStatus(existing.status, input.status)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid milestone status transition.', 400)
    }
    patch.status = input.status
    if (input.status === 'completed') {
      patch.completedAt = new Date()
    } else if (existing.status === 'completed') {
      patch.completedAt = null
    }
  }

  const [updated] = await db.update(milestones).set(patch).where(eq(milestones.id, milestoneId)).returning()

  if (input.status && input.status !== existing.status) {
    const auditAction =
      input.status === 'in_progress'
        ? 'milestone.started'
        : input.status === 'completed'
          ? 'milestone.completed'
          : 'milestone.status_changed'
    await recordProjectAudit(auth.userId, existing.projectId, auditAction, {
      milestoneId,
      from: existing.status,
      to: input.status,
      name: updated.name,
    })

    const [projectRow] = await db.select().from(projects).where(eq(projects.id, existing.projectId)).limit(1)
    if (projectRow && input.status === 'completed') {
      await notifyCustomerProjectUpdate(projectRow.customerId, {
        title: 'Milestone completed',
        message: `Milestone "${updated.name}" is complete on ${projectRow.name}.`,
        type: 'milestone.completed',
      })
    }
    if (projectRow && input.status === 'in_progress') {
      await notifyCustomerProjectUpdate(projectRow.customerId, {
        title: 'Milestone in progress',
        message: `Work has started on milestone "${updated.name}" for ${projectRow.name}.`,
        type: 'milestone.started',
      })
    }
  }

  return serializeMilestoneAdmin(updated)
}

function serializeMilestoneAdmin(row: typeof milestones.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    status: row.status,
    sortOrder: row.sortOrder,
    dueDate: row.dueDate?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    dueHint: milestoneDueHint(row.dueDate, row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function serializeCustomerMilestone(row: typeof milestones.$inferSelect) {
  const dueHint = milestoneDueHint(row.dueDate, row.status)
  return {
    key: `${row.sortOrder}-${row.name}`,
    name: row.name,
    description: row.description,
    status: row.status,
    statusLabel: presentCustomerMilestoneStatus(row.status),
    dueDate: row.dueDate?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    dueHint,
    overdueNote: customerOverdueWording(dueHint),
    sortOrder: row.sortOrder,
  }
}

export async function recordProjectAudit(
  actorUserId: string | null,
  projectId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  const db = getDb()
  if (!db) return
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    entity: 'projects',
    entityId: projectId,
    metadata: JSON.stringify(metadata),
  })
}

export async function listProjectAuditTimeline(projectId: string, customerVisibleOnly: boolean) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entity, 'projects'), eq(auditLogs.entityId, projectId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(customerVisibleOnly ? 30 : 50)

  const filtered = customerVisibleOnly
    ? rows.filter((r) => CUSTOMER_VISIBLE_PROJECT_AUDIT_ACTIONS.has(r.action))
    : rows

  return filtered.map((r) => ({
    action: r.action,
    createdAt: r.createdAt.toISOString(),
    metadata: r.metadata ? safeParseJson(r.metadata) : null,
  }))
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function enrichCustomerProjectDetail(
  project: typeof projects.$inferSelect,
  milestoneRows: Array<typeof milestones.$inferSelect>,
) {
  const payment = await resolveProjectPaymentReadiness(project)
  const sorted = sortMilestonesForDelivery(milestoneRows)
  const current = pickCurrentMilestone(sorted)
  const next = pickNextMilestone(sorted, current)
  const progressPercent = computeMilestoneProgressPercent(sorted)
  const overdueCount = countOverdueMilestones(sorted)

  let proposalReference: string | null = null
  if (project.proposalId) {
    proposalReference = formatProposalReference(project.proposalId)
  }

  const activities = await listProjectAuditTimeline(project.id, true)
  const lastUpdate = activities[0] ?? null

  let customerNextAction: string | null = null
  if (isTerminalProjectStatus(project.status)) {
    customerNextAction = presentCustomerProjectStatus(project.status).nextStep
  } else if (project.status === 'draft') {
    customerNextAction = payment.paymentRequired && !payment.paymentVerified
      ? 'Complete payment for your accepted proposal to unlock delivery.'
      : 'Your project is being prepared for delivery.'
  } else if (current) {
    customerNextAction =
      milestoneDueHint(current.dueDate, current.status) === 'overdue'
        ? `Current milestone: ${current.name}. Your team is working through the updated timeline.`
        : `Current milestone: ${current.name}.`
  } else if (sorted.length === 0) {
    customerNextAction = 'Milestones will appear as your project progresses.'
  }

  return {
    paymentReadiness: payment,
    proposalReference,
    progressPercent,
    overdueCount,
    currentMilestone: current ? serializeCustomerMilestone(current) : null,
    nextMilestone: next ? serializeCustomerMilestone(next) : null,
    lastUpdate,
    customerNextAction,
    activities,
  }
}

export { notifyProjectDeliveryEvent }
