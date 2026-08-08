import { and, count, desc, eq, gte, inArray, lt, lte, notInArray, sql, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  invoices,
  leads,
  payments,
  proposals,
  recurringAgreements,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import type { AuthContext } from '../middleware/authenticate.js'
import { isFullCrmAccessor, getEmployeeProfileId } from './crm.service.js'
import {
  averageDealValue,
  conversionRate,
} from '../lib/sales/metrics.js'
import {
  MIN_SAMPLE_FOR_AVERAGE_DEAL,
  OPEN_OPPORTUNITY_STATUSES,
} from '../lib/sales/constants.js'

async function salesLeadScope(auth: AuthContext) {
  if (isFullCrmAccessor(auth)) return undefined
  const employeeId = await getEmployeeProfileId(auth.userId)
  if (!employeeId) throw new AppError('FORBIDDEN', 'You do not have sales access.', 403)
  return eq(leads.assignedEmployeeId, employeeId)
}

export async function getSalesDashboard(auth: AuthContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const scope = await salesLeadScope(auth)
  const scopeSql = scope ?? sql`true`

  const statusRows = await db
    .select({ status: leads.status, c: count() })
    .from(leads)
    .where(scopeSql)
    .groupBy(leads.status)

  const [openOpportunities] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scopeSql, inArray(leads.status, [...OPEN_OPPORTUNITY_STATUSES])))

  const [pipelineValue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(
      and(
        scopeSql,
        inArray(proposals.status, ['sent', 'viewed', 'changes_requested', 'draft']),
        inArray(leads.status, [...OPEN_OPPORTUNITY_STATUSES, 'proposal', 'negotiation']),
      ),
    )

  const [wonCount] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scopeSql, eq(leads.status, 'won')))

  const [lostCount] = await db
    .select({ c: count() })
    .from(leads)
    .where(and(scopeSql, eq(leads.status, 'lost')))

  const won = Number(wonCount?.c ?? 0)
  const lost = Number(lostCount?.c ?? 0)

  const [wonRevenue] = await db
    .select({ total: sum(proposals.amount) })
    .from(proposals)
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .where(and(scopeSql, eq(proposals.status, 'accepted')))

  const now = new Date()
  const [upcomingCloses] = await db
    .select({ c: count() })
    .from(leads)
    .where(
      and(
        scopeSql,
        inArray(leads.status, [...OPEN_OPPORTUNITY_STATUSES]),
        gte(leads.expectedCloseAt, now),
        lte(leads.expectedCloseAt, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
      ),
    )

  const [overdueFollowUps] = await db
    .select({ c: count() })
    .from(leads)
    .where(
      and(
        scopeSql,
        lt(leads.followUpAt, now),
        inArray(leads.followUpStatus, ['pending', 'due']),
        notInArray(leads.status, ['won', 'lost', 'archived']),
      ),
    )

  const serviceRows = await db
    .select({ service: leads.serviceInterest, c: count() })
    .from(leads)
    .where(and(scopeSql, inArray(leads.status, [...OPEN_OPPORTUNITY_STATUSES, 'won'])))
    .groupBy(leads.serviceInterest)
    .orderBy(desc(count()))

  const lostReasonRows = await db
    .select({ reason: leads.lostReason, c: count() })
    .from(leads)
    .where(and(scopeSql, eq(leads.status, 'lost')))
    .groupBy(leads.lostReason)

  const totalWonRev = Number(wonRevenue?.total ?? 0)

  return {
    label: 'pipeline' as const,
    byStatus: statusRows,
    openOpportunities: openOpportunities?.c ?? 0,
    pipelineValue: pipelineValue?.total ?? null,
    wonRevenue: wonRevenue?.total ?? null,
    wonCount: won,
    lostCount: lost,
    conversionRate: conversionRate(won, lost),
    averageDealValue: averageDealValue(totalWonRev, won),
    averageDealValueNote:
      won < MIN_SAMPLE_FOR_AVERAGE_DEAL
        ? `Shown when at least ${MIN_SAMPLE_FOR_AVERAGE_DEAL} won deals exist.`
        : null,
    upcomingCloses: upcomingCloses?.c ?? 0,
    overdueFollowUps: overdueFollowUps?.c ?? 0,
    byService: serviceRows
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, count: Number(r.c) })),
    lostByReason: lostReasonRows
      .filter((r) => r.reason)
      .map((r) => ({ reason: r.reason as string, count: Number(r.c) })),
    funnel: {
      leads: statusRows.reduce((acc, r) => acc + Number(r.c), 0),
      qualified: statusRows.find((r) => r.status === 'qualified')?.c ?? 0,
      proposals: statusRows.find((r) => r.status === 'proposal')?.c ?? 0,
      won,
      lost,
    },
  }
}

