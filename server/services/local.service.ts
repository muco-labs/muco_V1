import { and, count, desc, eq, ilike, inArray, or, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { leads, proposals } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { ERODE_LOCAL_PAGE_PREFIX, isErodeAttributedLead } from '../lib/local/constants.js'
import { isFullCrmAccessor, getEmployeeProfileId } from './crm.service.js'
import type { AuthContext } from '../middleware/authenticate.js'

async function localLeadScope(auth: AuthContext) {
  if (isFullCrmAccessor(auth)) return undefined
  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) throw new AppError('FORBIDDEN', 'You do not have access.', 403)
  return eq(leads.assignedEmployeeId, employeeId)
}

function erodeLeadCondition() {
  return or(
    ilike(leads.businessCity, '%erode%'),
    ilike(leads.landingPath, `${ERODE_LOCAL_PAGE_PREFIX}%`),
    ilike(leads.pageSource, '%erode%'),
    ilike(leads.referralSource, '%erode%'),
  )!
}

export async function getErodeMarketDashboard(auth: AuthContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await localLeadScope(auth)
  const erodeCond = erodeLeadCondition()
  const base = scope ? and(scope, erodeCond) : erodeCond

  const [totalLeads] = await db.select({ c: count() }).from(leads).where(base)

  const [qualified] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(base, inArray(leads.status, ['qualified', 'discovery', 'proposal', 'negotiation'])))

  const [won] = await db.select({ c: count() }).from(leads).where(and(base, eq(leads.status, 'won')))

  const [lost] = await db.select({ c: count() }).from(leads).where(and(base, eq(leads.status, 'lost')))

  const serviceRows = await db
    .select({ service: leads.serviceInterest, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.serviceInterest)
    .orderBy(desc(count()))

  const sourceRows = await db
    .select({ source: leads.source, c: count() })
    .from(leads)
    .where(base)
    .groupBy(leads.source)
    .orderBy(desc(count()))

  const [pipelineValue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(and(base, inArray(proposals.status, ['sent', 'viewed', 'changes_requested', 'accepted'])))

  const [wonRevenue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(and(base, eq(proposals.status, 'accepted')))

  const recent = await db
    .select({
      id: leads.id,
      name: leads.name,
      status: leads.status,
      serviceInterest: leads.serviceInterest,
      businessCity: leads.businessCity,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(base)
    .orderBy(desc(leads.createdAt))
    .limit(12)

  return {
    label: 'actual' as const,
    attributionNote:
      'Erode segment uses voluntary city, /erode landing paths, or explicit page/referral context — not IP geolocation.',
    totalLeads: totalLeads?.c ?? 0,
    qualifiedLeads: qualified?.c ?? 0,
    wonLeads: won?.c ?? 0,
    lostLeads: lost?.c ?? 0,
    pipelineValue: pipelineValue?.total ?? null,
    wonProposalValue: wonRevenue?.total ?? null,
    byService: serviceRows
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, count: Number(r.c) })),
    bySource: sourceRows.map((r) => ({ source: r.source, count: Number(r.c) })),
    recentLeads: recent,
  }
}

export { isErodeAttributedLead }
