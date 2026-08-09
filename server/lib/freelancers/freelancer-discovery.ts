import { INTAKE_SERVICE_SLUGS, INTAKE_SERVICE_TITLES } from '../intake/service-slugs.js'
import { isMucoServiceSlug } from './muco-service-catalog.js'

/** Active tasks at or above this count add a "High current workload" reason (deterministic, documented). */
export const DISCOVERY_HIGH_ACTIVE_TASK_THRESHOLD = 8

export type DiscoveryMatchTier = 'service_and_skill' | 'service_only' | 'search_only'

export function normalizeProjectServiceToSlug(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  if (isMucoServiceSlug(trimmed)) return trimmed
  const lower = trimmed.toLowerCase()
  if (isMucoServiceSlug(lower)) return lower
  const hyphenated = lower.replace(/\s+/g, '-')
  if (isMucoServiceSlug(hyphenated)) return hyphenated
  for (const slug of INTAKE_SERVICE_SLUGS) {
    if (INTAKE_SERVICE_TITLES[slug].toLowerCase() === lower) return slug
  }
  return null
}

export function resolveDiscoveryMatchTier(input: {
  serviceMatch: boolean
  skillRequired: boolean
  skillMatch: boolean
}): DiscoveryMatchTier {
  if (input.serviceMatch && input.skillRequired && input.skillMatch) return 'service_and_skill'
  if (input.serviceMatch) return 'service_only'
  return 'search_only'
}

export function buildDiscoveryReasons(input: {
  serviceMatch: boolean
  skillRequired: boolean
  skillMatch: boolean
  availabilityStatus: string
  activeTaskCount: number
  overdueTaskCount: number
  blockedTaskCount: number
  onProject: boolean
  currentTaskAssignee: boolean
  taskHasOtherAssignee: boolean
}): string[] {
  const reasons: string[] = []
  if (input.serviceMatch && input.skillRequired && input.skillMatch) {
    reasons.push('Service + skill match')
  } else if (input.serviceMatch) {
    reasons.push('Service match')
  }
  if (input.availabilityStatus === 'limited') reasons.push('Limited availability')
  if (input.onProject) reasons.push('Already on project')
  if (input.currentTaskAssignee) reasons.push('Currently assigned')
  if (input.taskHasOtherAssignee) reasons.push('Task assigned to another freelancer')
  if (input.overdueTaskCount > 0) reasons.push('Overdue tasks on workload')
  if (input.blockedTaskCount > 0) reasons.push('Blocked tasks on workload')
  if (input.activeTaskCount >= DISCOVERY_HIGH_ACTIVE_TASK_THRESHOLD) {
    reasons.push('High current workload')
  }
  return reasons
}

const tierRank: Record<DiscoveryMatchTier, number> = {
  service_and_skill: 0,
  service_only: 1,
  search_only: 2,
}

const availabilityRank: Record<string, number> = {
  available: 0,
  limited: 1,
}

export type DiscoverySortableCandidate = {
  matchTier: DiscoveryMatchTier
  availabilityStatus: string
  activeTaskCount: number
  displayName: string
}

export function compareDiscoveryCandidates(
  a: DiscoverySortableCandidate,
  b: DiscoverySortableCandidate,
): number {
  const tierDiff = tierRank[a.matchTier] - tierRank[b.matchTier]
  if (tierDiff !== 0) return tierDiff
  const availDiff =
    (availabilityRank[a.availabilityStatus] ?? 9) - (availabilityRank[b.availabilityStatus] ?? 9)
  if (availDiff !== 0) return availDiff
  if (a.activeTaskCount !== b.activeTaskCount) return a.activeTaskCount - b.activeTaskCount
  return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
}
