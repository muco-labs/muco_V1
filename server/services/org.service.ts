import { and, count, desc, eq, inArray, lt } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  employeeProfiles,
  permissions,
  productWaitlist,
  projectMembers,
  rolePermissions,
  roles,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { hasAnyRole, hasPermission } from '../lib/auth/permissions.js'
import { departmentLabel, normalizeDepartmentSlug } from '../lib/org/departments.js'
import { inferGrowthStage } from '../lib/org/growth-stages.js'
import type { UpdateEmployeeOrgInput } from '../lib/validation/employee-org.js'
import { getAdminDashboard, getIntegrationStatus } from './admin.service.js'
import { getRevenueDashboard, getSalesDashboard } from './sales.service.js'
import { PRIMARY_PRODUCT_SLUG } from '../lib/product/constants.js'

export function requireExecutiveAccess(auth: AuthContext) {
  if (hasAnyRole(auth.roles, 'FOUNDER', 'SUPER_ADMIN')) return
  if (
    hasPermission(auth.permissions, 'analytics.view') &&
    hasPermission(auth.permissions, 'settings.manage')
  ) {
    return
  }
  throw new AppError('FORBIDDEN', 'Executive overview is restricted.', 403)
}

export async function syncEmploymentStateForUserStatus(
  userId: string,
  status: string,
  actorUserId: string,
) {
  const db = getDb()
  if (!db) return

  const [profile] = await db
    .select({ id: employeeProfiles.id })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId))
    .limit(1)

  if (!profile) return

  if (status === 'disabled' || status === 'inactive') {
    await db
      .update(employeeProfiles)
      .set({ employmentState: 'offboarded', updatedAt: new Date() })
      .where(eq(employeeProfiles.id, profile.id))

    await db.insert(auditLogs).values({
      actorUserId,
      action: 'employee.offboarded',
      entity: 'employee_profiles',
      entityId: profile.id,
      metadata: JSON.stringify({ userId, status }),
    })
  }
}

export async function updateEmployeeOrg(
  actor: AuthContext,
  employeeId: string,
  input: UpdateEmployeeOrgInput,
) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.id, employeeId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Employee not found.', 404)

  if (input.managerEmployeeId === employeeId) {
    throw new AppError('VALIDATION_ERROR', 'An employee cannot be their own manager.', 400)
  }

  if (input.managerEmployeeId) {
    const [manager] = await db
      .select({ id: employeeProfiles.id })
      .from(employeeProfiles)
      .where(eq(employeeProfiles.id, input.managerEmployeeId))
      .limit(1)
    if (!manager) {
      throw new AppError('VALIDATION_ERROR', 'Manager not found.', 400)
    }
  }

  if (input.department !== undefined) {
    const normalized = normalizeDepartmentSlug(input.department)
    if (input.department.trim() && !normalized) {
      throw new AppError('VALIDATION_ERROR', 'Unknown department.', 400)
    }
  }

  const department =
    input.department !== undefined ? normalizeDepartmentSlug(input.department) : undefined

  const [updated] = await db
    .update(employeeProfiles)
    .set({
      ...(department !== undefined ? { department } : {}),
      ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle?.trim() || null } : {}),
      ...(input.managerEmployeeId !== undefined
        ? { managerEmployeeId: input.managerEmployeeId }
        : {}),
      ...(input.employmentState !== undefined ? { employmentState: input.employmentState } : {}),
      updatedAt: new Date(),
    })
    .where(eq(employeeProfiles.id, employeeId))
    .returning()

  await db.insert(auditLogs).values({
    actorUserId: actor.userId,
    action: 'employee.org_updated',
    entity: 'employee_profiles',
    entityId: employeeId,
    metadata: JSON.stringify({
      department: updated.department,
      employmentState: updated.employmentState,
      managerEmployeeId: updated.managerEmployeeId,
    }),
  })

  return updated
}