function periodStart(kind: 'month' | 'quarter' | 'year', ref = new Date()) {
  const d = new Date(ref)
  if (kind === 'year') return new Date(d.getFullYear(), 0, 1)
  if (kind === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) * 3
    return new Date(d.getFullYear(), q, 1)
  }
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getRevenueDashboard() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const now = new Date()
  const monthStart = periodStart('month', now)
  const quarterStart = periodStart('quarter', now)
  const yearStart = periodStart('year', now)

  const paidFilter = eq(payments.status, 'succeeded')

  const [monthRev] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(and(paidFilter, gte(payments.createdAt, monthStart)))

  const [quarterRev] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(and(paidFilter, gte(payments.createdAt, quarterStart)))

  const [yearRev] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(and(paidFilter, gte(payments.createdAt, yearStart)))

  const [outstanding] = await db
    .select({ total: sum(invoices.amount) })
    .from(invoices)
    .where(inArray(invoices.status, ['sent', 'partial', 'overdue']))

  const [paidInvoices] = await db
    .select({ c: count() })
    .from(invoices)
    .where(eq(invoices.status, 'paid'))

  const [recurringActive] = await db
    .select({ c: count(), total: sum(recurringAgreements.amount) })
    .from(recurringAgreements)
    .where(eq(recurringAgreements.status, 'active'))

  const [renewalsSoon] = await db
    .select({ c: count() })
    .from(recurringAgreements)
    .where(
      and(
        eq(recurringAgreements.status, 'active'),
        gte(recurringAgreements.renewsAt, now),
        lte(recurringAgreements.renewsAt, new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)),
      ),
    )

  const revenueByService = await db
    .select({ service: leads.serviceInterest, total: sum(payments.amount) })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(proposals, eq(invoices.proposalId, proposals.id))
    .leftJoin(leads, eq(proposals.leadId, leads.id))
    .where(paidFilter)
    .groupBy(leads.serviceInterest)

  return {
    label: 'actual' as const,
    revenueThisMonth: monthRev?.total ?? '0',
    revenueThisQuarter: quarterRev?.total ?? '0',
    revenueThisYear: yearRev?.total ?? '0',
    outstandingInvoices: outstanding?.total ?? '0',
    paidInvoiceCount: paidInvoices?.c ?? 0,
    recurringAgreementsActive: recurringActive?.c ?? 0,
    recurringMrrApprox: recurringActive?.total ?? null,
    renewalsApproaching: renewalsSoon?.c ?? 0,
    revenueByService: revenueByService
      .filter((r) => r.service?.trim())
      .map((r) => ({ service: r.service as string, total: r.total ?? '0' })),
  }
}

export async function getMonthlyManagementReport(auth: AuthContext) {
  const sales = await getSalesDashboard(auth)
  const revenue = await getRevenueDashboard()

  return {
    generatedAt: new Date().toISOString(),
    sales,
    revenue,
    note: 'All figures from live database records. Forecast fields are not mixed with actual revenue.',
  }
}
