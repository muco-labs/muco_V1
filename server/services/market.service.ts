import { and, count, desc, eq, inArray, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { leads, proposals } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { erodeLeadCondition, indiaLeadCondition, tamilNaduLeadCondition } from '../lib/market/conditions.js'
import { isFullCrmAccessor, getEmployeeProfileId } from './crm.service.js'
import type { AuthContext } from '../middleware/authenticate.js'

async function marketLeadScope(auth: AuthContext) {
  if (isFullCrmAccessor(auth)) return undefined
  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) throw new AppError('FORBIDDEN', 'You do not have access.', 403)
  return eq(leads.assignedEmployeeId, employeeId)
}

async function segmentCounts(auth: AuthContext, condition: ReturnType<typeof erodeLeadCondition>) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await marketLeadScope(auth)
  const base = scope ? and(scope, condition) : condition

  const [totalLeads] = await db.select({ c: count() }).from(leads).where(base)
  const [qualified] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(base, inArray(leads.status, ['qualified', 'discovery', 'proposal', 'negotiation'])))
  const [won] = await db.select({ c: count() }).from(leads).where(and(base, eq(leads.status, 'won')))

  const [pipelineValue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(and(base, inArray(proposals.status, ['sent', 'viewed', 'changes_requested', 'accepted'])))

  return {
    totalLeads: totalLeads?.c ?? 0,
    qualifiedLeads: qualified?.c ?? 0,
    wonLeads: won?.c ?? 0,
    pipelineValue: pipelineValue?.total ?? null,
  }
}

export async function getNationalMarketDashboard(auth: AuthContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await marketLeadScope(auth)
  const indiaCond = indiaLeadCondition()
  const base = scope ? and(scope, indiaCond) : indiaCond

  const erode = await segmentCounts(auth, erodeLeadCondition())
  const tamilNadu = await segmentCounts(auth, tamilNaduLeadCondition())
  const india = await segmentCounts(auth, indiaCond)

  const stateRowsFiltered = await db
    .select({ state: leads.businessState, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.businessState)
    .orderBy(desc(count()))

  const cityRows = await db
    .select({ city: leads.businessCity, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.businessCity)
    .orderBy(desc(count()))
    .limit(12)

  const serviceRows = await db
    .select({ service: leads.serviceInterest, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.serviceInterest)
    .orderBy(desc(count()))

  const recent = await db
    .select({
      id: leads.id,
      name: leads.name,
      status: leads.status,
      serviceInterest: leads.serviceInterest,
      businessCity: leads.businessCity,
      businessState: leads.businessState,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(base)
    .orderBy(desc(leads.createdAt))
    .limit(12)

  return {
    label: 'actual' as const,
    attributionNote:
      'India segment uses voluntary city/state, /india, /tamil-nadu, /erode paths, or explicit page context — not IP geolocation.',
    segments: {
      erode,
      tamilNadu,
      india,
    },
    topStates: stateRowsFiltered
      .filter((r) => r.state?.trim())
      .slice(0, 10)
      .map((r) => ({ state: r.state as string, count: Number(r.c) })),
    topCities: cityRows
      .filter((r) => r.city?.trim())
      .map((r) => ({ city: r.city as string, count: Number(r.c) })),
    byService: serviceRows
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, count: Number(r.c) })),
    recentLeads: recent,
  }
}