export async function getEmployeeAccessReview() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select({
      profile: employeeProfiles,
      user: users,
    })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .orderBy(desc(users.createdAt))

  const items = []
  for (const row of rows) {
    const roleRows = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, row.user.id))

    const permRows = await db
      .select({ name: permissions.name })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, row.user.id))

    const [projectCount] = await db
      .select({ c: count() })
      .from(projectMembers)
      .where(eq(projectMembers.employeeId, row.profile.id))

    const [openTasks] = await db
      .select({ c: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedEmployeeId, row.profile.id),
          inArray(tasks.status, ['todo', 'in_progress', 'blocked']),
        ),
      )

    items.push({
      employeeId: row.profile.id,
      userId: row.user.id,
      email: row.user.email,
      fullName: row.user.fullName,
      userStatus: row.user.status,
      department: row.profile.department,
      departmentLabel: departmentLabel(row.profile.department),
      jobTitle: row.profile.jobTitle,
      employmentState: row.profile.employmentState,
      managerEmployeeId: row.profile.managerEmployeeId,
      roles: roleRows.map((r) => r.name),
      permissions: [...new Set(permRows.map((p) => p.name))].sort(),
      projectCount: projectCount?.c ?? 0,
      openTaskCount: openTasks?.c ?? 0,
    })
  }

  return { items, count: items.length }
}

export async function getExecutiveOverview(auth: AuthContext) {
  requireExecutiveAccess(auth)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const dashboard = await getAdminDashboard()
  const sales = await getSalesDashboard(auth)
  const revenue = await getRevenueDashboard()

  const [activeEmployees] = await db
    .select({ c: count() })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .where(
      and(eq(employeeProfiles.employmentState, 'active'), inArray(users.status, ['active', 'invited'])),
    )

  const [waitlistCount] = await db
    .select({ c: count() })
    .from(productWaitlist)
    .where(eq(productWaitlist.productSlug, PRIMARY_PRODUCT_SLUG))

  const [overdueTasks] = await db
    .select({ c: count() })
    .from(tasks)
    .where(
      and(
        inArray(tasks.status, ['todo', 'in_progress', 'blocked']),
        lt(tasks.dueDate, new Date()),
      ),
    )

  const workloadRows = await db
    .select({
      employeeId: tasks.assignedEmployeeId,
      open: count(),
    })
    .from(tasks)
    .where(
      and(
        inArray(tasks.status, ['todo', 'in_progress', 'blocked']),
      ),
    )
    .groupBy(tasks.assignedEmployeeId)

  const growthStage = inferGrowthStage(Number(activeEmployees?.c ?? 0))
  const integrations = await getIntegrationStatus()

  return {
    generatedAt: new Date().toISOString(),
    growthStage,
    reporting: {
      actual: 'Collected from invoices/payments and CRM won deals.',
      pipeline: 'Open leads and non-accepted proposals — not recognized revenue.',
      forecast: 'Not computed in-app; use external planning.',
    },
    actual: {
      revenueSucceeded: dashboard.revenueSucceeded,
      outstandingInvoicesTotal: dashboard.outstandingInvoicesTotal,
      overdueInvoices: dashboard.overdueInvoices,
      customers: dashboard.customers,
      employees: dashboard.employees,
      wonDeals: sales.wonCount,
      wonRevenue: sales.wonRevenue,
      revenueMonth: revenue.revenueThisMonth,
      revenueQuarter: revenue.revenueThisQuarter,
      revenueYear: revenue.revenueThisYear,
    },
    pipeline: {
      newLeads: dashboard.leadsNew,
      qualifiedLeads: dashboard.qualifiedLeads,
      openOpportunities: sales.openOpportunities,
      pipelineProposalValue: sales.pipelineValue,
      pendingProposals: dashboard.pendingProposals,
    },
    delivery: {
      activeProjects: dashboard.activeProjects,
      openTasks: dashboard.openTasks,
      tasksDueSoon: dashboard.tasksDueSoon,
      overdueTasks: overdueTasks?.c ?? 0,
      openSupportTickets: dashboard.openSupportTickets,
      workloadByAssignee: workloadRows
        .filter((r) => r.employeeId)
        .map((r) => ({
          employeeId: r.employeeId,
          openTasks: r.open,
        })),
    },
    product: {
      clientHubWaitlist: waitlistCount?.c ?? 0,
    },
    integrations,
    recentActivity: dashboard.recentActivity,
  }
}
