import { and, eq, inArray, ilike, or } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  freelancerProfiles,
  freelancerServices,
  freelancerSkills,
  projectFreelancers,
  projects,
  roles,
  tasks,
  userRoles,
  users,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { presentFreelancerPricingTypeLabel, isFreelancerPricingType } from '../lib/freelancers/freelancer-pricing.js'
import { canFreelancerPublishActiveOfferings, formatFreelancerReference } from '../lib/freelancers/freelancer-status.js'
import { isFreelancerOpenForNewAssignments, presentFreelancerAvailabilityLabel } from '../lib/freelancers/freelancer-availability.js'
import {
  buildDiscoveryReasons,
  compareDiscoveryCandidates,
  normalizeProjectServiceToSlug,
  resolveDiscoveryMatchTier,
} from '../lib/freelancers/freelancer-discovery.js'
import {
  isMucoServiceSlug,
  labelMucoService,
  resolveSkillSlug,
} from '../lib/freelancers/muco-service-catalog.js'
import { assertProjectsPermission } from './project-delivery.service.js'
import { computeFreelancerWorkloadSummariesBatch } from './freelancer-workload.service.js'

export type DiscoverFreelancersInput = {
  service?: string
  skill?: string
  projectId?: string
  taskId?: string
  q?: string
  availability?: 'available' | 'limited'
  pricingType?: string
  page?: number
  limit?: number
}

function assertDiscoverPermission(auth: AuthContext) {
  if (!hasPermission(auth.permissions, 'freelancers.view')) {
    throw new AppError('FORBIDDEN', 'You cannot discover freelancers.', 403)
  }
}

