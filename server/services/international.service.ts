import { and, count, desc, eq, inArray, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { leads, proposals } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import {
  internationalLeadCondition,
  tier1MarketLeadCondition,
} from '../lib/market/conditions.js'
import { TIER1_MARKET_COUNTRY_HINTS, type Tier1MarketId } from '../lib/market/constants.js'
import { isFullCrmAccessor, getEmployeeProfileId } from './crm.service.js'
import type { AuthContext } from '../middleware/authenticate.js'

async function marketLeadScope(auth: AuthContext) {
  if (isFullCrmAccessor(auth)) return undefined
  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) throw new AppError('FORBIDDEN', 'You do not have access.', 403)
  return eq(leads.assignedEmployeeId, employeeId)
}

async function segmentMetrics(auth: AuthContext, condition: ReturnType<typeof internationalLeadCondition>) {
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

export async function getInternationalMarketDashboard(auth: AuthContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await marketLeadScope(auth)
  const intlCond = internationalLeadCondition()
  const base = scope ? and(scope, intlCond) : intlCond

  const overall = await segmentMetrics(auth, intlCond)

  const tier1: Record<string, Awaited<ReturnType<typeof segmentMetrics>>> = {}
  for (const market of Object.keys(TIER1_MARKET_COUNTRY_HINTS) as Tier1MarketId[]) {
    tier1[market] = await segmentMetrics(auth, tier1MarketLeadCondition(market))
  }

  const countryRows = await db
    .select({ country: leads.businessCountry, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.businessCountry)
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
      businessCountry: leads.businessCountry,
      contactTimezone: leads.contactTimezone,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(base)
    .orderBy(desc(leads.createdAt))
    .limit(12)

  return {
    label: 'actual' as const,
    attributionNote:
      'International segment uses voluntary country, /international hub, or explicit page context — not IP geolocation.',
    overall,
    tier1Markets: tier1,
    topCountries: countryRows
      .filter((r) => r.country?.trim())
      .map((r) => ({ country: r.country as string, count: Number(r.c) })),
    byService: serviceRows
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, count: Number(r.c) })),
    recentLeads: recent,
  }
}
