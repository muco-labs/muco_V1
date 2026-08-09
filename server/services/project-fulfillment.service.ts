import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  leadActivities,
  leads,
  notifications,
  projects,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { formatProjectRequestReference } from '../lib/intake/project-request-reference.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import { formatProposalReference } from '../lib/proposals/proposal-reference.js'
import {
  canCreateProjectFromLead,
  presentCustomerProjectStatus,
  PROJECT_FULFILLMENT_STATUSES,
  type ProjectFulfillmentStatus,
} from '../lib/projects/project-fulfillment.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasPermission } from '../lib/auth/permissions.js'
import { recordLeadActivity, assertCanAccessLead } from './crm.service.js'
import { getProjectDeliveryAdminExtras, updateProjectStatusWithDeliveryRules } from './project-delivery.service.js'

function assertProjectsPermission(auth: AuthContext, permission: 'projects.view' | 'projects.create' | 'projects.update') {
  if (!hasPermission(auth.permissions, permission)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to manage projects.', 403)
  }
}

export function serializeCustomerProjectSummary(project: typeof projects.$inferSelect) {
  const presentation = presentCustomerProjectStatus(project.status)
  return {
    id: project.id,
    reference: formatProjectReference(project.id),
    name: project.name,
    description: project.description,
    service: project.service,
    status: project.status,
    statusLabel: presentation.label,
    nextStep: presentation.nextStep,
    startDate: project.startDate?.toISOString() ?? null,
    expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
    updatedAt: project.updatedAt.toISOString(),
    sourceRequestReference: project.leadId
      ? formatProjectRequestReference(project.leadId)
      : null,
    proposalReference: project.proposalId ? formatProposalReference(project.proposalId) : null,
  }
}

export async function getProjectForLeadId(leadId: string) {
  const db = getDb()
  if (!db) return null
  const [row] = await db.select().from(projects).where(eq(projects.leadId, leadId)).limit(1)
  return row ?? null
}

export async function createProjectFromLeadCrm(auth: AuthContext, leadId: string) {
  assertProjectsPermission(auth, 'projects.create')
  await assertCanAccessLead(auth, leadId)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  if (!lead) throw new AppError('NOT_FOUND', 'Lead not found.', 404)

  const eligibility = canCreateProjectFromLead({
    status: lead.status,
    customerId: lead.customerId,
  })
  if (!eligibility.ok) {
    throw new AppError('VALIDATION_ERROR', eligibility.reason, 400)
  }

  const existing = await getProjectForLeadId(leadId)
  if (existing) {
    return {
      alreadyExists: true as const,
      project: mapAdminProject(existing),
    }
  }

  const name =
    lead.company?.trim() ||
    `${lead.name.trim()}${lead.serviceInterest ? ` — ${lead.serviceInterest}` : ''}`

  const [row] = await db
    .insert(projects)
    .values({
      customerId: lead.customerId!,
      leadId: lead.id,
      name: name.slice(0, 200),
      description: lead.projectDescription?.trim() || null,
      service: lead.serviceInterest?.trim() || null,
      status: 'draft',
      startDate: new Date(),
      expectedCompletion: null,
    })
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: auth.userId,
    action: 'project.created',
    entity: 'projects',
    entityId: row.id,
    metadata: JSON.stringify({ leadId, reference: formatProjectReference(row.id) }),
  })

  await recordLeadActivity(leadId, 'project.created', auth.userId, {
    projectId: row.id,
    reference: formatProjectReference(row.id),
  })

  await notifyAdminsProjectCreated(row.name, formatProjectReference(row.id))

  return {
    alreadyExists: false as const,
    project: mapAdminProject(row),
  }
}

async function notifyAdminsProjectCreated(name: string, reference: string) {
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
      type: 'projects.created',
      title: 'Project created',
      message: `${reference} · ${name}`,
    })),
  )
}

function mapAdminProject(row: typeof projects.$inferSelect) {
  return {
    ...row,
    reference: formatProjectReference(row.id),
    sourceRequestReference: row.leadId ? formatProjectRequestReference(row.leadId) : null,
    proposalReference: row.proposalId ? formatProposalReference(row.proposalId) : null,
    startDate: row.startDate?.toISOString() ?? null,
    expectedCompletion: row.expectedCompletion?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listProjectsFulfillmentAdmin(
  auth: AuthContext,
  query?: { status?: string; q?: string },
) {
  assertProjectsPermission(auth, 'projects.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (
    query?.status &&
    PROJECT_FULFILLMENT_STATUSES.includes(query.status as ProjectFulfillmentStatus)
  ) {
    conditions.push(eq(projects.status, query.status as ProjectFulfillmentStatus))
  }
  if (query?.q?.trim()) {
    const term = `%${query.q.trim()}%`
    conditions.push(or(ilike(projects.name, term), ilike(projects.service, term))!)
  }

  const rows = await db
    .select({
      project: projects,
      companyName: customerProfiles.companyName,
    })
    .from(projects)
    .innerJoin(customerProfiles, eq(projects.customerId, customerProfiles.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(projects.updatedAt))
    .limit(100)

  return rows.map((r) => ({
    ...mapAdminProject(r.project),
    companyName: r.companyName,
  }))
}

export async function getProjectFulfillmentAdmin(auth: AuthContext, projectId: string) {
  assertProjectsPermission(auth, 'projects.view')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({
      project: projects,
      companyName: customerProfiles.companyName,
      customerUserId: users.id,
      customerEmail: users.email,
      customerName: users.fullName,
    })
    .from(projects)
    .innerJoin(customerProfiles, eq(projects.customerId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  let sourceLead = null
  if (row.project.leadId) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, row.project.leadId)).limit(1)
    if (lead) {
      sourceLead = {
        id: lead.id,
        reference: formatProjectRequestReference(lead.id),
        status: lead.status,
        serviceInterest: lead.serviceInterest,
        budget: lead.budget,
        timeline: lead.timeline,
        projectDescription: lead.projectDescription,
        customerRequestReference: formatProjectRequestReference(lead.id),
      }
    }
  }

  const activities = row.project.leadId
    ? await db
        .select()
        .from(leadActivities)
        .where(
          and(
            eq(leadActivities.leadId, row.project.leadId),
            inArray(leadActivities.action, ['project.created', 'project.status_changed']),
          ),
        )
        .orderBy(desc(leadActivities.createdAt))
        .limit(20)
    : []

  const delivery = await getProjectDeliveryAdminExtras(auth, projectId)

  return {
    project: mapAdminProject(row.project),
    customer: {
      id: row.project.customerId,
      companyName: row.companyName,
      contactName: row.customerName,
      email: row.customerEmail,
    },
    sourceLead,
    activities,
    ...delivery,
  }
}

export async function updateProjectFulfillmentAdmin(
  auth: AuthContext,
  projectId: string,
  input: { status?: ProjectFulfillmentStatus; name?: string; description?: string },
) {
  assertProjectsPermission(auth, 'projects.update')
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!existing) throw new AppError('NOT_FOUND', 'Project not found.', 404)

  if (input.status && input.status !== existing.status) {
    await updateProjectStatusWithDeliveryRules(auth, projectId, input.status)
  }

  const patch: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() }
  if (input.name?.trim()) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description?.trim() || null

  const hasMetaChange = Boolean(input.name?.trim()) || input.description !== undefined
  if (hasMetaChange) {
    const [updated] = await db.update(projects).set(patch).where(eq(projects.id, projectId)).returning()
    return mapAdminProject(updated)
  }

  const [fresh] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!fresh) throw new AppError('NOT_FOUND', 'Project not found.', 404)
  return mapAdminProject(fresh)
}