async function loadUserRoleNames(userIds: string[]): Promise<Map<string, string[]>> {
  const db = getDb()
  const map = new Map<string, string[]>()
  if (!db || !userIds.length) return map

  const rows = await db
    .select({ userId: userRoles.userId, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(inArray(userRoles.userId, userIds))

  for (const row of rows) {
    const list = map.get(row.userId) ?? []
    list.push(row.name)
    map.set(row.userId, list)
  }
  return map
}

function serviceRowEffective(
  row: { isActive: boolean },
  approvalStatus: string,
): boolean {
  return row.isActive && canFreelancerPublishActiveOfferings(approvalStatus)
}

export async function discoverFreelancersAdmin(auth: AuthContext, input: DiscoverFreelancersInput) {
  assertDiscoverPermission(auth)

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const page = input.page ?? 1
  const limit = Math.min(input.limit ?? 25, 50)
  const q = input.q?.trim().toLowerCase()

  let projectId = input.projectId
  let taskContext: {
    id: string
    title: string
    assignedFreelancerId: string | null
    assignedEmployeeId: string | null
    status: string
  } | null = null

  if (input.taskId) {
    const [taskRow] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        assignedFreelancerId: tasks.assignedFreelancerId,
        assignedEmployeeId: tasks.assignedEmployeeId,
        status: tasks.status,
      })
      .from(tasks)
      .where(eq(tasks.id, input.taskId))
      .limit(1)
    if (!taskRow) throw new AppError('NOT_FOUND', 'Task not found.', 404)
    if (projectId && projectId !== taskRow.projectId) {
      throw new AppError('VALIDATION_ERROR', 'Task does not belong to this project.', 400)
    }
    projectId = taskRow.projectId
    taskContext = taskRow
  }

  let projectContext: {
    id: string
    name: string
    service: string | null
    status: string
  } | null = null

  if (projectId) {
    assertProjectsPermission(auth, 'projects.view')
    const [projectRow] = await db
      .select({
        id: projects.id,
        name: projects.name,
        service: projects.service,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
    if (!projectRow) throw new AppError('NOT_FOUND', 'Project not found.', 404)
    projectContext = projectRow
  }

  const explicitService = input.service?.trim()
  const derivedService = projectContext ? normalizeProjectServiceToSlug(projectContext.service) : null
  const requiredServiceSlug =
    explicitService && isMucoServiceSlug(explicitService)
      ? explicitService
      : derivedService

  if (explicitService && !isMucoServiceSlug(explicitService)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown service slug.', 400)
  }

  const skillSlug = input.skill?.trim() || null
  if (skillSlug && requiredServiceSlug && !resolveSkillSlug(requiredServiceSlug, skillSlug)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown skill for this service.', 400)
  }

  if (input.pricingType && !isFreelancerPricingType(input.pricingType)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid pricing type filter.', 400)
  }

  const profileConditions = [
    eq(freelancerProfiles.approvalStatus, 'approved'),
    eq(freelancerProfiles.verificationStatus, 'verified'),
  ]

  if (input.availability === 'available') {
    profileConditions.push(eq(freelancerProfiles.availabilityStatus, 'available'))
  } else if (input.availability === 'limited') {
    profileConditions.push(eq(freelancerProfiles.availabilityStatus, 'limited'))
  }

  if (q) {
    const pattern = `%${q}%`
    profileConditions.push(
      or(
        ilike(freelancerProfiles.fullName, pattern),
        ilike(freelancerProfiles.professionalRole, pattern),
      )!,
    )
  }

  const profileRows = await db
    .select({
      freelancerId: freelancerProfiles.id,
      userId: freelancerProfiles.userId,
      fullName: freelancerProfiles.fullName,
      professionalRole: freelancerProfiles.professionalRole,
      approvalStatus: freelancerProfiles.approvalStatus,
      availabilityStatus: freelancerProfiles.availabilityStatus,
      openToProjects: freelancerProfiles.openToProjects,
      userStatus: users.status,
    })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(and(...profileConditions))

  const userIds = profileRows.map((r) => r.userId).filter((id): id is string => Boolean(id))
  const roleMap = await loadUserRoleNames(userIds)

  const eligibleProfiles = profileRows.filter((row) => {
    if (!row.userId) return false
    if (!row.openToProjects) return false
    if (!isFreelancerOpenForNewAssignments(row.availabilityStatus)) return false
    const roles = roleMap.get(row.userId) ?? []
    if (!roles.includes('FREELANCER') || roles.includes('CUSTOMER')) return false
    if (row.userStatus && !['active', 'invited'].includes(row.userStatus)) return false
    return true
  })

  const eligibleIds = eligibleProfiles.map((r) => r.freelancerId)
  if (!eligibleIds.length) {
    return {
      context: buildResponseContext(projectContext, taskContext, requiredServiceSlug, skillSlug),
      items: [],
      page,
      limit,
      total: 0,
    }
  }

  const serviceConditions = [
    inArray(freelancerServices.freelancerId, eligibleIds),
    eq(freelancerServices.isActive, true),
  ]
  if (requiredServiceSlug) {
    serviceConditions.push(eq(freelancerServices.serviceSlug, requiredServiceSlug))
  }
  if (input.pricingType) {
    serviceConditions.push(eq(freelancerServices.pricingType, input.pricingType as never))
  }

  const serviceRows = await db
    .select()
    .from(freelancerServices)
    .where(and(...serviceConditions))

  const skillsByFreelancer = new Map<string, Set<string>>()
  if (skillSlug && requiredServiceSlug) {
    const skillRows = await db
      .select({
        freelancerId: freelancerSkills.freelancerId,
        skillSlug: freelancerSkills.skillSlug,
        serviceSlug: freelancerSkills.serviceSlug,
      })
      .from(freelancerSkills)
      .where(
        and(
          inArray(freelancerSkills.freelancerId, eligibleIds),
          eq(freelancerSkills.serviceSlug, requiredServiceSlug),
        ),
      )
    for (const row of skillRows) {
      const set = skillsByFreelancer.get(row.freelancerId) ?? new Set()
      set.add(row.skillSlug)
      skillsByFreelancer.set(row.freelancerId, set)
    }
  }

  const servicesByFreelancer = new Map<string, typeof serviceRows>()
  for (const row of serviceRows) {
    const profile = eligibleProfiles.find((p) => p.freelancerId === row.freelancerId)
    if (!profile || !serviceRowEffective(row, profile.approvalStatus)) continue
    const list = servicesByFreelancer.get(row.freelancerId) ?? []
    list.push(row)
    servicesByFreelancer.set(row.freelancerId, list)
  }

  const skillRequired = Boolean(skillSlug && requiredServiceSlug)

  let candidateProfiles = eligibleProfiles.filter((p) => {
    const offerings = servicesByFreelancer.get(p.freelancerId)
    if (!offerings?.length) return false
    if (skillRequired) {
      const skills = skillsByFreelancer.get(p.freelancerId)
      return skills?.has(skillSlug!) ?? false
    }
    return true
  })

  if (!requiredServiceSlug && !q && candidateProfiles.length === 0) {
    return {
      context: buildResponseContext(projectContext, taskContext, null, skillSlug),
      items: [],
      page,
      limit,
      total: 0,
      hint: 'Select a MUCO service or enter a search term to discover freelancers.',
    }
  }

  if (!requiredServiceSlug && q) {
    candidateProfiles = eligibleProfiles.filter((p) => servicesByFreelancer.has(p.freelancerId))
  }

  const candidateIds = candidateProfiles.map((p) => p.freelancerId)
  const workloadMap = await computeFreelancerWorkloadSummariesBatch(candidateIds)

  const projectMembership = new Map<string, string>()
  if (projectId && candidateIds.length) {
    const memberRows = await db
      .select({
        freelancerId: projectFreelancers.freelancerId,
        role: projectFreelancers.role,
      })
      .from(projectFreelancers)
      .where(
        and(
          eq(projectFreelancers.projectId, projectId),
          inArray(projectFreelancers.freelancerId, candidateIds),
        ),
      )
    for (const row of memberRows) projectMembership.set(row.freelancerId, row.role)
  }

  const items = candidateProfiles.map((profile) => {
    const offerings = servicesByFreelancer.get(profile.freelancerId) ?? []
    const matchedService =
      requiredServiceSlug != null
        ? offerings.find((o) => o.serviceSlug === requiredServiceSlug) ?? offerings[0]
        : offerings[0]

    const serviceMatch = Boolean(
      requiredServiceSlug && offerings.some((o) => o.serviceSlug === requiredServiceSlug),
    )
    const skillMatch = skillRequired
      ? (skillsByFreelancer.get(profile.freelancerId)?.has(skillSlug!) ?? false)
      : null

    const workload = workloadMap.get(profile.freelancerId) ?? {
      activeProjectCount: 0,
      activeTaskCount: 0,
      overdueTaskCount: 0,
      blockedTaskCount: 0,
    }

    const onProject = projectMembership.has(profile.freelancerId)
    const currentTaskAssignee =
      taskContext?.assignedFreelancerId === profile.freelancerId
    const taskHasOtherFreelancer = Boolean(
      taskContext?.assignedFreelancerId &&
        taskContext.assignedFreelancerId !== profile.freelancerId,
    )
    const taskHasEmployeeAssignee = Boolean(taskContext?.assignedEmployeeId)

    const matchTier = resolveDiscoveryMatchTier({
      serviceMatch,
      skillRequired,
      skillMatch: skillMatch ?? false,
    })

    const reasons = buildDiscoveryReasons({
      serviceMatch,
      skillRequired,
      skillMatch: skillMatch ?? false,
      availabilityStatus: profile.availabilityStatus,
      activeTaskCount: workload.activeTaskCount,
      overdueTaskCount: workload.overdueTaskCount,
      blockedTaskCount: workload.blockedTaskCount,
      onProject,
      currentTaskAssignee,
      taskHasOtherAssignee: taskHasOtherFreelancer,
    })

    return {
      freelancerId: profile.freelancerId,
      reference: formatFreelancerReference(profile.freelancerId),
      displayName: profile.fullName,
      professionalRole: profile.professionalRole,
      approvalStatus: profile.approvalStatus,
      availabilityStatus: profile.availabilityStatus,
      availabilityStatusLabel: presentFreelancerAvailabilityLabel(profile.availabilityStatus),
      matchTier,
      serviceMatch,
      skillMatch,
      matchSummary:
        matchTier === 'service_and_skill'
          ? 'Strong service/skill match'
          : matchTier === 'service_only'
            ? 'Service match'
            : 'Search match',
      reasons,
      workload,
      pricing: matchedService
        ? {
            pricingType: matchedService.pricingType,
            pricingTypeLabel: presentFreelancerPricingTypeLabel(matchedService.pricingType),
            basePrice: matchedService.basePrice,
            currency: matchedService.currency,
            serviceSlug: matchedService.serviceSlug,
            serviceTitle: labelMucoService(matchedService.serviceSlug),
          }
        : null,
      assignment: {
        onProject,
        projectRole: projectMembership.get(profile.freelancerId) ?? null,
        currentTaskAssignee,
        canAssignToProject: !onProject,
        canAssignToTask:
          onProject &&
          !currentTaskAssignee &&
          !taskHasOtherFreelancer &&
          !taskHasEmployeeAssignee,
      },
      _sort: {
        matchTier,
        availabilityStatus: profile.availabilityStatus,
        activeTaskCount: workload.activeTaskCount,
        displayName: profile.fullName,
      },
    }
  })

  items.sort((a, b) => compareDiscoveryCandidates(a._sort, b._sort))

  const total = items.length
  const start = (page - 1) * limit
  const pageItems = items.slice(start, start + limit).map(({ _sort, ...rest }) => rest)

  return {
    context: buildResponseContext(projectContext, taskContext, requiredServiceSlug, skillSlug),
    items: pageItems,
    page,
    limit,
    total,
  }
}

function buildResponseContext(
  project: { id: string; name: string; service: string | null; status: string } | null,
  task: {
    id: string
    title: string
    status: string
    assignedFreelancerId: string | null
    assignedEmployeeId: string | null
  } | null,
  serviceSlug: string | null,
  skillSlug: string | null,
) {
  return {
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    projectStatus: project?.status ?? null,
    projectServiceRaw: project?.service ?? null,
    derivedServiceSlug: serviceSlug,
    derivedServiceTitle: serviceSlug ? labelMucoService(serviceSlug) : null,
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? null,
    taskStatus: task?.status ?? null,
    taskAssigneeFreelancerId: task?.assignedFreelancerId ?? null,
    taskAssigneeEmployeeId: task?.assignedEmployeeId ?? null,
    skillSlug,
    skillLabel:
      serviceSlug && skillSlug ? resolveSkillSlug(serviceSlug, skillSlug)?.label ?? null : null,
  }
}
